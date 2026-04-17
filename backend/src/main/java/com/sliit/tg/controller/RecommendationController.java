package com.sliit.tg.controller;

import com.sliit.tg.dto.RecommendationActionRequest;
import com.sliit.tg.dto.RecommendationResponse;
import com.sliit.tg.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    public ResponseEntity<List<RecommendationResponse>> getRecommendations(@RequestParam Long userId) {
        return ResponseEntity.ok(recommendationService.getRecommendations(userId));
    }

    @PostMapping("/{id}/done")
    public ResponseEntity<Void> markDone(@PathVariable Long id, @Valid @RequestBody RecommendationActionRequest request) {
        recommendationService.markDone(id, request.getUserId(), request.getFeedback());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<Void> saveRecommendation(@PathVariable Long id, @Valid @RequestBody RecommendationActionRequest request) {
        recommendationService.save(id, request.getUserId());
        return ResponseEntity.ok().build();
    }
}
