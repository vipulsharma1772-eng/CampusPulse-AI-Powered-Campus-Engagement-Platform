package com.campusai.repository;

import com.campusai.model.ClubMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {
    List<ClubMember> findByUserId(Long userId);
    List<ClubMember> findByClubId(Long clubId);
    java.util.Optional<ClubMember> findByUserIdAndClubId(Long userId, Long clubId);
}
