package com.sliit.tg.controller;

import com.sliit.tg.model.ChatMessage;
import com.sliit.tg.model.ChatSession;
import com.sliit.tg.service.ChatService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/session")
    public Map<String, Object> createSession(@RequestBody Map<String, String> body) {
        String topicCode = body.get("topicCode");
        if (topicCode == null || topicCode.isBlank()) {
            topicCode = "ACADEMIC_STRESS";
        }

        ChatSession session = chatService.createSession(topicCode);

        return Map.of(
                "sessionId", session.getId(),
                "topicCode", session.getTopicCode()
        );
    }

    @GetMapping("/session/{sessionId}/messages")
    public List<ChatMessage> getMessages(@PathVariable Long sessionId) {
        return chatService.getMessages(sessionId);
    }

    @PostMapping("/message")
    public Map<String, String> sendMessage(@RequestBody Map<String, Object> body) {
        Long sessionId = Long.valueOf(body.get("sessionId").toString());
        String message = body.get("message").toString();

        @SuppressWarnings("unchecked")
        Map<String, Object> summary = (Map<String, Object>) body.get("summary");

        String reply = chatService.sendMessage(sessionId, message, summary);

        return Map.of("reply", reply);
    }
}