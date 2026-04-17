package com.sliit.tg.dto;

import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long id,
        String sender,
        String message,
        LocalDateTime createdAt
) {
}
