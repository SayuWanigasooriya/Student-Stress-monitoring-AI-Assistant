package com.sliit.tg.repo;

import com.sliit.tg.model.QuestionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionAnswerRepository extends JpaRepository<QuestionAnswer, Long> {
    List<QuestionAnswer> findBySession_IdOrderByAnsweredAtAsc(String sessionId);
}