package com.sliit.tg.dto;

import jakarta.validation.constraints.NotBlank;

public class StartSessionRequest {
    @NotBlank
    private String userId;

    public String getUserId(){ return userId; }
    public void setUserId(String userId){ this.userId=userId; }
}