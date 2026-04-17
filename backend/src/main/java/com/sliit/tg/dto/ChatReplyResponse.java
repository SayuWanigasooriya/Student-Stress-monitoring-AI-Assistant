package com.sliit.tg.dto;

public record ChatReplyResponse(
        String reply,
        String source,
        String fallbackReason
) {
}
