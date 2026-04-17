package com.sliit.tg.model;

import jakarta.persistence.*;

@Entity
@Table(name = "recommendations")
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecommendationType type;

    @Column(nullable = false, length = 3000)
    private String description;

    private Integer minStressLevel;

    private Integer maxStressLevel;

    private Integer minEnergyLevel;

    private Integer maxEnergyLevel;

    private Integer minSleepQuality;

    private Integer maxSleepQuality;

    private String targetMood;

    @Column(nullable = false)
    private boolean active = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public RecommendationType getType() {
        return type;
    }

    public void setType(RecommendationType type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getMinStressLevel() {
        return minStressLevel;
    }

    public void setMinStressLevel(Integer minStressLevel) {
        this.minStressLevel = minStressLevel;
    }

    public Integer getMaxStressLevel() {
        return maxStressLevel;
    }

    public void setMaxStressLevel(Integer maxStressLevel) {
        this.maxStressLevel = maxStressLevel;
    }

    public Integer getMinEnergyLevel() {
        return minEnergyLevel;
    }

    public void setMinEnergyLevel(Integer minEnergyLevel) {
        this.minEnergyLevel = minEnergyLevel;
    }

    public Integer getMaxEnergyLevel() {
        return maxEnergyLevel;
    }

    public void setMaxEnergyLevel(Integer maxEnergyLevel) {
        this.maxEnergyLevel = maxEnergyLevel;
    }

    public Integer getMinSleepQuality() {
        return minSleepQuality;
    }

    public void setMinSleepQuality(Integer minSleepQuality) {
        this.minSleepQuality = minSleepQuality;
    }

    public Integer getMaxSleepQuality() {
        return maxSleepQuality;
    }

    public void setMaxSleepQuality(Integer maxSleepQuality) {
        this.maxSleepQuality = maxSleepQuality;
    }

    public String getTargetMood() {
        return targetMood;
    }

    public void setTargetMood(String targetMood) {
        this.targetMood = targetMood;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
