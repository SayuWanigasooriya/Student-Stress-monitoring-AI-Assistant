package com.sliit.tg.controller;

import com.sliit.tg.dto.MoodEntryRequest;
import com.sliit.tg.dto.MoodEntryResponse;
import com.sliit.tg.model.MoodEntry;
import com.sliit.tg.model.User;
import com.sliit.tg.repo.MoodEntryRepository;
import com.sliit.tg.repo.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mood-entries")
public class MoodEntryController {

    private final MoodEntryRepository moodEntryRepository;
    private final UserRepository userRepository;

    public MoodEntryController(MoodEntryRepository moodEntryRepository, UserRepository userRepository) {
        this.moodEntryRepository = moodEntryRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> saveMoodEntry(@Valid @RequestBody MoodEntryRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found."));
        }

        MoodEntry entry = new MoodEntry();
        entry.setUser(user);
        entry.setDate(request.getDate() != null ? request.getDate() : LocalDateTime.now());
        entry.setMood(request.getMood().trim());
        entry.setStressLevel(request.getStressLevel());
        entry.setEnergyLevel(request.getEnergyLevel());
        entry.setSleepQuality(request.getSleepQuality());
        entry.setNotes(request.getNotes() == null ? "" : request.getNotes().trim());

        MoodEntry savedEntry = moodEntryRepository.save(entry);
        return ResponseEntity.ok(MoodEntryResponse.from(savedEntry));
    }

    @GetMapping
    public ResponseEntity<?> getMoodEntries(@RequestParam Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found."));
        }

        List<MoodEntryResponse> entries = moodEntryRepository.findByUserIdOrderByDateDesc(userId).stream()
                .map(MoodEntryResponse::from)
                .toList();

        return ResponseEntity.ok(entries);
    }
}
