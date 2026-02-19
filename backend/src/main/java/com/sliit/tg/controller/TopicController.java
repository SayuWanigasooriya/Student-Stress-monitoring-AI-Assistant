package com.sliit.tg.controller;

import com.sliit.tg.dto.*;
import com.sliit.tg.service.GuidedSessionService;
import com.sliit.tg.service.TopicService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/topics")
public class TopicController {

    private final TopicService topicService;
    private final GuidedSessionService sessionService;

    public TopicController(TopicService topicService, GuidedSessionService sessionService){
        this.topicService = topicService;
        this.sessionService = sessionService;
    }

    @GetMapping
    public List<TopicDto> listTopics(){
        return topicService.listTopics();
    }

    @PostMapping("/{id}/start")
    public StartSessionResponse start(@PathVariable("id") String topicId,
                                      @Valid @RequestBody StartSessionRequest req){
        return sessionService.startSession(topicId, req.getUserId());
    }
}