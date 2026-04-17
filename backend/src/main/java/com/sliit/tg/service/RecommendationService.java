package com.sliit.tg.service;

import com.sliit.tg.dto.RecommendationResponse;
import com.sliit.tg.model.*;
import com.sliit.tg.repo.MoodEntryRepository;
import com.sliit.tg.repo.RecommendationLogRepository;
import com.sliit.tg.repo.RecommendationRepository;
import com.sliit.tg.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class RecommendationService {

    private final UserRepository userRepository;
    private final MoodEntryRepository moodEntryRepository;
    private final RecommendationRepository recommendationRepository;
    private final RecommendationLogRepository recommendationLogRepository;

    public RecommendationService(
            UserRepository userRepository,
            MoodEntryRepository moodEntryRepository,
            RecommendationRepository recommendationRepository,
            RecommendationLogRepository recommendationLogRepository
    ) {
        this.userRepository = userRepository;
        this.moodEntryRepository = moodEntryRepository;
        this.recommendationRepository = recommendationRepository;
        this.recommendationLogRepository = recommendationLogRepository;
    }

    public List<RecommendationResponse> getRecommendations(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));

        List<MoodEntry> entries = moodEntryRepository.findByUser_IdOrderByDateDesc(userId);
        MoodEntry latestEntry = entries.isEmpty() ? null : entries.get(0);

        return recommendationRepository.findByActiveTrue().stream()
                .filter(recommendation -> matchesRecommendation(recommendation, latestEntry))
                .sorted(Comparator.comparing(Recommendation::getId))
                .limit(6)
                .map(recommendation -> RecommendationResponse.from(
                        recommendation,
                        recommendationLogRepository.existsByUser_IdAndRecommendation_IdAndStatus(
                                userId, recommendation.getId(), RecommendationStatus.SAVED
                        ),
                        recommendationLogRepository.existsByUser_IdAndRecommendation_IdAndStatus(
                                userId, recommendation.getId(), RecommendationStatus.DONE
                        )
                ))
                .toList();
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
}
