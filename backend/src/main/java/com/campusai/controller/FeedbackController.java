package com.campusai.controller;

import com.campusai.dto.FeedbackEventDTO;
import com.campusai.dto.FeedbackRequestDTO;
import com.campusai.exception.ResourceNotFoundException;
import com.campusai.model.Attendance;
import com.campusai.model.Event;
import com.campusai.model.Feedback;
import com.campusai.model.Notification;
import com.campusai.repository.AttendanceRepository;
import com.campusai.repository.EventRepository;
import com.campusai.repository.FeedbackRepository;
import com.campusai.repository.NotificationRepository;
import com.campusai.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/my-events")
    public ResponseEntity<List<FeedbackEventDTO>> getMyAttendedEvents(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<Attendance> attendances = attendanceRepository.findByUserId(userDetails.getId());

        List<FeedbackEventDTO> result = new ArrayList<>();

        for (Attendance att : attendances) {
            if (att.isCompleted()) {
                Event event = eventRepository.findById(att.getEventId()).orElse(null);
                if (event != null) {
                    boolean feedbackSubmitted = feedbackRepository.findByUserIdAndEventId(userDetails.getId(), event.getId()).isPresent();
                    result.add(new FeedbackEventDTO(event, feedbackSubmitted));
                }
            }
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitFeedback(@RequestBody FeedbackRequestDTO request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        Long eventId = request.getEventId();

        // Verify the event exists
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        // Verify user attended
        Optional<Attendance> attendanceOpt = attendanceRepository.findByUserIdAndEventId(userId, eventId);
        if (attendanceOpt.isEmpty() || !attendanceOpt.get().isCompleted()) {
            return ResponseEntity.badRequest().body("You can only submit feedback for events you have joined.");
        }

        // Verify no duplicate feedback
        if (feedbackRepository.findByUserIdAndEventId(userId, eventId).isPresent()) {
            return ResponseEntity.badRequest().body("You have already submitted feedback for this event.");
        }

        Feedback feedback = Feedback.builder()
                .userId(userId)
                .build();
        feedback.setEventId(eventId);
        feedback.setRating(request.getRating());
        feedback.setComments(request.getComments());

        feedbackRepository.save(feedback);

        // --- NOTIFICATION: Feedback Submitted ---
        Notification notif = Notification.builder()
                .userId(userId)
                .title("Feedback Submitted")
                .message("Thank you for rating " + event.getTitle())
                .build();
        notificationRepository.save(notif);

        return ResponseEntity.ok("Feedback submitted successfully");
    }
}
