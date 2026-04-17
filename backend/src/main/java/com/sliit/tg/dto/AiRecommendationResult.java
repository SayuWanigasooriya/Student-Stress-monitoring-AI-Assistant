package com.sliit.tg.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AiRecommendationResult(
        String ai_message,
        String immediate_delivery_ways,
        List<String> dashboard_suggestions,
        String generation_source
) {
}
