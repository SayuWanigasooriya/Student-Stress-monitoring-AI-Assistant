package com.sliit.tg.model;

import jakarta.persistence.*;

@Entity
@Table(name="session_outcomes")
public class SessionOutcome {

    @Id
    @Column(length=80)
    private String sessionId;

    @OneToOne(optional=false)
    @MapsId
    @JoinColumn(name="session_id")
    private GuidedSession session;

    @Column(nullable=false, length=20)
    private String impactLevel;

    @Column(nullable=false, length=500)
    private String summary;

    @Column(nullable=false, length=1200)
    private String recommendationsJson;

    public SessionOutcome() {}

    public SessionOutcome(GuidedSession session, String impactLevel, String summary, String recommendationsJson){
        this.session=session;
        this.impactLevel=impactLevel;
        this.summary=summary;
        this.recommendationsJson=recommendationsJson;
    }

    public String getSessionId(){ return sessionId; }
    public GuidedSession getSession(){ return session; }
    public String getImpactLevel(){ return impactLevel; }
    public String getSummary(){ return summary; }
    public String getRecommendationsJson(){ return recommendationsJson; }

    public void setSessionId(String sessionId){ this.sessionId=sessionId; }
    public void setSession(GuidedSession session){ this.session=session; }
    public void setImpactLevel(String impactLevel){ this.impactLevel=impactLevel; }
    public void setSummary(String summary){ this.summary=summary; }
    public void setRecommendationsJson(String recommendationsJson){ this.recommendationsJson=recommendationsJson; }
}