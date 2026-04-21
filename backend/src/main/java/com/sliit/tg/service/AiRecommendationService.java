package com.sliit.tg.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.sliit.tg.dto.AiRecommendationRequest;
import com.sliit.tg.dto.AiRecommendationResult;
import com.sliit.tg.model.MoodEntry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalTime;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AiRecommendationService {
    private static final Logger logger = LoggerFactory.getLogger(AiRecommendationService.class);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a", Locale.US);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String generateUrl;

    public AiRecommendationService(@Value("${app.ai-service.generate-url:http://127.0.0.1:8000/api/v1/generate}") String generateUrl) {
        this.generateUrl = generateUrl;
    }

    public Optional<AiRecommendationResult> generateRecommendations(List<MoodEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            return Optional.empty();
        }

        MoodEntry latestEntry = entries.get(0);
        AiRecommendationRequest payload = new AiRecommendationRequest(
                buildUserMessage(latestEntry, entries),
                List.of(normalizeMood(latestEntry.getMood())),
                buildMentalStatus(latestEntry),
                Math.max(1, latestEntry.getStressLevel()),
                buildHistory(entries),
                latestEntry.getDate() == null ? "Unknown" : latestEntry.getDate().toLocalTime().format(TIME_FORMATTER)
        );

        try {
            String json = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(generateUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                logger.warn(
                        "AI recommendation service returned status {} from {} with body: {}",
                        response.statusCode(),
                        generateUrl,
                        response.body()
                );
                return Optional.empty();
            }

            JsonNode payloadNode = objectMapper.readTree(response.body());
            JsonNode aiResponseNode = payloadNode.path("ai_response");

            if (aiResponseNode.isMissingNode() || aiResponseNode.isNull()) {
                logger.warn("AI recommendation service response did not include ai_response payload.");
                return Optional.empty();
            }

            return Optional.ofNullable(objectMapper.treeToValue(aiResponseNode, AiRecommendationResult.class));
        } catch (Exception e) {
            logger.warn("AI recommendation service call failed. Falling back to rule-based recommendations.", e);
            return Optional.empty();
        }
    }

    private String buildUserMessage(MoodEntry latestEntry, List<MoodEntry> entries) {
        String mood = latestEntry.getMood() == null || latestEntry.getMood().isBlank() ? "unclear" : latestEntry.getMood().trim();
        String notes = latestEntry.getNotes() == null || latestEntry.getNotes().isBlank()
                ? "No additional notes were provided."
                : latestEntry.getNotes().trim();

        return "The student most recently reported feeling " + mood
                + " with stress " + latestEntry.getStressLevel() + "/5, energy " + latestEntry.getEnergyLevel()
                + "/5, sleep " + latestEntry.getSleepQuality() + "/5. "
                + "Recent pattern summary: " + buildHistory(entries) + ". "
                + "Latest notes: " + notes;
    }

    private String buildHistory(List<MoodEntry> entries) {
        return entries.stream()
                .limit(5)
                .map(entry -> {
                    String mood = entry.getMood() == null || entry.getMood().isBlank() ? "unknown mood" : entry.getMood().trim();
                    return mood + " (stress " + entry.getStressLevel()
                            + ", energy " + entry.getEnergyLevel()
                            + ", sleep " + entry.getSleepQuality() + ")";
                })
                .collect(Collectors.joining(" -> "));
    }

    private List<String> buildMentalStatus(MoodEntry latestEntry) {
        List<String> statuses = new ArrayList<>();
        if (latestEntry.getStressLevel() >= 4) {
            statuses.add("stress");
        }
        if (latestEntry.getStressLevel() >= 5) {
            statuses.add("overwhelmed");
        }
        if (latestEntry.getEnergyLevel() <= 2) {
            statuses.add("fatigue");
        }
        if (latestEntry.getSleepQuality() <= 2) {
            statuses.add("low sleep");
        }
        if (statuses.isEmpty()) {
            statuses.add("stable");
        }
        return statuses;
    }

    private String normalizeMood(String mood) {
        return mood == null || mood.isBlank() ? "unknown" : mood.trim().toLowerCase(Locale.ROOT);
    }
}
