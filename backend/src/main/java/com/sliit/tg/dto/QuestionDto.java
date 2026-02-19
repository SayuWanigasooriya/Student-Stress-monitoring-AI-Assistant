package com.sliit.tg.dto;

public record QuestionDto(
        Long questionId,
        String topicId,
        int stepNo,
        String type,
        String text,
        String optionsJson
) {}