package com.sliit.tg.service;

import com.sliit.tg.model.GuidedSession;
import com.sliit.tg.model.QuestionAnswer;
import com.sliit.tg.model.QuestionType;
import com.sliit.tg.model.Topic;
import com.sliit.tg.model.TopicQuestion;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GuidanceEngineTest {

    private final GuidanceEngine guidanceEngine = new GuidanceEngine();

    @Test
    void analyzeReturnsLowImpactForLightAnswers() {
        List<QuestionAnswer> answers = List.of(
                answer(QuestionType.SCALE, "2"),
                answer(QuestionType.YES_NO, "no")
        );

        GuidanceEngine.Result result = guidanceEngine.analyze("ANXIETY", answers);

        assertThat(result.impactLevel()).isEqualTo("LOW");
        assertThat(result.summary()).contains("manageable level");
        assertThat(result.recommendations()).contains("Try a 60-second grounding: 5-4-3-2-1 senses.");
    }

    @Test
    void analyzeReturnsMediumImpactForMixedAnswers() {
        List<QuestionAnswer> answers = List.of(
                answer(QuestionType.SCALE, "3"),
                answer(QuestionType.YES_NO, "yes")
        );

        GuidanceEngine.Result result = guidanceEngine.analyze("ACADEMIC_STRESS", answers);

        assertThat(result.impactLevel()).isEqualTo("MEDIUM");
        assertThat(result.summary()).contains("moderate impact");
        assertThat(result.recommendations()).hasSize(3);
    }

    @Test
    void analyzeReturnsHighImpactAndExtraRecommendationForHeavyAnswers() {
        List<QuestionAnswer> answers = List.of(
                answer(QuestionType.SCALE, "4"),
                answer(QuestionType.SCALE, "5"),
                answer(QuestionType.YES_NO, "yes")
        );

        GuidanceEngine.Result result = guidanceEngine.analyze("RELATIONSHIPS", answers);

        assertThat(result.impactLevel()).isEqualTo("HIGH");
        assertThat(result.summary()).contains("high impact");
        assertThat(result.recommendations()).contains("If conflict escalates, step back and seek neutral support.");
    }

    private QuestionAnswer answer(QuestionType type, String value) {
        Topic topic = new Topic("ANXIETY", "Anxiety", "Anxiety support");
        TopicQuestion question = new TopicQuestion(topic, 1, type, "Question", null);
        GuidedSession session = new GuidedSession("user-1", topic);
        return new QuestionAnswer(session, question, value);
    }
}
