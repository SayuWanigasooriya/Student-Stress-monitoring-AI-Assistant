package com.sliit.tg.dto;

public class EmotionResponse {
    private String emotion;
    private Double score;

    public EmotionResponse() {
    }

    public String getEmotion() {
        return emotion;
    }

    public void setEmotion(String emotion) {
        this.emotion = emotion;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }
}