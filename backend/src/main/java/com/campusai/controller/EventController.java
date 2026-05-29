package com.campusai.controller;

import com.campusai.exception.ResourceNotFoundException;
import com.campusai.model.Attendance;
import com.campusai.model.Certificate;
import com.campusai.model.Event;
import com.campusai.model.Notification;
import com.campusai.model.Registration;
import com.campusai.model.User;
import com.campusai.repository.AttendanceRepository;
import com.campusai.repository.EventRepository;
import com.campusai.repository.NotificationRepository;
import com.campusai.repository.RegistrationRepository;
import com.campusai.repository.UserRepository;
import com.campusai.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}, maxAge = 3600)
@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired
    EventRepository eventRepository;

    @Autowired
    RegistrationRepository registrationRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    AttendanceRepository attendanceRepository;

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    com.campusai.repository.FeedbackRepository feedbackRepository;

    @Autowired
    com.campusai.repository.CertificateRepository certificateRepository;

    @Autowired
    com.campusai.repository.ClubRepository clubRepository;

    @Autowired
    com.campusai.repository.ClubMemberRepository clubMemberRepository;

    @Autowired
    com.campusai.repository.ClubPostRepository clubPostRepository;

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            List<Event> allEvents = eventRepository.findAll();
            for (Event event : allEvents) {
                String title = event.getTitle() != null ? event.getTitle().toLowerCase() : "";
                String desc = event.getDescription() != null ? event.getDescription().toLowerCase() : "";
                if (title.contains("test") || title.contains("demo") || title.contains("sample") || title.contains("fake") || title.contains("mock") ||
                    desc.contains("test") || desc.contains("demo") || desc.contains("sample") || desc.contains("fake") || desc.contains("mock")) {
                    // Delete registrations and attendances for this event first to prevent foreign key constraints
                    registrationRepository.deleteAll(registrationRepository.findByEventId(event.getId()));
                    attendanceRepository.deleteAll(attendanceRepository.findByEventId(event.getId()));
                    eventRepository.delete(event);
                } else {
                    // Automatically migrate categories of pre-existing events in DB based on their titles!
                    String detectedCat = detectCategory(event.getTitle(), event.getCategory());
                    if (!detectedCat.equalsIgnoreCase(event.getCategory())) {
                        event.setCategory(detectedCat);
                        eventRepository.save(event);
                        System.out.println("Migrated category for event '" + event.getTitle() + "' to: " + detectedCat);
                    }
                }
            }
            System.out.println("Cleaned up database and migrated categories successfully.");
        } catch (Exception e) {
            System.err.println("Error running database seeder/migration: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(eventRepository.findAll());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<Event>> getUpcomingEvents() {
        List<Event> allEvents = eventRepository.findAll();
        List<Event> upcoming = allEvents.stream()
                .filter(e -> e.getDate() != null && e.getDate().isAfter(LocalDateTime.now()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(upcoming);
    }

    @GetMapping("/trending")
    public ResponseEntity<List<Event>> getTrendingEvents() {
        // Mock trending: just returning some events
        List<Event> allEvents = eventRepository.findAll();
        return ResponseEntity.ok(allEvents.size() > 5 ? allEvents.subList(0, 5) : allEvents);
    }

    @GetMapping("/recommended")
    public ResponseEntity<List<Event>> getRecommendedEvents() {
        // Real recommendation logic should go here or in GeminiService
        List<Event> allEvents = eventRepository.findAll();
        List<Event> recommended = allEvents.size() > 4 ? allEvents.subList(0, 4) : allEvents;
        return ResponseEntity.ok(recommended);
    }

    private String detectCategory(String title, String defaultCategory) {
        if (title == null || title.isEmpty()) {
            return defaultCategory != null ? defaultCategory : "Technology";
        }
        String lowerTitle = title.toLowerCase();
        if (lowerTitle.contains("social") || lowerTitle.contains("media") || 
            lowerTitle.contains("instagram") || lowerTitle.contains("community") ||
            lowerTitle.contains("socail") || lowerTitle.contains("sociam")) {
            return "Social";
        }
        if (lowerTitle.contains("business") || lowerTitle.contains("startup") || 
            lowerTitle.contains("marketing") || lowerTitle.contains("finance")) {
            return "Business";
        }
        if (lowerTitle.contains("tech") || lowerTitle.contains("ai") || 
            lowerTitle.contains("coding") || lowerTitle.contains("software") || 
            lowerTitle.contains("web")) {
            return "Technology";
        }
        if (lowerTitle.contains("design") || lowerTitle.contains("ui") || 
            lowerTitle.contains("ux") || lowerTitle.contains("graphics")) {
            return "Design";
        }
        if (lowerTitle.contains("sports") || lowerTitle.contains("fitness") || 
            lowerTitle.contains("tournament") || lowerTitle.contains("football") || 
            lowerTitle.contains("cricket") || lowerTitle.contains("athletics") || 
            lowerTitle.contains("game") || lowerTitle.contains("match") || 
            lowerTitle.contains("run")) {
            return "Sports";
        }
        if (lowerTitle.contains("competition") || lowerTitle.contains("hackathon") || 
            lowerTitle.contains("contest")) {
            return "Competition";
        }
        return defaultCategory != null && !defaultCategory.isEmpty() ? defaultCategory : "Technology";
    }

    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        event.setOrganizerId(userDetails.getId());
        
        // Auto-assign category based on title keywords
        String detectedCat = detectCategory(event.getTitle(), event.getCategory());
        event.setCategory(detectedCat);
        
        Event savedEvent = eventRepository.save(event);
        return ResponseEntity.ok(savedEvent);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        return ResponseEntity.ok(event);
    }

    @GetMapping("/{id}/attendees")
    public ResponseEntity<List<User>> getEventAttendees(@PathVariable Long id) {
        List<Registration> registrations = registrationRepository.findByEventId(id);
        List<User> attendees = registrations.stream()
                .map(reg -> userRepository.findById(reg.getUserId()).orElse(null))
                .filter(user -> user != null)
                .collect(Collectors.toList());
        return ResponseEntity.ok(attendees);
    }

    @Autowired
    com.campusai.service.CertificateService certificateService;

    @PostMapping("/{id}/register")
    public ResponseEntity<?> registerForEvent(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        if (registrationRepository.findByUserIdAndEventId(userDetails.getId(), id).isPresent()) {
            return ResponseEntity.badRequest().body("Already registered for this event");
        }

        Registration registration = Registration.builder()
                .userId(userDetails.getId())
                .eventId(id)
                .attendanceStatus("ATTENDED") // Instantly mark attended
                .build();
        
        registrationRepository.save(registration);
        
        // Save attendance record
        if (attendanceRepository.findByUserIdAndEventId(userDetails.getId(), id).isEmpty()) {
            Attendance attendance = Attendance.builder()
                    .userId(userDetails.getId())
                    .eventId(id)
                    .completed(true)
                    .build();
            attendanceRepository.save(attendance);
            System.out.println("Attendance saved successfully for user: " + userDetails.getId() + " on event: " + id);
        }

        // --- NOTIFICATION: Event Joined ---
        Notification joinNotif = Notification.builder()
                .userId(userDetails.getId())
                .title("Event Joined")
                .message("You successfully joined " + event.getTitle())
                .build();
        notificationRepository.save(joinNotif);

        System.out.println("Join event success for user: " + userDetails.getId() + ", event: " + id);

        // Instantly generate and save certificate for testing/demo purposes
        Certificate cert = certificateService.issueCertificate(userDetails.getId(), id);
        if (cert != null) {
            System.out.println("Certificate saved with ID: " + cert.getId());
        }

        // --- NOTIFICATION: Certificate Generated ---
        Notification certNotif = Notification.builder()
                .userId(userDetails.getId())
                .title("Certificate Generated")
                .message("Your certificate for " + event.getTitle() + " is ready for download")
                .build();
        notificationRepository.save(certNotif);

        return ResponseEntity.ok("Successfully registered for event: " + event.getTitle());
    }

    @PostMapping("/{id}/attend")
    public ResponseEntity<?> markAttendance(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Registration registration = registrationRepository.findByUserIdAndEventId(userDetails.getId(), id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found"));
        
        registration.setAttendanceStatus("ATTENDED");
        registrationRepository.save(registration);
        return ResponseEntity.ok("Attendance marked successfully");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        // Check permission: organizer or admin
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOrganizer = event.getOrganizerId() != null && event.getOrganizerId().equals(userDetails.getId());

        if (!isAdmin && !isOrganizer) {
            return ResponseEntity.status(403).body("Unauthorized to delete this event. Only the creator can delete it.");
        }

        // Delete registrations
        List<Registration> registrations = registrationRepository.findByEventId(id);
        registrationRepository.deleteAll(registrations);

        // Delete attendance records
        List<Attendance> attendances = attendanceRepository.findByEventId(id);
        attendanceRepository.deleteAll(attendances);

        // Delete feedbacks
        List<com.campusai.model.Feedback> feedbacks = feedbackRepository.findByEventId(id);
        feedbackRepository.deleteAll(feedbacks);

        // Delete certificates and physical files
        List<Certificate> certificates = certificateRepository.findByEventId(id);
        for (Certificate cert : certificates) {
            try {
                if (cert.getPdfPath() != null && !cert.getPdfPath().equals("pending")) {
                    java.io.File file = new java.io.File(cert.getPdfPath());
                    if (file.exists()) {
                        file.delete();
                    }
                }
            } catch (Exception e) {
                System.err.println("Error deleting certificate PDF file: " + e.getMessage());
            }
        }
        certificateRepository.deleteAll(certificates);

        // Delete the event
        eventRepository.delete(event);

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("message", "Event deleted successfully.");
        return ResponseEntity.ok(response);
    }
}
