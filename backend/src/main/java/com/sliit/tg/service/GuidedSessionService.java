package com.sliit.tg.service;

import com.sliit.tg.dto.*;
import com.sliit.tg.model.*;
import com.sliit.tg.repo.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class GuidedSessionService {

    private final TopicRepository topicRepo;
    private final TopicQuestionRepository questionRepo;
    private final GuidedSessionRepository sessionRepo;
    private final QuestionAnswerRepository answerRepo;
    private final SessionOutcomeRepository outcomeRepo;
    private final GuidanceEngine engine;

    public GuidedSessionService(
            TopicRepository topicRepo,
            TopicQuestionRepository questionRepo,
            GuidedSessionRepository sessionRepo,
            QuestionAnswerRepository answerRepo,
            SessionOutcomeRepository outcomeRepo,
            GuidanceEngine engine
    ) {
        this.topicRepo = topicRepo;
        this.questionRepo = questionRepo;
        this.sessionRepo = sessionRepo;
        this.answerRepo = answerRepo;
        this.outcomeRepo = outcomeRepo;
        this.engine = engine;
    }

    public StartSessionResponse startSession(String topicId, String userId) {
        Topic topic = topicRepo.findById(topicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Topic not found: " + topicId));

        // A guided session is created first, then the frontend receives step 1 to begin the flow.
        GuidedSession session = sessionRepo.save(new GuidedSession(userId, topic));

        TopicQuestion q1 = questionRepo.findByTopic_IdAndStepNo(topicId, 1)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Missing step 1 for topic: " + topicId));

        return new StartSessionResponse(session.getId(), toDto(q1));
    }

    public AnswerResponse submitAnswer(String sessionId, AnswerRequest req) {
        GuidedSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        // If the session is already finished, return the stored result instead of recalculating it.
        if (session.getStatus() == SessionStatus.COMPLETED) {
            SessionOutcome out = outcomeRepo.findById(sessionId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Outcome missing"));
            return new AnswerResponse(sessionId, "COMPLETED", null, null,
                    new AnswerResponse.FinalResultDto(out.getImpactLevel(), out.getSummary(),
                            JsonUtil.parseJsonArray(out.getRecommendationsJson())));
        }

        TopicQuestion q = questionRepo.findById(req.getQuestionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

        if (!q.getTopic().getId().equals(session.getTopic().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question does not belong to this session topic");
        }

        // Each answer is saved before deciding whether to continue to the next step or finish the session.
        answerRepo.save(new QuestionAnswer(session, q, req.getAnswerValue()));

        List<TopicQuestion> all = questionRepo.findByTopic_IdOrderByStepNoAsc(session.getTopic().getId());
        int totalSteps = all.size();
        int nextStep = q.getStepNo() + 1;

        session.setCurrentStep(nextStep);

        if (nextStep <= totalSteps) {
            sessionRepo.save(session);
            TopicQuestion nextQ = questionRepo.findByTopic_IdAndStepNo(session.getTopic().getId(), nextStep)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Missing step " + nextStep));
            return new AnswerResponse(sessionId, "ACTIVE", nextStep, toDto(nextQ), null);
        }

        // Once all steps are answered, generate a final impact level, summary, and recommendations.
        session.setStatus(SessionStatus.COMPLETED);
        session.setEndedAt(Instant.now());
        sessionRepo.save(session);

        List<QuestionAnswer> answers = answerRepo.findBySession_IdOrderByAnsweredAtAsc(sessionId);
        GuidanceEngine.Result r = engine.analyze(session.getTopic().getId(), answers);

        SessionOutcome out = new SessionOutcome(session, r.impactLevel(), r.summary(), JsonUtil.toJsonArray(r.recommendations()));
        outcomeRepo.save(out);

        return new AnswerResponse(sessionId, "COMPLETED", null, null,
                new AnswerResponse.FinalResultDto(r.impactLevel(), r.summary(), r.recommendations()));
    }

    private QuestionDto toDto(TopicQuestion q) {
        return new QuestionDto(q.getId(), q.getTopic().getId(), q.getStepNo(), q.getType().name(), q.getText(), q.getOptionsJson());
    }
}
