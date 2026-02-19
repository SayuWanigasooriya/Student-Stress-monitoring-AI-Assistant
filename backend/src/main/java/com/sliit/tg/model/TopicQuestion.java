package com.sliit.tg.model;

import jakarta.persistence.*;

@Entity
@Table(name="topic_questions",
        uniqueConstraints=@UniqueConstraint(columnNames={"topic_id","stepNo"}))
public class TopicQuestion {

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional=false)
    @JoinColumn(name="topic_id")
    private Topic topic;

    @Column(nullable=false)
    private int stepNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=20)
    private QuestionType type;

    @Column(nullable=false, length=800)
    private String text;

    @Column(length=1200)
    private String optionsJson; // JSON string

    public TopicQuestion() {}

    public TopicQuestion(Topic topic, int stepNo, QuestionType type, String text, String optionsJson){
        this.topic=topic; this.stepNo=stepNo; this.type=type; this.text=text; this.optionsJson=optionsJson;
    }

    public Long getId(){ return id; }
    public Topic getTopic(){ return topic; }
    public int getStepNo(){ return stepNo; }
    public QuestionType getType(){ return type; }
    public String getText(){ return text; }
    public String getOptionsJson(){ return optionsJson; }

    public void setId(Long id){ this.id=id; }
    public void setTopic(Topic topic){ this.topic=topic; }
    public void setStepNo(int stepNo){ this.stepNo=stepNo; }
    public void setType(QuestionType type){ this.type=type; }
    public void setText(String text){ this.text=text; }
    public void setOptionsJson(String optionsJson){ this.optionsJson=optionsJson; }
}