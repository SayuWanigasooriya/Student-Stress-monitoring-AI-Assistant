package com.sliit.tg.dto;

public class IndicatorResponse {
    private String label;
    private Double confidence;

    public IndicatorResponse() {
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
}
