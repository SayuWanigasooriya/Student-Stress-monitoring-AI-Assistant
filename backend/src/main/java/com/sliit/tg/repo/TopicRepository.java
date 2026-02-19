package com.sliit.tg.repo;

import com.sliit.tg.model.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicRepository extends JpaRepository<Topic, String> {}