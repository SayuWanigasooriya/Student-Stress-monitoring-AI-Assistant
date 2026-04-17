package com.sliit.tg.dto;

import java.util.List;

public record DashboardResponse(
        double wellbeingScore,
        double avgStress,
        double avgEnergy,
        double avgSleep,
        long doneCount,
        long savedCount,
        List<MoodEntryResponse> recentMoods,
        List<RecommendationResponse> recommendations
) {
}
