package com.campusai.repository;

import com.campusai.model.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {
    @Query("SELECT c FROM Chat c WHERE (c.user1Id = :u1 AND c.user2Id = :u2) OR (c.user1Id = :u2 AND c.user2Id = :u1)")
    Optional<Chat> findByUsers(@Param("u1") Long user1Id, @Param("u2") Long user2Id);

    @Query("SELECT c FROM Chat c WHERE c.user1Id = :userId OR c.user2Id = :userId ORDER BY c.lastMessageTimestamp DESC")
    List<Chat> findRecentChats(@Param("userId") Long userId);
}
