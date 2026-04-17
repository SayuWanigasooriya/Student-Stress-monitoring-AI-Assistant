package com.sliit.tg.dto;

import java.time.LocalDateTime;

public record ChatSessionSummaryResponse(
        Long sessionId,
        String topicCode,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
