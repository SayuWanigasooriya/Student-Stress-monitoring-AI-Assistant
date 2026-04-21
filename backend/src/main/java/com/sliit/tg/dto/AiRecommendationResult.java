package com.sliit.tg.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AiRecommendationResult(
        @JsonProperty("ai_message")
        String ai_message,
        @JsonProperty("immediate_delivery_ways")
        String immediate_delivery_ways,
        @JsonProperty("dashboard_suggestions")
        List<String> dashboard_suggestions,
        @JsonProperty("generation_source")
        String generation_source
) {
}
