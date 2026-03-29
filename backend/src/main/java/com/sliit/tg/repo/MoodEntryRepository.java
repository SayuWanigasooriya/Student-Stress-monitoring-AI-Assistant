package com.sliit.tg.repo;

import com.sliit.tg.model.MoodEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MoodEntryRepository extends JpaRepository<MoodEntry, Long> {
    List<MoodEntry> findByUserIdOrderByDateDesc(Long userId);
}
