package com.sliit.tg.dto;

import com.sliit.tg.model.Recommendation;
import com.sliit.tg.model.RecommendationType;

public record RecommendationResponse(
        Long id,
        String title,
        RecommendationType type,
        String description,
        boolean saved,
        boolean done
) {
    public static RecommendationResponse from(Recommendation recommendation, boolean saved, boolean done) {
        return new RecommendationResponse(
                recommendation.getId(),
                recommendation.getTitle(),
                recommendation.getType(),
                recommendation.getDescription(),
                saved,
                done
        );
    }
}
