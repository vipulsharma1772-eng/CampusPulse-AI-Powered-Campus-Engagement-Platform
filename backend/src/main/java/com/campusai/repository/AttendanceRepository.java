package com.campusai.repository;

import com.campusai.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByUserId(Long userId);
    Optional<Attendance> findByUserIdAndEventId(Long userId, Long eventId);
    List<Attendance> findByEventId(Long eventId);
}
