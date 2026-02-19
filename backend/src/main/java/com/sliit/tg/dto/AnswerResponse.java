package com.sliit.tg.dto;

import java.util.List;

public record AnswerResponse(
        String sessionId,
        String status,            // ACTIVE/COMPLETED
        Integer nextStep,         // null if completed
        QuestionDto nextQuestion, // null if completed
        FinalResultDto finalResult
) {
    public record FinalResultDto(String impactLevel, String summary, List<String> recommendations) {}
}