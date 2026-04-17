package com.sliit.tg.dto;

public record GeminiReply(
        String text,
        String source,
        String fallbackReason
) {
}
