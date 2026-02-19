package com.sliit.tg.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AnswerRequest {
    @NotNull
    private Long questionId;

    @NotBlank
    private String answerValue;

    public Long getQuestionId(){ return questionId; }
    public String getAnswerValue(){ return answerValue; }

    public void setQuestionId(Long questionId){ this.questionId=questionId; }
    public void setAnswerValue(String answerValue){ this.answerValue=answerValue; }
}