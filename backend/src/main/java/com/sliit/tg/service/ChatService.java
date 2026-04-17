package com.sliit.tg.service;

import com.sliit.tg.dto.ChatSessionSummaryResponse;
import com.sliit.tg.dto.EmotionResponse;
import com.sliit.tg.dto.GeminiReply;
import com.sliit.tg.model.ChatMessage;
import com.sliit.tg.model.ChatSession;
import com.sliit.tg.repo.ChatMessageRepository;
import com.sliit.tg.repo.ChatSessionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    public List<ChatSessionSummaryResponse> getSessionSummaries() {
        return chatSessionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(session -> {
                    List<ChatMessage> messages = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId());
                    Optional<ChatMessage> firstUserMessage = messages.stream()
                            .filter(message -> "user".equalsIgnoreCase(message.getSender()))
                            .findFirst();
                    ChatMessage latestMessage = messages.isEmpty() ? null : messages.get(messages.size() - 1);

                    String title = firstUserMessage
                            .map(message -> abbreviate(message.getMessage(), 42))
                            .orElse("New chat");

                    return new ChatSessionSummaryResponse(
                            session.getId(),
                            session.getTopicCode(),
                            title,
                            session.getCreatedAt(),
                            latestMessage != null ? latestMessage.getCreatedAt() : session.getCreatedAt()
                    );
                })
                .toList();
    }

    public GeminiReply sendMessage(Long sessionId, String message, Map<String, Object> summary) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Chat session not found"));

        // Previous messages are loaded so Gemini can answer with conversation context.
        List<ChatMessage> history =
                chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        ChatMessage userMessage = new ChatMessage(session, "user", message);
        chatMessageRepository.save(userMessage);

        // The chat reply is shaped by both the detected emotion and the structured guidance summary.
        EmotionResponse emotionResult = emotionService.detectEmotion(message);

        GeminiReply reply = geminiService.getReply(
                session.getTopicCode(),
                history,
                message,
                summary,
                emotionResult
        );

        ChatMessage botMessage = new ChatMessage(session, "bot", reply.text());
        chatMessageRepository.save(botMessage);

        return reply;
    }

    private String abbreviate(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "New chat";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxLength) {
            return trimmed;
        }
        return trimmed.substring(0, maxLength - 1) + "…";
    }
}
