package com.campusai.repository;

import com.campusai.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByChatIdOrderByTimestampAsc(Long chatId);
    long countByChatIdAndReceiverIdAndIsRead(Long chatId, Long receiverId, boolean isRead);
}
