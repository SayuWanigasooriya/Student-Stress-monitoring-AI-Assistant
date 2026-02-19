package com.sliit.tg.model;

import jakarta.persistence.*;

@Entity
@Table(name="topics")
public class Topic {
    @Id @Column(length=50)
    private String id; // ANXIETY / ACADEMIC_STRESS / RELATIONSHIPS

    @Column(nullable=false, length=100)
    private String name;

    @Column(nullable=false, length=500)
    private String description;

    public Topic() {}
    public Topic(String id, String name, String description){
        this.id=id; this.name=name; this.description=description;
    }

    public String getId(){ return id; }
    public String getName(){ return name; }
    public String getDescription(){ return description; }

    public void setId(String id){ this.id=id; }
    public void setName(String name){ this.name=name; }
    public void setDescription(String description){ this.description=description; }
}