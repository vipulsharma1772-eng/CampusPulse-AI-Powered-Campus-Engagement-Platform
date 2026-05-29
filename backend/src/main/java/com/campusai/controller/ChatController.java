package com.campusai.controller;

import com.campusai.model.Chat;
import com.campusai.model.Message;
import com.campusai.model.User;
import com.campusai.repository.ChatRepository;
import com.campusai.repository.MessageRepository;
import com.campusai.repository.UserRepository;
import com.campusai.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/chats")
public class ChatController {

    @Autowired
    ChatRepository chatRepository;

    @Autowired
    MessageRepository messageRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    com.campusai.repository.BlockedUserRepository blockedUserRepository;

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentChats(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Long myId = userDetails.getId();

        List<Chat> chats = chatRepository.findRecentChats(myId);
        List<Map<String, Object>> responseList = new ArrayList<>();

        for (Chat chat : chats) {
            Long otherUserId = chat.getUser1Id().equals(myId) ? chat.getUser2Id() : chat.getUser1Id();
            
            // Filter: if I have blocked them, do not show in recent list (Requirement 4)
            if (blockedUserRepository.existsByBlockerIdAndBlockedId(myId, otherUserId)) {
                continue;
            }

            Optional<User> otherUserOpt = userRepository.findById(otherUserId);
            if (otherUserOpt.isPresent()) {
                User otherUser = otherUserOpt.get();
                Map<String, Object> item = new HashMap<>();
                item.put("chatId", chat.getId());
                item.put("lastMessageContent", chat.getLastMessageContent());
                item.put("lastMessageTimestamp", chat.getLastMessageTimestamp());

                // Unread message count
                long unreadCount = messageRepository.countByChatIdAndReceiverIdAndIsRead(chat.getId(), myId, false);
                item.put("unreadCount", unreadCount);

                boolean isBlocked = blockedUserRepository.existsByBlockerIdAndBlockedId(myId, otherUserId);
                boolean hasBlockedMe = blockedUserRepository.existsByBlockerIdAndBlockedId(otherUserId, myId);
                item.put("isBlocked", isBlocked);
                item.put("hasBlockedMe", hasBlockedMe);

                // Other user profile
                Map<String, Object> profile = new HashMap<>();
                profile.put("id", otherUser.getId());
                profile.put("name", otherUser.getName());
                profile.put("username", otherUser.getUsername());
                profile.put("profileImage", otherUser.getProfileImage());
                profile.put("role", otherUser.getRole().name());
                item.put("otherUser", profile);

                responseList.add(item);
            }
        }

        return ResponseEntity.ok(responseList);
    }

    @PostMapping("/open")
    public ResponseEntity<?> openChat(@RequestParam("username") String username, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Long myId = userDetails.getId();

        Optional<User> otherUserOpt = userRepository.findByUsername(username);
        if (otherUserOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found with username: " + username);
        }
        User otherUser = otherUserOpt.get();
        if (otherUser.getId().equals(myId)) {
            return ResponseEntity.badRequest().body("You cannot open a conversation with yourself");
        }

        // Find or create chat
        Chat chat = chatRepository.findByUsers(myId, otherUser.getId())
                .orElseGet(() -> {
                    Chat newChat = Chat.builder()
                            .user1Id(myId)
                            .user2Id(otherUser.getId())
                            .lastMessageTimestamp(LocalDateTime.now())
                            .lastMessageContent("Conversation opened")
                            .build();
                    return chatRepository.save(newChat);
                });

        Map<String, Object> result = new HashMap<>();
        result.put("chatId", chat.getId());
        result.put("lastMessageContent", chat.getLastMessageContent());
        result.put("lastMessageTimestamp", chat.getLastMessageTimestamp());

        boolean isBlocked = blockedUserRepository.existsByBlockerIdAndBlockedId(myId, otherUser.getId());
        boolean hasBlockedMe = blockedUserRepository.existsByBlockerIdAndBlockedId(otherUser.getId(), myId);
        result.put("isBlocked", isBlocked);
        result.put("hasBlockedMe", hasBlockedMe);

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", otherUser.getId());
        profile.put("name", otherUser.getName());
        profile.put("username", otherUser.getUsername());
        profile.put("profileImage", otherUser.getProfileImage());
        profile.put("role", otherUser.getRole().name());
        result.put("otherUser", profile);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long chatId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Long myId = userDetails.getId();

        Optional<Chat> chatOpt = chatRepository.findById(chatId);
        if (chatOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Chat chat = chatOpt.get();

        // Security check
        if (!chat.getUser1Id().equals(myId) && !chat.getUser2Id().equals(myId)) {
            return ResponseEntity.status(403).body("You are not authorized to view this chat");
        }

        List<Message> messages = messageRepository.findByChatIdOrderByTimestampAsc(chatId);

        // Mark unread messages as read
        List<Message> unread = messages.stream()
                .filter(m -> m.getReceiverId().equals(myId) && !m.isRead())
                .collect(Collectors.toList());
        if (!unread.isEmpty()) {
            for (Message m : unread) {
                m.setRead(true);
            }
            messageRepository.saveAll(unread);
        }

        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{chatId}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable Long chatId, @RequestBody Map<String, String> body, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Long myId = userDetails.getId();
        String content = body.get("content");
        String imageUrl = body.get("imageUrl");

        if ((content == null || content.trim().isEmpty()) && (imageUrl == null || imageUrl.trim().isEmpty())) {
            return ResponseEntity.badRequest().body("Message content cannot be empty");
        }

        if (content == null || content.trim().isEmpty()) {
            content = "[Image]";
        }

        Optional<Chat> chatOpt = chatRepository.findById(chatId);
        if (chatOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Chat chat = chatOpt.get();

        // Security check
        if (!chat.getUser1Id().equals(myId) && !chat.getUser2Id().equals(myId)) {
            return ResponseEntity.status(403).body("You are not authorized to send messages to this chat");
        }

        Long receiverId = chat.getUser1Id().equals(myId) ? chat.getUser2Id() : chat.getUser1Id();
 
        // Block Guard: Prevent message creation when sender is blocked by receiver
        if (blockedUserRepository.existsByBlockerIdAndBlockedId(receiverId, myId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body("Forbidden: You have been blocked by this user.");
        }

        Message message = Message.builder()
                .chatId(chatId)
                .senderId(myId)
                .receiverId(receiverId)
                .content(content.trim())
                .imageUrl(imageUrl)
                .timestamp(LocalDateTime.now())
                .isRead(false)
                .build();

        Message savedMessage = messageRepository.save(message);

        // Update Chat metadata
        chat.setLastMessageTimestamp(savedMessage.getTimestamp());
        chat.setLastMessageContent(savedMessage.getContent());
        chatRepository.save(chat);

        return ResponseEntity.ok(savedMessage);
    }

    @PostMapping("/block/{userId}")
    public ResponseEntity<?> blockUser(@PathVariable Long userId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Long myId = userDetails.getId();

        if (myId.equals(userId)) {
            return ResponseEntity.badRequest().body("You cannot block yourself");
        }

        if (!userRepository.existsById(userId)) {
            return ResponseEntity.badRequest().body("User not found");
        }

        if (blockedUserRepository.findByBlockerIdAndBlockedId(myId, userId).isEmpty()) {
            com.campusai.model.BlockedUser block = com.campusai.model.BlockedUser.builder()
                    .blockerId(myId)
                    .blockedId(userId)
                    .build();
            blockedUserRepository.save(block);
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "User blocked successfully");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/unblock/{userId}")
    public ResponseEntity<?> unblockUser(@PathVariable Long userId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Long myId = userDetails.getId();

        Optional<com.campusai.model.BlockedUser> blockOpt = blockedUserRepository.findByBlockerIdAndBlockedId(myId, userId);
        if (blockOpt.isPresent()) {
            blockedUserRepository.delete(blockOpt.get());
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "User unblocked successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/blocked")
    public ResponseEntity<?> getBlockedUsers(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Long myId = userDetails.getId();

        List<com.campusai.model.BlockedUser> blocks = blockedUserRepository.findByBlockerId(myId);
        List<Map<String, Object>> responseList = new ArrayList<>();

        for (com.campusai.model.BlockedUser block : blocks) {
            Optional<User> userOpt = userRepository.findById(block.getBlockedId());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                Map<String, Object> item = new HashMap<>();
                item.put("id", user.getId());
                item.put("name", user.getName());
                item.put("username", user.getUsername());
                item.put("profileImage", user.getProfileImage());
                item.put("blockedAt", block.getBlockedAt());
                responseList.add(item);
            }
        }

        return ResponseEntity.ok(responseList);
    }
}
