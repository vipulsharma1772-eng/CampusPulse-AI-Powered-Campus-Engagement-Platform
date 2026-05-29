package com.campusai.controller;

import com.campusai.model.Notification;
import com.campusai.repository.NotificationRepository;
import com.campusai.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userDetails.getId());
        
        if (notifications.isEmpty()) {
            Notification demo1 = Notification.builder()
                    .userId(userDetails.getId())
                    .title("Welcome to CampusAI")
                    .message("Explore events and connect with clubs.")
                    .build();
            Notification demo2 = Notification.builder()
                    .userId(userDetails.getId())
                    .title("Profile Reminder")
                    .message("Don't forget to complete your profile settings.")
                    .build();
            notificationRepository.save(demo1);
            notificationRepository.save(demo2);
            
            // Re-fetch to get them sorted with IDs
            notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userDetails.getId());
        }

        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/mark-read")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadStatusFalse(userDetails.getId());
        for (Notification n : unread) {
            n.setReadStatus(true);
        }
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok("All notifications marked as read");
    }
}
