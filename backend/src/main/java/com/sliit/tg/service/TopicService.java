package com.sliit.tg.service;

import com.sliit.tg.dto.TopicDto;
import com.sliit.tg.repo.TopicRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TopicService {
    private final TopicRepository repo;

    public TopicService(TopicRepository repo){ this.repo=repo; }

    public List<TopicDto> listTopics(){
        return repo.findAll().stream()
                .map(t -> new TopicDto(t.getId(), t.getName(), t.getDescription()))
                .toList();
    }
}