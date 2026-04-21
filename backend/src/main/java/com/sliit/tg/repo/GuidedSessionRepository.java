package com.sliit.tg.repo;

import com.sliit.tg.model.GuidedSession;
import com.sliit.tg.model.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuidedSessionRepository extends JpaRepository<GuidedSession, String> {
    List<GuidedSession> findAllByUserIdAndStatusOrderByStartedAtDesc(String userId, SessionStatus status);
}
