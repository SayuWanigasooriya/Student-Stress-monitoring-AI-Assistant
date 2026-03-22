package com.sliit.tg.service;

import com.sliit.tg.dto.EmotionResponse;
import com.sliit.tg.model.ChatMessage;
import com.sliit.tg.model.ChatSession;
import com.sliit.tg.repo.ChatMessageRepository;
import com.sliit.tg.repo.ChatSessionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final GeminiService geminiService;
    private final EmotionService emotionService;

    public ChatService(ChatSessionRepository chatSessionRepository,
                       ChatMessageRepository chatMessageRepository,
                       GeminiService geminiService,
                       EmotionService emotionService) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.geminiService = geminiService;
        this.emotionService = emotionService;
    }

    public ChatSession createSession(String topicCode) {
        ChatSession session = new ChatSession(topicCode);
        return chatSessionRepository.save(session);
    }

    public List<ChatMessage> getMessages(Long sessionId) {
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    public String sendMessage(Long sessionId, String message, Map<String, Object> summary) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Chat session not found"));

        // Previous messages are loaded so Gemini can answer with conversation context.
        List<ChatMessage> history =
                chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        ChatMessage userMessage = new ChatMessage(session, "user", message);
        chatMessageRepository.save(userMessage);

        // The chat reply is shaped by both the detected emotion and the structured guidance summary.
        EmotionResponse emotionResult = emotionService.detectEmotion(message);

        String reply = geminiService.getReply(
                session.getTopicCode(),
                history,
                message,
                summary,
                emotionResult
        );

        ChatMessage botMessage = new ChatMessage(session, "bot", reply);
        chatMessageRepository.save(botMessage);

        return reply;
    }
}
