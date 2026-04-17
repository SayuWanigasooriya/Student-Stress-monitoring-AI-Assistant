package com.sliit.tg.service;

import com.sliit.tg.dto.DashboardResponse;
import com.sliit.tg.dto.MoodEntryResponse;
import com.sliit.tg.dto.RecommendationResponse;
import com.sliit.tg.model.MoodEntry;
import com.sliit.tg.model.RecommendationStatus;
import com.sliit.tg.repo.MoodEntryRepository;
import com.sliit.tg.repo.RecommendationLogRepository;
import com.sliit.tg.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class DashboardService {

    private final MoodEntryRepository moodEntryRepository;
    private final RecommendationLogRepository recommendationLogRepository;
    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    public DashboardService(
            MoodEntryRepository moodEntryRepository,
            RecommendationLogRepository recommendationLogRepository,
            RecommendationService recommendationService,
            UserRepository userRepository
    ) {
        this.moodEntryRepository = moodEntryRepository;
        this.recommendationLogRepository = recommendationLogRepository;
        this.recommendationService = recommendationService;
        this.userRepository = userRepository;
    }

    public DashboardResponse getDashboard(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found."));

        List<MoodEntry> entries = moodEntryRepository.findByUser_IdOrderByDateDesc(userId);
        List<MoodEntryResponse> recentMoods = entries.stream()
                .limit(7)
                .map(MoodEntryResponse::from)
                .toList();

        double avgStress = entries.stream().limit(10).mapToInt(MoodEntry::getStressLevel).average().orElse(0.0);
        double avgEnergy = entries.stream().limit(10).mapToInt(MoodEntry::getEnergyLevel).average().orElse(0.0);
        double avgSleep = entries.stream().limit(10).mapToInt(MoodEntry::getSleepQuality).average().orElse(0.0);
        double wellbeingScore = entries.isEmpty() ? 0.0 : ((6.0 - avgStress) + avgEnergy + avgSleep) / 3.0;

        long doneCount = recommendationLogRepository.countByUser_IdAndStatus(userId, RecommendationStatus.DONE);
        long savedCount = recommendationLogRepository.countByUser_IdAndStatus(userId, RecommendationStatus.SAVED);
        List<RecommendationResponse> recommendations = recommendationService.getRecommendations(userId);

        return new DashboardResponse(
                roundToOneDecimal(wellbeingScore),
                roundToOneDecimal(avgStress),
                roundToOneDecimal(avgEnergy),
                roundToOneDecimal(avgSleep),
                doneCount,
                savedCount,
                recentMoods,
                recommendations
        );
    }

    private double roundToOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
