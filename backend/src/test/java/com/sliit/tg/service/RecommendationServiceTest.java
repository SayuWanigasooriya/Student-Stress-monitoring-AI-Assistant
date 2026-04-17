package com.sliit.tg.service;

import com.sliit.tg.dto.AiRecommendationResult;
import com.sliit.tg.dto.RecommendationBundle;
import com.sliit.tg.dto.RecommendationResponse;
import com.sliit.tg.model.MoodEntry;
import com.sliit.tg.model.Recommendation;
import com.sliit.tg.model.RecommendationStatus;
import com.sliit.tg.model.RecommendationType;
import com.sliit.tg.model.User;
import com.sliit.tg.repo.MoodEntryRepository;
import com.sliit.tg.repo.RecommendationLogRepository;
import com.sliit.tg.repo.RecommendationRepository;
import com.sliit.tg.repo.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private MoodEntryRepository moodEntryRepository;
    @Mock
    private RecommendationRepository recommendationRepository;
    @Mock
    private RecommendationLogRepository recommendationLogRepository;
    @Mock
    private AiRecommendationService aiRecommendationService;

    @InjectMocks
    private RecommendationService recommendationService;

    @Test
    void getRecommendationsUsesAiSuggestionsWhenAvailable() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        when(moodEntryRepository.findByUser_IdOrderByDateDesc(1L)).thenReturn(List.of(moodEntry("stressed", 4, 2, 2)));
        when(recommendationRepository.findByActiveTrue()).thenReturn(List.of(
                recommendation(10L, "Breathing break for heavy stress", RecommendationType.BREATHING, "Default breathing description", 4, 5, null, null, null, null, "stressed"),
                recommendation(11L, "Journal the pressure", RecommendationType.REFLECTION, "Default reflection description", 3, 5, null, null, null, null, null)
        ));
        when(aiRecommendationService.generateRecommendations(org.mockito.ArgumentMatchers.anyList())).thenReturn(Optional.of(
                new AiRecommendationResult(
                        "Try one slower reset before your next task.",
                        "Chat response",
                        List.of("Use the 5-5-5 breathing technique", "Write down what feels heaviest"),
                        "gemini"
                )
        ));
        when(recommendationLogRepository.existsByUser_IdAndRecommendation_IdAndStatus(anyLong(), anyLong(), org.mockito.ArgumentMatchers.eq(RecommendationStatus.SAVED))).thenReturn(false);
        when(recommendationLogRepository.existsByUser_IdAndRecommendation_IdAndStatus(anyLong(), anyLong(), org.mockito.ArgumentMatchers.eq(RecommendationStatus.DONE))).thenReturn(false);

        RecommendationBundle bundle = recommendationService.getRecommendationBundle(1L);
        List<RecommendationResponse> responses = bundle.recommendations();

        assertThat(responses).hasSize(2);
        assertThat(bundle.source()).isEqualTo("gemini");
        assertThat(responses.get(0).type()).isEqualTo(RecommendationType.BREATHING);
        assertThat(responses.get(0).description()).contains("Why this fits now");
        assertThat(responses.get(1).type()).isEqualTo(RecommendationType.REFLECTION);
    }

    @Test
    void getRecommendationsFallsBackToRuleBasedDescriptionsWhenAiServiceUnavailable() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        when(moodEntryRepository.findByUser_IdOrderByDateDesc(1L)).thenReturn(List.of(moodEntry("calm", 2, 4, 4)));
        when(recommendationRepository.findByActiveTrue()).thenReturn(List.of(
                recommendation(21L, "Keep what is already helping", RecommendationType.RECOVERY, "Repeat one habit that supports you today.", null, 3, 3, 5, 3, 5, "calm")
        ));
        when(aiRecommendationService.generateRecommendations(org.mockito.ArgumentMatchers.anyList())).thenReturn(Optional.empty());
        when(recommendationLogRepository.existsByUser_IdAndRecommendation_IdAndStatus(anyLong(), anyLong(), org.mockito.ArgumentMatchers.eq(RecommendationStatus.SAVED))).thenReturn(false);
        when(recommendationLogRepository.existsByUser_IdAndRecommendation_IdAndStatus(anyLong(), anyLong(), org.mockito.ArgumentMatchers.eq(RecommendationStatus.DONE))).thenReturn(false);

        RecommendationBundle bundle = recommendationService.getRecommendationBundle(1L);
        List<RecommendationResponse> responses = bundle.recommendations();

        assertThat(bundle.source()).isEqualTo("fallback");
        assertThat(responses).singleElement().satisfies(response -> {
            assertThat(response.type()).isEqualTo(RecommendationType.RECOVERY);
            assertThat(response.description()).isEqualTo("Repeat one habit that supports you today.");
        });
    }

    private User user() {
        User user = new User();
        user.setId(1L);
        user.setName("Student");
        return user;
    }

    private MoodEntry moodEntry(String mood, int stress, int energy, int sleep) {
        MoodEntry entry = new MoodEntry();
        entry.setMood(mood);
        entry.setStressLevel(stress);
        entry.setEnergyLevel(energy);
        entry.setSleepQuality(sleep);
        entry.setDate(LocalDateTime.now());
        entry.setNotes("Feeling stretched thin");
        entry.setUser(user());
        return entry;
    }

    private Recommendation recommendation(
            Long id,
            String title,
            RecommendationType type,
            String description,
            Integer minStress,
            Integer maxStress,
            Integer minEnergy,
            Integer maxEnergy,
            Integer minSleep,
            Integer maxSleep,
            String targetMood
    ) {
        Recommendation recommendation = new Recommendation();
        recommendation.setId(id);
        recommendation.setTitle(title);
        recommendation.setType(type);
        recommendation.setDescription(description);
        recommendation.setMinStressLevel(minStress);
        recommendation.setMaxStressLevel(maxStress);
        recommendation.setMinEnergyLevel(minEnergy);
        recommendation.setMaxEnergyLevel(maxEnergy);
        recommendation.setMinSleepQuality(minSleep);
        recommendation.setMaxSleepQuality(maxSleep);
        recommendation.setTargetMood(targetMood);
        recommendation.setActive(true);
        return recommendation;
    }
}
