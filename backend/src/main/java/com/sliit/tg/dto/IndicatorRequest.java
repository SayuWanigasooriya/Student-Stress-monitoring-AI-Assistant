package com.sliit.tg.dto;

public class IndicatorRequest {
    private String text;

    public IndicatorRequest() {
    }

    public IndicatorRequest(String text) {
        this.text = text;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
