package com.campusai.repository;

import com.campusai.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    List<Certificate> findByUserId(Long userId);
    List<Certificate> findByEventId(Long eventId);
    boolean existsByUserIdAndEventId(Long userId, Long eventId);
}
