package com.sliit.tg.dto;

import com.sliit.tg.model.MoodEntry;

import java.time.LocalDateTime;

public class MoodEntryResponse {

    private Long id;
    private Long userId;
    private String userName;
    private LocalDateTime date;
    private String mood;
    private Integer stressLevel;
    private Integer energyLevel;
    private Integer sleepQuality;
    private String notes;

    public static MoodEntryResponse from(MoodEntry entry) {
        MoodEntryResponse response = new MoodEntryResponse();
        response.setId(entry.getId());
        response.setUserId(entry.getUser().getId());
        response.setUserName(entry.getUser().getName());
        response.setDate(entry.getDate());
        response.setMood(entry.getMood());
        response.setStressLevel(entry.getStressLevel());
        response.setEnergyLevel(entry.getEnergyLevel());
        response.setSleepQuality(entry.getSleepQuality());
        response.setNotes(entry.getNotes());
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public String getMood() {
        return mood;
    }

    public void setMood(String mood) {
        this.mood = mood;
    }

    public Integer getStressLevel() {
        return stressLevel;
    }

    public void setStressLevel(Integer stressLevel) {
        this.stressLevel = stressLevel;
    }

    public Integer getEnergyLevel() {
        return energyLevel;
    }

    public void setEnergyLevel(Integer energyLevel) {
        this.energyLevel = energyLevel;
    }

    public Integer getSleepQuality() {
        return sleepQuality;
    }

    public void setSleepQuality(Integer sleepQuality) {
        this.sleepQuality = sleepQuality;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
