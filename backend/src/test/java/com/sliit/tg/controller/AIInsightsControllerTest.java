package com.sliit.tg.controller;

import com.sliit.tg.model.MoodEntry;
import com.sliit.tg.model.User;
import com.sliit.tg.repo.MoodEntryRepository;
import com.sliit.tg.repo.UserRepository;
import com.sliit.tg.service.GeminiService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AIInsightsControllerTest {

    @Mock
    private GeminiService geminiService;
    @Mock
    private MoodEntryRepository moodEntryRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AIInsightsController aiInsightsController;

    @Test
    void getAiInsightsReturnsBadRequestForMissingUser() {
        when(userRepository.existsById(99L)).thenReturn(false);

        ResponseEntity<?> response = aiInsightsController.getAIInsights(99L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isEqualTo(Map.of("message", "User not found."));
    }

    @Test
    void getAiInsightsReturnsEmptyStateWhenNoEntriesExist() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(moodEntryRepository.findByUser_IdOrderByDateDesc(1L)).thenReturn(List.of());

        ResponseEntity<?> response = aiInsightsController.getAIInsights(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isInstanceOf(Map.class);
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body.keySet()).contains("insights", "affirmations", "suggestions", "summary");
    }

    @Test
    void getAiInsightsFallsBackWhenGeminiGenerationFails() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(moodEntryRepository.findByUser_IdOrderByDateDesc(1L)).thenReturn(List.of(
                moodEntry("Stressed", 4, 2, 2, LocalDateTime.now()),
                moodEntry("Okay", 4, 3, 3, LocalDateTime.now().minusDays(1))
        ));
        when(geminiService.generateMoodInsights(org.mockito.ArgumentMatchers.anyList()))
                .thenThrow(new IllegalStateException("Gemini unavailable"));

        ResponseEntity<?> response = aiInsightsController.getAIInsights(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body).containsKey("summary");
        Map<String, Object> summary = (Map<String, Object>) body.get("summary");
        assertThat(summary.get("text").toString()).contains("stressed");
        assertThat(body.get("insights").toString()).contains("Stress is running high");
    }

    @Test
    void getAiInsightsReturnsGeminiPayloadWhenAvailable() {
        Map<String, Object> aiPayload = Map.of(
                "insights", List.of(Map.of("title", "Pattern found")),
                "affirmations", List.of("Keep going"),
                "suggestions", List.of(Map.of("title", "Pause")),
                "summary", Map.of("text", "AI summary")
        );

        when(userRepository.existsById(1L)).thenReturn(true);
        when(moodEntryRepository.findByUser_IdOrderByDateDesc(1L)).thenReturn(List.of(
                moodEntry("Calm", 2, 4, 4, LocalDateTime.now())
        ));
        when(geminiService.generateMoodInsights(org.mockito.ArgumentMatchers.anyList())).thenReturn(aiPayload);

        ResponseEntity<?> response = aiInsightsController.getAIInsights(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(aiPayload);
    }

    private MoodEntry moodEntry(String mood, int stress, int energy, int sleep, LocalDateTime date) {
        User user = new User();
        user.setId(1L);
        user.setName("Test User");

        MoodEntry entry = new MoodEntry();
        entry.setUser(user);
        entry.setMood(mood);
        entry.setStressLevel(stress);
        entry.setEnergyLevel(energy);
        entry.setSleepQuality(sleep);
        entry.setDate(date);
        entry.setNotes("note");
        return entry;
    }
}
