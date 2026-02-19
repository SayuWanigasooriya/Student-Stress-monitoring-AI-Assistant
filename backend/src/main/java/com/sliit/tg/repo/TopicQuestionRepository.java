package com.sliit.tg.repo;

import com.sliit.tg.model.TopicQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TopicQuestionRepository extends JpaRepository<TopicQuestion, Long> {
    Optional<TopicQuestion> findByTopic_IdAndStepNo(String topicId, int stepNo);
    List<TopicQuestion> findByTopic_IdOrderByStepNoAsc(String topicId);
}