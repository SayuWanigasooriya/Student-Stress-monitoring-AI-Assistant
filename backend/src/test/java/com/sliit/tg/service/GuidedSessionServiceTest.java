package com.sliit.tg.service;

import com.sliit.tg.dto.AnswerRequest;
import com.sliit.tg.dto.AnswerResponse;
import com.sliit.tg.dto.StartSessionResponse;
import com.sliit.tg.model.GuidedSession;
import com.sliit.tg.model.QuestionAnswer;
import com.sliit.tg.model.QuestionType;
import com.sliit.tg.model.SessionOutcome;
import com.sliit.tg.model.SessionStatus;
import com.sliit.tg.model.Topic;
import com.sliit.tg.model.TopicQuestion;
import com.sliit.tg.repo.GuidedSessionRepository;
import com.sliit.tg.repo.QuestionAnswerRepository;
import com.sliit.tg.repo.SessionOutcomeRepository;
import com.sliit.tg.repo.TopicQuestionRepository;
import com.sliit.tg.repo.TopicRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuidedSessionServiceTest {

    @Mock
    private TopicRepository topicRepository;
    @Mock
    private TopicQuestionRepository topicQuestionRepository;
    @Mock
    private GuidedSessionRepository guidedSessionRepository;
    @Mock
    private QuestionAnswerRepository questionAnswerRepository;
    @Mock
    private SessionOutcomeRepository sessionOutcomeRepository;
    @Mock
    private GuidanceEngine guidanceEngine;

    @InjectMocks
    private GuidedSessionService guidedSessionService;

    @Test
    void startSessionCreatesSessionAndReturnsStepOneQuestion() {
        Topic topic = new Topic("ANXIETY", "Anxiety", "Anxiety support");
        TopicQuestion firstQuestion = topicQuestion(11L, topic, 1, QuestionType.MCQ);
        GuidedSession savedSession = new GuidedSession("user@example.com", topic);
        savedSession.setId("session-1");

        when(topicRepository.findById("ANXIETY")).thenReturn(Optional.of(topic));
        when(guidedSessionRepository.save(any(GuidedSession.class))).thenReturn(savedSession);
        when(topicQuestionRepository.findByTopic_IdAndStepNo("ANXIETY", 1)).thenReturn(Optional.of(firstQuestion));

        StartSessionResponse response = guidedSessionService.startSession("ANXIETY", "user@example.com");

        assertThat(response.sessionId()).isEqualTo("session-1");
        assertThat(response.firstQuestion().questionId()).isEqualTo(11L);
        assertThat(response.firstQuestion().stepNo()).isEqualTo(1);
    }

    @Test
    void submitAnswerReturnsNextQuestionWhileSessionStillActive() {
        Topic topic = new Topic("ANXIETY", "Anxiety", "Anxiety support");
        GuidedSession session = new GuidedSession("user@example.com", topic);
        session.setId("session-1");
        TopicQuestion currentQuestion = topicQuestion(11L, topic, 1, QuestionType.MCQ);
        TopicQuestion nextQuestion = topicQuestion(12L, topic, 2, QuestionType.TEXT);
        AnswerRequest request = new AnswerRequest();
        request.setQuestionId(11L);
        request.setAnswerValue("Sometimes");

        when(guidedSessionRepository.findById("session-1")).thenReturn(Optional.of(session));
        when(topicQuestionRepository.findById(11L)).thenReturn(Optional.of(currentQuestion));
        when(topicQuestionRepository.findByTopic_IdOrderByStepNoAsc("ANXIETY")).thenReturn(List.of(currentQuestion, nextQuestion));
        when(topicQuestionRepository.findByTopic_IdAndStepNo("ANXIETY", 2)).thenReturn(Optional.of(nextQuestion));

        AnswerResponse response = guidedSessionService.submitAnswer("session-1", request);

        assertThat(response.status()).isEqualTo("ACTIVE");
        assertThat(response.nextStep()).isEqualTo(2);
        assertThat(response.nextQuestion().questionId()).isEqualTo(12L);
        assertThat(session.getCurrentStep()).isEqualTo(2);
        verify(questionAnswerRepository).save(any(QuestionAnswer.class));
        verify(guidedSessionRepository).save(session);
    }

    @Test
    void submitAnswerCompletesSessionAndPersistsOutcome() {
        Topic topic = new Topic("ANXIETY", "Anxiety", "Anxiety support");
        GuidedSession session = new GuidedSession("user@example.com", topic);
        session.setId("session-1");
        TopicQuestion onlyQuestion = topicQuestion(11L, topic, 1, QuestionType.SCALE);
        QuestionAnswer storedAnswer = new QuestionAnswer(session, onlyQuestion, "5");
        AnswerRequest request = new AnswerRequest();
        request.setQuestionId(11L);
        request.setAnswerValue("5");

        GuidanceEngine.Result engineResult = new GuidanceEngine.Result(
                "HIGH",
                "High impact summary",
                List.of("Try grounding", "Talk to someone")
        );

        when(guidedSessionRepository.findById("session-1")).thenReturn(Optional.of(session));
        when(topicQuestionRepository.findById(11L)).thenReturn(Optional.of(onlyQuestion));
        when(topicQuestionRepository.findByTopic_IdOrderByStepNoAsc("ANXIETY")).thenReturn(List.of(onlyQuestion));
        when(questionAnswerRepository.findBySession_IdOrderByAnsweredAtAsc("session-1")).thenReturn(List.of(storedAnswer));
        when(guidanceEngine.analyze("ANXIETY", List.of(storedAnswer))).thenReturn(engineResult);

        AnswerResponse response = guidedSessionService.submitAnswer("session-1", request);

        assertThat(response.status()).isEqualTo("COMPLETED");
        assertThat(response.finalResult()).isNotNull();
        assertThat(response.finalResult().impactLevel()).isEqualTo("HIGH");
        assertThat(session.getStatus()).isEqualTo(SessionStatus.COMPLETED);
        assertThat(session.getEndedAt()).isNotNull();

        ArgumentCaptor<SessionOutcome> outcomeCaptor = ArgumentCaptor.forClass(SessionOutcome.class);
        verify(sessionOutcomeRepository).save(outcomeCaptor.capture());
        assertThat(outcomeCaptor.getValue().getSummary()).isEqualTo("High impact summary");
        assertThat(outcomeCaptor.getValue().getRecommendationsJson()).contains("Try grounding");
    }

    @Test
    void submitAnswerReturnsStoredOutcomeForCompletedSession() {
        Topic topic = new Topic("ANXIETY", "Anxiety", "Anxiety support");
        GuidedSession session = new GuidedSession("user@example.com", topic);
        session.setId("session-1");
        session.setStatus(SessionStatus.COMPLETED);

        SessionOutcome outcome = new SessionOutcome(session, "MEDIUM", "Stored summary", "[\"rec 1\",\"rec 2\"]");
        outcome.setSessionId("session-1");

        AnswerRequest request = new AnswerRequest();
        request.setQuestionId(11L);
        request.setAnswerValue("ignored");

        when(guidedSessionRepository.findById("session-1")).thenReturn(Optional.of(session));
        when(sessionOutcomeRepository.findById("session-1")).thenReturn(Optional.of(outcome));

        AnswerResponse response = guidedSessionService.submitAnswer("session-1", request);

        assertThat(response.status()).isEqualTo("COMPLETED");
        assertThat(response.finalResult().summary()).isEqualTo("Stored summary");
        assertThat(response.finalResult().recommendations()).containsExactly("rec 1", "rec 2");
    }

    private TopicQuestion topicQuestion(Long id, Topic topic, int step, QuestionType type) {
        TopicQuestion question = new TopicQuestion(topic, step, type, "Question " + step, "[\"A\",\"B\"]");
        question.setId(id);
        return question;
    }
}
