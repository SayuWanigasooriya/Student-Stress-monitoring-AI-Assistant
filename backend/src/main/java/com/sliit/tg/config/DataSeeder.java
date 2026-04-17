package com.sliit.tg.config;

import com.sliit.tg.model.*;
import com.sliit.tg.repo.RecommendationRepository;
import com.sliit.tg.repo.TopicQuestionRepository;
import com.sliit.tg.repo.TopicRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final TopicRepository topicRepo;
    private final TopicQuestionRepository qRepo;
    private final RecommendationRepository recommendationRepository;

    public DataSeeder(TopicRepository topicRepo, TopicQuestionRepository qRepo, RecommendationRepository recommendationRepository){
        this.topicRepo = topicRepo;
        this.qRepo = qRepo;
        this.recommendationRepository = recommendationRepository;
    }

    @Override
    public void run(String... args) {

        if (topicRepo.count() == 0) {
            Topic anxiety = new Topic("ANXIETY", "Anxiety",
                    "Guided support to understand anxiety and choose coping steps.");
            Topic academic = new Topic("ACADEMIC_STRESS", "Academic Stress",
                    "Guided support to manage deadlines, exams, and workload.");
            Topic relationships = new Topic("RELATIONSHIPS", "Relationships",
                    "Guided support for conflict, communication, and boundaries.");

            topicRepo.save(anxiety);
            topicRepo.save(academic);
            topicRepo.save(relationships);

            // ANXIETY (6)
            qRepo.save(new TopicQuestion(anxiety, 1, QuestionType.MCQ, "What best describes your anxiety right now?",
                    "[\"Upcoming event\",\"Social situation\",\"Health worry\",\"Unknown\",\"Other\"]"));
            qRepo.save(new TopicQuestion(anxiety, 2, QuestionType.SCALE, "How intense is it right now? (1 low - 5 high)",
                    "{\"min\":1,\"max\":5}"));
            qRepo.save(new TopicQuestion(anxiety, 3, QuestionType.MCQ, "Which symptoms do you notice most?",
                    "[\"Fast heartbeat\",\"Overthinking\",\"Restlessness\",\"Tight chest\",\"Nausea\",\"None\"]"));
            qRepo.save(new TopicQuestion(anxiety, 4, QuestionType.MCQ, "How long have you felt this way?",
                    "[\"< 1 hour\",\"Today\",\"Few days\",\"More than a week\"]"));
            qRepo.save(new TopicQuestion(anxiety, 5, QuestionType.YES_NO, "Is it affecting sleep or appetite? (Yes/No)",
                    "[\"Yes\",\"No\"]"));
            qRepo.save(new TopicQuestion(anxiety, 6, QuestionType.TEXT, "What’s one thought going through your mind right now?", null));

            // ACADEMIC_STRESS (6)
            qRepo.save(new TopicQuestion(academic, 1, QuestionType.MCQ, "What is stressing you most?",
                    "[\"Exams\",\"Deadlines\",\"Workload\",\"Group work\",\"Attendance\",\"Other\"]"));
            qRepo.save(new TopicQuestion(academic, 2, QuestionType.SCALE, "Stress level today? (1 low - 5 high)",
                    "{\"min\":1,\"max\":5}"));
            qRepo.save(new TopicQuestion(academic, 3, QuestionType.YES_NO, "Do you have a deadline within 72 hours? (Yes/No)",
                    "[\"Yes\",\"No\"]"));
            qRepo.save(new TopicQuestion(academic, 4, QuestionType.YES_NO, "Is stress affecting sleep or focus? (Yes/No)",
                    "[\"Yes\",\"No\"]"));
            qRepo.save(new TopicQuestion(academic, 5, QuestionType.MCQ, "What’s your biggest blocker right now?",
                    "[\"Don’t know where to start\",\"Too much to do\",\"No motivation\",\"Time management\",\"Lack of resources\"]"));
            qRepo.save(new TopicQuestion(academic, 6, QuestionType.MCQ, "Pick one action you can do today (small step):",
                    "[\"20-minute start\",\"Make a task list\",\"Pomodoro plan\",\"Ask group/lecturer\",\"Take a break + reset\"]"));

            // RELATIONSHIPS (5)
            qRepo.save(new TopicQuestion(relationships, 1, QuestionType.MCQ, "What relationship is this about?",
                    "[\"Friend\",\"Family\",\"Partner\",\"Group member\",\"Lecturer\",\"Other\"]"));
            qRepo.save(new TopicQuestion(relationships, 2, QuestionType.MCQ, "What’s the main situation?",
                    "[\"Conflict\",\"Misunderstanding\",\"Feeling ignored\",\"Trust issue\",\"Communication problem\"]"));
            qRepo.save(new TopicQuestion(relationships, 3, QuestionType.SCALE, "How emotionally intense is it right now? (1 low - 5 high)",
                    "{\"min\":1,\"max\":5}"));
            qRepo.save(new TopicQuestion(relationships, 4, QuestionType.MCQ, "What do you want most from the situation?",
                    "[\"To be heard\",\"To fix it\",\"To set boundaries\",\"To avoid conflict\",\"To understand them\"]"));
            qRepo.save(new TopicQuestion(relationships, 5, QuestionType.MCQ, "Choose a next safe step:",
                    "[\"Calm message template\",\"Pause & reflect\",\"Talk face-to-face\",\"Set boundary statement\",\"Seek advice from trusted person\"]"));
        }

        if (recommendationRepository.count() == 0) {
            recommendationRepository.save(createRecommendation(
                    "Micro reset before the next task",
                    RecommendationType.RESET,
                    "Pause for two minutes, loosen your shoulders, and shrink the next task until it feels possible again.",
                    4, 5, null, null, null, null, null
            ));
            recommendationRepository.save(createRecommendation(
                    "Breathing break for heavy stress",
                    RecommendationType.BREATHING,
                    "Try five slower breaths with a longer exhale. Let your body settle before you decide what comes next.",
                    4, 5, null, null, null, null, "stressed"
            ));
            recommendationRepository.save(createRecommendation(
                    "Protect your energy window",
                    RecommendationType.FOCUS,
                    "Use your strongest hour for one meaningful academic task and leave low-energy work for later.",
                    null, null, 3, 5, null, null, null
            ));
            recommendationRepository.save(createRecommendation(
                    "Recovery-first evening",
                    RecommendationType.RECOVERY,
                    "Choose a gentler evening with less screen stimulation so your sleep has a better chance to reset you.",
                    null, null, null, 3, null, 3, "tired"
            ));
            recommendationRepository.save(createRecommendation(
                    "Journal the pressure",
                    RecommendationType.REFLECTION,
                    "Write down what feels heaviest, what is outside your control, and one smaller step you can keep.",
                    3, 5, null, null, null, null, "overwhelmed"
            ));
            recommendationRepository.save(createRecommendation(
                    "Keep what is already helping",
                    RecommendationType.RECOVERY,
                    "Your recent pattern has some steadiness. Repeat one habit that already supports you today.",
                    null, 3, 3, 5, 3, 5, "calm"
            ));
            recommendationRepository.save(createRecommendation(
                    "Reach out before carrying it alone",
                    RecommendationType.CONNECTION,
                    "Send one honest message to a friend, family member, or classmate instead of sitting with the pressure alone.",
                    3, 5, null, null, null, null, null
            ));
            recommendationRepository.save(createRecommendation(
                    "Low-friction reflection",
                    RecommendationType.REFLECTION,
                    "End the day with one sentence: what drained you, what helped, and what tomorrow needs less of.",
                    null, null, null, null, null, null, null
            ));
        }

        System.out.println("Seed completed.");
    }

    private Recommendation createRecommendation(
            String title,
            RecommendationType type,
            String description,
            Integer minStress,
            Integer maxStress,
            Integer minEnergy,
            Integer maxEnergy,
            Integer minSleep,
            Integer maxSleep,
            String targetMood
    ) {
        Recommendation recommendation = new Recommendation();
        recommendation.setTitle(title);
        recommendation.setType(type);
        recommendation.setDescription(description);
        recommendation.setMinStressLevel(minStress);
        recommendation.setMaxStressLevel(maxStress);
        recommendation.setMinEnergyLevel(minEnergy);
        recommendation.setMaxEnergyLevel(maxEnergy);
        recommendation.setMinSleepQuality(minSleep);
        recommendation.setMaxSleepQuality(maxSleep);
        recommendation.setTargetMood(targetMood);
        recommendation.setActive(true);
        return recommendation;
    }
}
