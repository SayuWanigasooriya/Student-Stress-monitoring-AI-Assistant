package com.sliit.tg.service;

import com.sliit.tg.model.QuestionAnswer;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class GuidanceEngine {

    public Result analyze(String topicId, List<QuestionAnswer> answers) {
        int score = 0;

        for (QuestionAnswer a : answers) {
            String v = a.getAnswerValue().trim().toLowerCase();
            String type = a.getQuestion().getType().name();

            if ("SCALE".equals(type)) {
                try {
                    int n = Integer.parseInt(v);
                    if (n >= 4) score += 2;
                    else if (n == 3) score += 1;
                } catch (NumberFormatException ignored) {}
            } else if ("YES_NO".equals(type)) {
                if (v.equals("yes") || v.equals("true")) score += 2;
            }
        }

        String impact = (score <= 2) ? "LOW" : (score <= 5) ? "MEDIUM" : "HIGH";

        String summary = switch (impact) {
            case "LOW" -> "Your responses suggest a manageable level right now.";
            case "MEDIUM" -> "Your responses suggest moderate impact; a structured plan may help.";
            default -> "Your responses suggest high impact; prioritize support and coping strategies.";
        };

        return new Result(impact, summary, buildRecommendations(topicId, impact));
    }

    private List<String> buildRecommendations(String topicId, String impact) {
        List<String> recs = new ArrayList<>();

        switch (topicId) {
            case "ACADEMIC_STRESS" -> {
                recs.add("Do a 20-minute starter session on the easiest subtask.");
                recs.add("Make a 3-item priority list (must-do / should-do / can-wait).");
                recs.add("Use Pomodoro: 25 min focus + 5 min break (repeat twice).");
                if ("HIGH".equals(impact)) recs.add("Reach out to a lecturer / group member for clarification or support.");
            }
            case "ANXIETY" -> {
                recs.add("Try a 60-second grounding: 5-4-3-2-1 senses.");
                recs.add("Slow breathing: inhale 4s, exhale 6s (5 rounds).");
                recs.add("Write one anxious thought, then rewrite it in a balanced way.");
                if ("HIGH".equals(impact)) recs.add("Talk to a trusted person; avoid handling it alone.");
            }
            case "RELATIONSHIPS" -> {
                recs.add("Pause before responding; write what you want to communicate in one sentence.");
                recs.add("Use an I-statement: 'I feel ___ when ___ because ___. I need ___'.");
                recs.add("Choose a calm time to talk, not during peak emotion.");
                if ("HIGH".equals(impact)) recs.add("If conflict escalates, step back and seek neutral support.");
            }
            default -> recs.add("Take a small next step and reflect on what changes.");
        }

        return recs;
    }

    public record Result(String impactLevel, String summary, List<String> recommendations) {}
}