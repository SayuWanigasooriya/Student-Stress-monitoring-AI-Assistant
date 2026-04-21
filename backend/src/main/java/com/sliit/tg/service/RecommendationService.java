package com.sliit.tg.service;

import com.sliit.tg.dto.AiRecommendationResult;
import com.sliit.tg.dto.RecommendationBundle;
import com.sliit.tg.dto.RecommendationResponse;
import com.sliit.tg.model.*;
import com.sliit.tg.repo.ChatMessageRepository;
import com.sliit.tg.repo.ChatSessionRepository;
import com.sliit.tg.repo.GuidedSessionRepository;
import com.sliit.tg.repo.MoodEntryRepository;
import com.sliit.tg.repo.RecommendationLogRepository;
import com.sliit.tg.repo.RecommendationRepository;
import com.sliit.tg.repo.SessionOutcomeRepository;
import com.sliit.tg.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class RecommendationService {
    private static final Pattern WORD_PATTERN = Pattern.compile("[a-zA-Z']+");

    private final UserRepository userRepository;
    private final MoodEntryRepository moodEntryRepository;
    private final RecommendationRepository recommendationRepository;
    private final RecommendationLogRepository recommendationLogRepository;
    private final GuidedSessionRepository guidedSessionRepository;
    private final SessionOutcomeRepository sessionOutcomeRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AiRecommendationService aiRecommendationService;

    public RecommendationService(
            UserRepository userRepository,
            MoodEntryRepository moodEntryRepository,
            RecommendationRepository recommendationRepository,
            RecommendationLogRepository recommendationLogRepository,
            GuidedSessionRepository guidedSessionRepository,
            SessionOutcomeRepository sessionOutcomeRepository,
            ChatSessionRepository chatSessionRepository,
            ChatMessageRepository chatMessageRepository,
            AiRecommendationService aiRecommendationService
    ) {
        this.userRepository = userRepository;
        this.moodEntryRepository = moodEntryRepository;
        this.recommendationRepository = recommendationRepository;
        this.recommendationLogRepository = recommendationLogRepository;
        this.guidedSessionRepository = guidedSessionRepository;
        this.sessionOutcomeRepository = sessionOutcomeRepository;
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.aiRecommendationService = aiRecommendationService;
    }

    public List<RecommendationResponse> getRecommendations(Long userId) {
        return getRecommendationBundle(userId).recommendations();
    }

    public RecommendationBundle getRecommendationBundle(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));

        List<MoodEntry> entries = moodEntryRepository.findByUser_IdOrderByDateDesc(userId);
        MoodEntry latestEntry = entries.isEmpty() ? null : entries.get(0);
        List<Recommendation> allRecommendations = recommendationRepository.findByActiveTrue().stream()
                .sorted(Comparator.comparing(Recommendation::getId))
                .toList();
        List<Recommendation> matchedRecommendations = buildRecommendationCandidates(userId, latestEntry, allRecommendations);

        return aiRecommendationService.generateRecommendations(entries)
                .map(aiResult -> new RecommendationBundle(
                        buildAiBackedRecommendations(userId, matchedRecommendations, aiResult),
                        "gemini".equalsIgnoreCase(aiResult.generation_source()) ? "gemini" : "fallback"
                ))
                .filter(bundle -> !bundle.recommendations().isEmpty())
                .orElseGet(() -> new RecommendationBundle(
                        buildRuleBasedRecommendations(userId, matchedRecommendations),
                        "fallback"
                ));
    }

    private List<Recommendation> buildRecommendationCandidates(Long userId, MoodEntry latestEntry, List<Recommendation> allRecommendations) {
        Map<Long, Recommendation> ordered = new LinkedHashMap<>();

        for (Recommendation recommendation : allRecommendations) {
            if (matchesRecommendation(recommendation, latestEntry)) {
                ordered.put(recommendation.getId(), recommendation);
            }
        }

        mergeGuidedSessionRecommendations(userId, allRecommendations, ordered);
        mergeFreeChatRecommendations(allRecommendations, ordered);

        return new ArrayList<>(ordered.values());
    }

    public void markDone(Long recommendationId, Long userId, String feedback) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));
        Recommendation recommendation = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Recommendation not found."));

        RecommendationLog log = new RecommendationLog();
        log.setUser(user);
        log.setRecommendation(recommendation);
        log.setStatus(RecommendationStatus.DONE);
        log.setFeedback(feedback == null ? null : feedback.trim());
        recommendationLogRepository.save(log);
    }

    public void save(Long recommendationId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));
        Recommendation recommendation = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Recommendation not found."));

        boolean exists = recommendationLogRepository.existsByUser_IdAndRecommendation_IdAndStatus(
                userId, recommendationId, RecommendationStatus.SAVED
        );

        if (!exists) {
            RecommendationLog log = new RecommendationLog();
            log.setUser(user);
            log.setRecommendation(recommendation);
            log.setStatus(RecommendationStatus.SAVED);
            recommendationLogRepository.save(log);
        }
    }

    private boolean matchesRecommendation(Recommendation recommendation, MoodEntry latestEntry) {
        if (latestEntry == null) {
            return recommendation.getMinStressLevel() == null
                    && recommendation.getMinEnergyLevel() == null
                    && recommendation.getMinSleepQuality() == null
                    && recommendation.getTargetMood() == null;
        }

        if (!matchesRange(latestEntry.getStressLevel(), recommendation.getMinStressLevel(), recommendation.getMaxStressLevel())) {
            return false;
        }
        if (!matchesRange(latestEntry.getEnergyLevel(), recommendation.getMinEnergyLevel(), recommendation.getMaxEnergyLevel())) {
            return false;
        }
        if (!matchesRange(latestEntry.getSleepQuality(), recommendation.getMinSleepQuality(), recommendation.getMaxSleepQuality())) {
            return false;
        }

        if (recommendation.getTargetMood() != null && !recommendation.getTargetMood().isBlank()) {
            String latestMood = latestEntry.getMood() == null ? "" : latestEntry.getMood().toLowerCase(Locale.ROOT);
            String expectedMood = recommendation.getTargetMood().toLowerCase(Locale.ROOT);
            return latestMood.contains(expectedMood);
        }

        return true;
    }

    private boolean matchesRange(Integer value, Integer min, Integer max) {
        if (value == null) {
            return min == null && max == null;
        }
        if (min != null && value < min) {
            return false;
        }
        if (max != null && value > max) {
            return false;
        }
        return true;
    }

    private void mergeGuidedSessionRecommendations(Long userId, List<Recommendation> allRecommendations, Map<Long, Recommendation> ordered) {
        List<GuidedSession> sessions = guidedSessionRepository.findAllByUserIdAndStatusOrderByStartedAtDesc(
                String.valueOf(userId),
                SessionStatus.COMPLETED
        );

        int sessionLimit = Math.min(3, sessions.size());
        for (int i = 0; i < sessionLimit; i++) {
            GuidedSession session = sessions.get(i);
            sessionOutcomeRepository.findById(session.getId())
                    .ifPresent(outcome -> {
                        List<String> hints = new ArrayList<>(JsonUtil.parseJsonArray(outcome.getRecommendationsJson()));
                        hints.add(outcome.getSummary());
                        hints.add(session.getTopic().getName());
                        mergeHintsIntoRecommendations(hints, allRecommendations, ordered);
                    });
        }
    }

    private void mergeFreeChatRecommendations(List<Recommendation> allRecommendations, Map<Long, Recommendation> ordered) {
        List<ChatSession> recentSessions = chatSessionRepository.findAllByOrderByCreatedAtDesc();
        int sessionLimit = Math.min(2, recentSessions.size());
        List<String> hints = new ArrayList<>();

        for (int i = 0; i < sessionLimit; i++) {
            ChatSession session = recentSessions.get(i);
            hints.addAll(topicHints(session.getTopicCode()));

            List<ChatMessage> messages = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId());
            for (ChatMessage message : messages) {
                if ("user".equalsIgnoreCase(message.getSender())) {
                    hints.add(message.getMessage());
                }
            }
        }

        mergeHintsIntoRecommendations(hints, allRecommendations, ordered);
    }

    private List<String> topicHints(String topicCode) {
        if (topicCode == null || topicCode.isBlank()) {
            return List.of();
        }

        String normalized = topicCode.toLowerCase(Locale.ROOT);
        if (normalized.contains("anxiety")) {
            return List.of(
                    "Breathing break for heavy stress",
                    "Use grounding when anxiety feels intense",
                    "Reach out before carrying it alone"
            );
        }
        if (normalized.contains("academic")) {
            return List.of(
                    "Micro reset before the next task",
                    "Protect your energy window",
                    "Journal the pressure"
            );
        }
        if (normalized.contains("relationship")) {
            return List.of(
                    "Reach out before carrying it alone",
                    "Low-friction reflection",
                    "Journal the pressure"
            );
        }
        return List.of(topicCode);
    }

    private void mergeHintsIntoRecommendations(List<String> hints, List<Recommendation> allRecommendations, Map<Long, Recommendation> ordered) {
        Set<Long> usedIds = new HashSet<>(ordered.keySet());

        for (String hint : hints) {
            Recommendation match = findBestMatch(hint, allRecommendations, usedIds);
            if (match == null) {
                continue;
            }
            ordered.putIfAbsent(match.getId(), match);
            usedIds.add(match.getId());
        }
    }

    private List<RecommendationResponse> buildAiBackedRecommendations(
            Long userId,
            List<Recommendation> matchedRecommendations,
            AiRecommendationResult aiResult
    ) {
        if (matchedRecommendations.isEmpty()) {
            return List.of();
        }

        List<String> aiSuggestions = aiResult.dashboard_suggestions() == null ? List.of() : aiResult.dashboard_suggestions();
        List<RecommendationResponse> personalized = new java.util.ArrayList<>();
        Set<Long> usedIds = new HashSet<>();

        for (String suggestion : aiSuggestions) {
            Recommendation match = findBestMatch(suggestion, matchedRecommendations, usedIds);
            if (match == null) {
                continue;
            }

            usedIds.add(match.getId());
            personalized.add(toResponse(userId, match, suggestion));
        }

        for (Recommendation recommendation : matchedRecommendations) {
            if (usedIds.contains(recommendation.getId())) {
                continue;
            }
            personalized.add(toResponse(userId, recommendation, recommendation.getDescription()));
        }

        if (!personalized.isEmpty() && aiResult.ai_message() != null && !aiResult.ai_message().isBlank()) {
            RecommendationResponse top = personalized.get(0);
            personalized.set(0, new RecommendationResponse(
                    top.id(),
                    top.title(),
                    top.type(),
                    mergeDescription(top.description(), aiResult.ai_message()),
                    top.saved(),
                    top.done()
            ));
        }

        return personalized.stream().limit(6).toList();
    }

    private Recommendation findBestMatch(String suggestion, List<Recommendation> candidates, Set<Long> usedIds) {
        Recommendation bestRecommendation = null;
        int bestScore = 0;

        for (Recommendation candidate : candidates) {
            if (usedIds.contains(candidate.getId())) {
                continue;
            }

            int score = similarityScore(suggestion, candidate);
            if (score > bestScore) {
                bestScore = score;
                bestRecommendation = candidate;
            }
        }

        return bestScore > 0 ? bestRecommendation : null;
    }

    private int similarityScore(String suggestion, Recommendation candidate) {
        Set<String> suggestionTokens = tokenize(suggestion);
        if (suggestionTokens.isEmpty()) {
            return 0;
        }

        Set<String> candidateTokens = tokenize(
                candidate.getTitle() + " " + candidate.getDescription() + " " + candidate.getType().name()
        );

        int overlap = 0;
        for (String token : suggestionTokens) {
            if (candidateTokens.contains(token)) {
                overlap++;
            }
        }

        String normalizedSuggestion = suggestion == null ? "" : suggestion.toLowerCase(Locale.ROOT);
        String candidateType = candidate.getType().name().toLowerCase(Locale.ROOT);
        if (normalizedSuggestion.contains("breath") && candidateType.contains("breathing")) {
            overlap += 3;
        }
        if (normalizedSuggestion.contains("journal") && candidateType.contains("reflection")) {
            overlap += 3;
        }
        if (normalizedSuggestion.contains("friend") && candidateType.contains("connection")) {
            overlap += 3;
        }
        if (normalizedSuggestion.contains("rest") && candidateType.contains("recovery")) {
            overlap += 3;
        }

        return overlap;
    }

    private Set<String> tokenize(String value) {
        Set<String> tokens = new HashSet<>();
        if (value == null || value.isBlank()) {
            return tokens;
        }

        Matcher matcher = WORD_PATTERN.matcher(value.toLowerCase(Locale.ROOT));
        while (matcher.find()) {
            String token = matcher.group();
            if (token.length() > 2) {
                tokens.add(token);
            }
        }
        return tokens;
    }

    private String mergeDescription(String baseDescription, String aiMessage) {
        String condensed = aiMessage.strip().replaceAll("\\s+", " ");
        if (condensed.length() > 220) {
            condensed = condensed.substring(0, 217).strip() + "...";
        }
        return baseDescription + " Why this fits now: " + condensed;
    }

    private List<RecommendationResponse> buildRuleBasedRecommendations(Long userId, List<Recommendation> matchedRecommendations) {
        return matchedRecommendations.stream()
                .limit(6)
                .map(recommendation -> toResponse(userId, recommendation, recommendation.getDescription()))
                .toList();
    }

    private RecommendationResponse toResponse(Long userId, Recommendation recommendation, String description) {
        return new RecommendationResponse(
                recommendation.getId(),
                recommendation.getTitle(),
                recommendation.getType(),
                description,
                recommendationLogRepository.existsByUser_IdAndRecommendation_IdAndStatus(
                        userId, recommendation.getId(), RecommendationStatus.SAVED
                ),
                recommendationLogRepository.existsByUser_IdAndRecommendation_IdAndStatus(
                        userId, recommendation.getId(), RecommendationStatus.DONE
                )
        );
    }
}
