package com.sliit.tg.dto;

import java.util.List;

public record AiRecommendationRequest(
        String user_message,
        List<String> detected_emotions,
        List<String> mental_status,
        int intensity,
        String history,
        String time_of_day
) {
}
