package com.sliit.tg.service;

import com.sliit.tg.dto.EmotionResponse;
import com.sliit.tg.dto.GeminiReply;
import com.sliit.tg.model.ChatMessage;
import com.sliit.tg.model.ChatSession;
import com.sliit.tg.repo.ChatMessageRepository;
import com.sliit.tg.repo.ChatSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatSessionRepository chatSessionRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private GeminiService geminiService;
    @Mock
    private EmotionService emotionService;

    @InjectMocks
    private ChatService chatService;

    @Test
    void createSessionPersistsTopicCode() {
        ChatSession saved = new ChatSession("ANXIETY");
        when(chatSessionRepository.save(any(ChatSession.class))).thenReturn(saved);

        ChatSession result = chatService.createSession("ANXIETY");

        assertThat(result.getTopicCode()).isEqualTo("ANXIETY");
        verify(chatSessionRepository).save(any(ChatSession.class));
    }

    @Test
    void sendMessageStoresUserAndBotMessagesAndReturnsReply() {
        ChatSession session = new ChatSession("ANXIETY");
        session.setTopicCode("ANXIETY");
        EmotionResponse emotion = new EmotionResponse();
        emotion.setEmotion("sadness");
        emotion.setScore(0.88);

        List<ChatMessage> history = List.of(new ChatMessage(session, "bot", "How are you feeling today?"));

        when(chatSessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(1L)).thenReturn(history);
        when(emotionService.detectEmotion("I feel overwhelmed")).thenReturn(emotion);
        when(geminiService.getReply("ANXIETY", history, "I feel overwhelmed", Map.of("summary", "demo"), emotion))
                .thenReturn(new GeminiReply("Let's slow this down together.", "gemini", null));

        GeminiReply reply = chatService.sendMessage(1L, "I feel overwhelmed", Map.of("summary", "demo"));

        assertThat(reply.text()).isEqualTo("Let's slow this down together.");

        ArgumentCaptor<ChatMessage> messageCaptor = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatMessageRepository, times(2)).save(messageCaptor.capture());

        List<ChatMessage> savedMessages = messageCaptor.getAllValues();
        assertThat(savedMessages).extracting(ChatMessage::getSender).containsExactly("user", "bot");
        assertThat(savedMessages).extracting(ChatMessage::getMessage)
                .containsExactly("I feel overwhelmed", "Let's slow this down together.");
    }
}
