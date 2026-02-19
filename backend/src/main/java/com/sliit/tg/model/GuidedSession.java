package com.sliit.tg.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="guided_sessions")
public class GuidedSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable=false, length=80)
    private String userId;

    @ManyToOne(optional=false)
    @JoinColumn(name="topic_id")
    private Topic topic;

    @Column(nullable=false)
    private int currentStep;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=20)
    private SessionStatus status;

    @Column(nullable=false)
    private Instant startedAt;

    private Instant endedAt;

    public GuidedSession() {}

    public GuidedSession(String userId, Topic topic) {
        this.userId=userId;
        this.topic=topic;
        this.currentStep=1;
        this.status=SessionStatus.ACTIVE;
        this.startedAt=Instant.now();
    }

    public String getId(){ return id; }
    public String getUserId(){ return userId; }
    public Topic getTopic(){ return topic; }
    public int getCurrentStep(){ return currentStep; }
    public SessionStatus getStatus(){ return status; }
    public Instant getStartedAt(){ return startedAt; }
    public Instant getEndedAt(){ return endedAt; }

    public void setId(String id){ this.id=id; }
    public void setUserId(String userId){ this.userId=userId; }
    public void setTopic(Topic topic){ this.topic=topic; }
    public void setCurrentStep(int currentStep){ this.currentStep=currentStep; }
    public void setStatus(SessionStatus status){ this.status=status; }
    public void setStartedAt(Instant startedAt){ this.startedAt=startedAt; }
    public void setEndedAt(Instant endedAt){ this.endedAt=endedAt; }
}