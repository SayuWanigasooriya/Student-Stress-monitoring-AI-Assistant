package com.sliit.tg.controller;

import com.sliit.tg.dto.AnswerRequest;
import com.sliit.tg.dto.AnswerResponse;
import com.sliit.tg.service.GuidedSessionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sessions")
public class SessionController {

    private final GuidedSessionService sessionService;

    public SessionController(GuidedSessionService sessionService){
        this.sessionService = sessionService;
    }

    @PostMapping("/{sessionId}/answer")
    public AnswerResponse answer(@PathVariable String sessionId,
                                 @Valid @RequestBody AnswerRequest req){
        return sessionService.submitAnswer(sessionId, req);
    }
}