package com.sliit.tg.dto;

import java.util.List;

public record RecommendationBundle(
        List<RecommendationResponse> recommendations,
        String source
) {
}
