package com.campusai.repository;

import com.campusai.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByEventId(Long eventId);
    java.util.Optional<Feedback> findByUserIdAndEventId(Long userId, Long eventId);
}
