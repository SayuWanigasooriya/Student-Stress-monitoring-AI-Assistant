package com.sliit.tg.repo;

import com.sliit.tg.model.RecommendationLog;
import com.sliit.tg.model.RecommendationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecommendationLogRepository extends JpaRepository<RecommendationLog, Long> {
    long countByUser_IdAndStatus(Long userId, RecommendationStatus status);
    boolean existsByUser_IdAndRecommendation_IdAndStatus(Long userId, Long recommendationId, RecommendationStatus status);
}
