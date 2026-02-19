package com.sliit.tg.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="question_answers")
public class QuestionAnswer {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional=false)
    @JoinColumn(name="session_id")
    private GuidedSession session;

    @ManyToOne(optional=false)
    @JoinColumn(name="question_id")
    private TopicQuestion question;

    @Column(nullable=false, length=1200)
    private String answerValue;

    @Column(nullable=false)
    private Instant answeredAt;

    public QuestionAnswer() {}

    public QuestionAnswer(GuidedSession session, TopicQuestion question, String answerValue){
        this.session=session;
        this.question=question;
        this.answerValue=answerValue;
        this.answeredAt=Instant.now();
    }

    public Long getId(){ return id; }
    public GuidedSession getSession(){ return session; }
    public TopicQuestion getQuestion(){ return question; }
    public String getAnswerValue(){ return answerValue; }
    public Instant getAnsweredAt(){ return answeredAt; }

    public void setId(Long id){ this.id=id; }
    public void setSession(GuidedSession session){ this.session=session; }
    public void setQuestion(TopicQuestion question){ this.question=question; }
    public void setAnswerValue(String answerValue){ this.answerValue=answerValue; }
    public void setAnsweredAt(Instant answeredAt){ this.answeredAt=answeredAt; }
}