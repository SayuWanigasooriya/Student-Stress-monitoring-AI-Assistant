package com.sliit.tg.dto;

import jakarta.validation.constraints.NotNull;

public class RecommendationActionRequest {

    @NotNull
    private Long userId;

    private String feedback;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
