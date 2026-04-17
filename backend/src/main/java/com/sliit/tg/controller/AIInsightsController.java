package com.sliit.tg.controller;

import com.sliit.tg.model.MoodEntry;
import com.sliit.tg.repo.MoodEntryRepository;
import com.sliit.tg.repo.UserRepository;
import com.sliit.tg.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AIInsightsController {

    private final GeminiService geminiService;
    private final MoodEntryRepository moodEntryRepository;
    private final UserRepository userRepository;

    public AIInsightsController(
            GeminiService geminiService,
            MoodEntryRepository moodEntryRepository,
            UserRepository userRepository
    ) {
        this.geminiService = geminiService;
        this.moodEntryRepository = moodEntryRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/ai-insights")
    public ResponseEntity<?> getAIInsights(@RequestParam Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found."));
        }

        List<MoodEntry> entries = moodEntryRepository.findByUser_IdOrderByDateDesc(userId);
        if (entries.isEmpty()) {
            return ResponseEntity.ok(buildEmptyState());
        }

        List<MoodEntry> recentEntries = entries.stream()
                .sorted(Comparator.comparing(MoodEntry::getDate))
                .skip(Math.max(0, entries.size() - 7L))
                .toList();

        try {
            return ResponseEntity.ok(geminiService.generateMoodInsights(recentEntries));
        } catch (Exception ignored) {
            return ResponseEntity.ok(buildFallback(entries));
        }
    }

    private Map<String, Object> buildEmptyState() {
        return Map.of(
                "insights", List.of(
                        Map.of(
                                "icon", "Journal",
                                "title", "Start your daily check-in",
                                "message", "Log a few entries so we can spot your mood and stress patterns over time.",
                                "color", "rgba(124, 174, 199, 1)"
                        )
                ),
                "affirmations", List.of(
                        "Small check-ins count.",
                        "You do not need a perfect day to care for yourself."
                ),
                "suggestions", List.of(
                        Map.of(
                                "title", "First reflection",
                                "description", "Add today's mood, stress, energy, and sleep to begin building your wellness pattern.",
                                "duration", "2 min"
                        )
                ),
                "summary", Map.of(
                        "text", "No mood entries yet. Your daily check-ins will unlock tailored insights here.",
                        "highlights", List.of(
                                Map.of("text", "Build your baseline", "color", "rgba(124, 174, 199, 1)")
                        )
                )
        );
    }

    private Map<String, Object> buildFallback(List<MoodEntry> entries) {
        double avgStress = entries.stream().mapToInt(MoodEntry::getStressLevel).average().orElse(0);
        double avgEnergy = entries.stream().mapToInt(MoodEntry::getEnergyLevel).average().orElse(0);
        double avgSleep = entries.stream().mapToInt(MoodEntry::getSleepQuality).average().orElse(0);
        String latestMood = entries.get(0).getMood();

        List<Map<String, String>> insights = new ArrayList<>();
        insights.add(Map.of(
                "icon", avgStress >= 4 ? "Brain" : "Leaf",
                "title", avgStress >= 4 ? "Stress is running high" : "Stress looks manageable",
                "message", avgStress >= 4
                        ? "Your recent check-ins show elevated stress. Lighter goals and short pauses may help this week."
                        : "Your recent stress ratings are relatively steady. Keep protecting the routines that are helping.",
                "color", "rgba(124, 174, 199, 1)"
        ));
        insights.add(Map.of(
                "icon", avgEnergy >= 3 ? "Sun" : "Moon",
                "title", avgEnergy >= 3 ? "Energy has some lift" : "Energy may need support",
                "message", avgEnergy >= 3
                        ? "You still have usable energy in your recent entries. Try placing important tasks in your strongest hours."
                        : "Your energy has been lower lately. A smaller workload and more recovery time may be worth protecting.",
                "color", "rgba(124, 201, 178, 1)"
        ));

        List<String> affirmations = List.of(
                "You are paying attention to yourself, and that matters.",
                "Steady care is more important than perfect progress.",
                "One calmer choice today is still progress."
        );

        List<Map<String, String>> suggestions = new ArrayList<>();
        suggestions.add(Map.of(
                "title", "Reset in two minutes",
                "description", "Pause, unclench your shoulders, and take five slower breaths before the next task.",
                "duration", "2 min"
        ));
        suggestions.add(Map.of(
                "title", "Protect one recovery habit",
                "description", avgSleep < 3
                        ? "Aim for a more consistent bedtime or a wind-down break tonight."
                        : "Keep the sleep routine that has been helping you recover.",
                "duration", "10 min"
        ));

        String summaryText = "Your recent mood trend centers around " + latestMood.toLowerCase()
                + " with average stress at " + formatOneDecimal(avgStress)
                + "/5, energy at " + formatOneDecimal(avgEnergy)
                + "/5, and sleep at " + formatOneDecimal(avgSleep)
                + "/5. Keep using daily check-ins so the recommendations can become more specific.";

        Map<String, Object> summary = new HashMap<>();
        summary.put("text", summaryText);
        summary.put("highlights", List.of(
                Map.of("text", "Mood: " + latestMood, "color", "rgba(124, 174, 199, 1)"),
                Map.of("text", "Stress " + formatOneDecimal(avgStress) + "/5", "color", "rgba(124, 201, 178, 1)"),
                Map.of("text", "Sleep " + formatOneDecimal(avgSleep) + "/5", "color", "rgba(246, 191, 120, 1)")
        ));

        Map<String, Object> response = new HashMap<>();
        response.put("insights", insights);
        response.put("affirmations", affirmations);
        response.put("suggestions", suggestions);
        response.put("summary", summary);
        return response;
    }

    private String formatOneDecimal(double value) {
        return String.format(Locale.US, "%.1f", value);
    }
}
