package com.campusai.controller;

import com.campusai.exception.ResourceNotFoundException;
import com.campusai.model.User;
import com.campusai.model.Event;
import com.campusai.model.Club;
import com.campusai.repository.UserRepository;
import com.campusai.repository.EventRepository;
import com.campusai.repository.ClubRepository;
import com.campusai.security.UserDetailsImpl;
import com.campusai.repository.ClubMemberRepository;
import com.campusai.repository.RegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    RegistrationRepository registrationRepository;

    @Autowired
    ClubMemberRepository clubMemberRepository;

    @Autowired
    ClubRepository clubRepository;

    @Autowired
    EventRepository eventRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(user);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        Long userId = userDetails.getId();

        // 1. Fetch user-specific metrics
        List<Event> allEventsList = eventRepository.findAll();
        List<com.campusai.model.Registration> rawRegistrations = registrationRepository.findByUserId(userId);
        List<com.campusai.model.Registration> realRegistrations = rawRegistrations.stream()
                .filter(r -> {
                    Optional<Event> eventOpt = allEventsList.stream().filter(e -> e.getId() != null && e.getId().equals(r.getEventId())).findFirst();
                    return eventOpt.isPresent() && (eventOpt.get().getOrganizerId() == null || !eventOpt.get().getOrganizerId().equals(userId));
                })
                .collect(Collectors.toList());

        int eventsJoined = realRegistrations.size();
        
        int eventsAttended = (int) realRegistrations.stream()
                .filter(r -> "ATTENDED".equals(r.getAttendanceStatus()))
                .count();
        
        List<Club> allClubsList = clubRepository.findAll();
        int clubsJoined = (int) clubMemberRepository.findByUserId(userId).stream()
                .filter(cm -> {
                    Optional<Club> clubOpt = allClubsList.stream().filter(c -> c.getId() != null && c.getId().equals(cm.getClubId())).findFirst();
                    return clubOpt.isPresent() && (clubOpt.get().getCreatedBy() == null || !clubOpt.get().getCreatedBy().equals(userId));
                })
                .count();

        // 2. Attendance Percentage
        int attendancePercentage = 0;
        if (eventsJoined > 0) {
            attendancePercentage = (eventsAttended * 100) / eventsJoined;
        }

        // 3. Activity Status Rules
        String activityStatus = "New Participant";
        if (eventsJoined >= 9) {
            activityStatus = "Highly Active";
        } else if (eventsJoined >= 5) {
            activityStatus = "Active Member";
        } else if (eventsJoined >= 2) {
            activityStatus = "Moderate Activity";
        }

        // 4. Combined Participation Score
        int participationScore = Math.min(100, (eventsJoined * 8) + (clubsJoined * 12) + (eventsAttended * 10));

        stats.put("eventsJoined", eventsJoined);
        stats.put("clubsJoined", clubsJoined);
        stats.put("eventsAttended", eventsAttended);
        stats.put("attendancePercentage", attendancePercentage);
        stats.put("activityStatus", activityStatus);
        stats.put("participationScore", participationScore);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/activity-details")
    public ResponseEntity<?> getUserActivityDetails(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        java.util.Map<String, Object> details = new java.util.HashMap<>();
        Long userId = userDetails.getId();

        // 1. Fetch registrations & memberships
        List<Event> allEvents = eventRepository.findAll();
        List<com.campusai.model.Registration> registrations = registrationRepository.findByUserId(userId).stream()
                .filter(r -> {
                    Optional<Event> eventOpt = allEvents.stream().filter(e -> e.getId() != null && e.getId().equals(r.getEventId())).findFirst();
                    return eventOpt.isPresent() && (eventOpt.get().getOrganizerId() == null || !eventOpt.get().getOrganizerId().equals(userId));
                })
                .collect(Collectors.toList());
        List<Club> allClubs = clubRepository.findAll();

        List<com.campusai.model.ClubMember> clubMemberships = clubMemberRepository.findByUserId(userId).stream()
                .filter(cm -> {
                    Optional<Club> clubOpt = allClubs.stream().filter(c -> c.getId() != null && c.getId().equals(cm.getClubId())).findFirst();
                    return clubOpt.isPresent() && (clubOpt.get().getCreatedBy() == null || !clubOpt.get().getCreatedBy().equals(userId));
                })
                .collect(Collectors.toList());

        // 2. Resolve joined events, attended events, and category analytics
        List<Map<String, Object>> joinedEvents = new ArrayList<>();
        List<Map<String, Object>> attendedEvents = new ArrayList<>();
        List<Map<String, Object>> attendanceHistory = new ArrayList<>();

        Map<String, Integer> categoryCounts = new HashMap<>();
        categoryCounts.put("Technology", 0);
        categoryCounts.put("Design", 0);
        categoryCounts.put("Business", 0);
        categoryCounts.put("Social", 0);
        categoryCounts.put("Sports", 0);

        LocalDateTime lastActiveDate = null;

        for (com.campusai.model.Registration reg : registrations) {
            Optional<Event> eventOpt = allEvents.stream().filter(e -> e.getId() != null && e.getId().equals(reg.getEventId())).findFirst();
            if (eventOpt.isPresent()) {
                Event event = eventOpt.get();
                Map<String, Object> eventMap = new HashMap<>();
                eventMap.put("id", event.getId());
                eventMap.put("title", event.getTitle() != null ? event.getTitle() : "Unnamed Event");
                eventMap.put("category", event.getCategory() != null ? event.getCategory() : "Technology");
                eventMap.put("date", event.getDate());
                eventMap.put("attendanceStatus", reg.getAttendanceStatus() != null ? reg.getAttendanceStatus() : "PENDING");
                eventMap.put("registrationDate", reg.getRegistrationDate());

                joinedEvents.add(eventMap);
                if ("ATTENDED".equals(reg.getAttendanceStatus())) {
                    attendedEvents.add(eventMap);
                }
                attendanceHistory.add(eventMap);

                // Group and Count Categories
                String cat = event.getCategory();
                if (cat != null) {
                    String matchedKey = null;
                    for (String key : categoryCounts.keySet()) {
                        if (key.equalsIgnoreCase(cat)) {
                            matchedKey = key;
                            break;
                        }
                    }
                    if (matchedKey != null) {
                        categoryCounts.put(matchedKey, categoryCounts.get(matchedKey) + 1);
                    }
                }

                // Check Last Active Date
                if (reg.getRegistrationDate() != null) {
                    if (lastActiveDate == null || reg.getRegistrationDate().isAfter(lastActiveDate)) {
                        lastActiveDate = reg.getRegistrationDate();
                    }
                }
            }
        }

        // 3. Resolve joined clubs
        List<Map<String, Object>> joinedClubs = new ArrayList<>();
        for (com.campusai.model.ClubMember cm : clubMemberships) {
            Optional<Club> clubOpt = allClubs.stream().filter(c -> c.getId() != null && c.getId().equals(cm.getClubId())).findFirst();
            if (clubOpt.isPresent()) {
                Club club = clubOpt.get();
                Map<String, Object> clubMap = new HashMap<>();
                clubMap.put("id", club.getId());
                clubMap.put("name", club.getName() != null ? club.getName() : "Unnamed Club");
                clubMap.put("category", club.getCategory() != null ? club.getCategory() : "Social");
                clubMap.put("joinedAt", cm.getJoinedAt());
                joinedClubs.add(clubMap);

                if (cm.getJoinedAt() != null) {
                    if (lastActiveDate == null || cm.getJoinedAt().isAfter(lastActiveDate)) {
                        lastActiveDate = cm.getJoinedAt();
                    }
                }
            }
        }

        // 4. Participation Timeline
        List<Map<String, Object>> timeline = new ArrayList<>();
        for (Map<String, Object> je : joinedEvents) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "EVENT_JOIN");
            item.put("title", "Registered for " + je.get("title"));
            item.put("category", je.get("category"));
            item.put("date", je.get("registrationDate"));
            timeline.add(item);

            if ("ATTENDED".equals(je.get("attendanceStatus"))) {
                Map<String, Object> attItem = new HashMap<>();
                attItem.put("type", "EVENT_ATTEND");
                attItem.put("title", "Attended " + je.get("title"));
                attItem.put("category", je.get("category"));
                attItem.put("date", je.get("date"));
                timeline.add(attItem);
            }
        }
        for (Map<String, Object> jc : joinedClubs) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "CLUB_JOIN");
            item.put("title", "Joined Club: " + jc.get("name"));
            item.put("category", jc.get("category"));
            item.put("date", jc.get("joinedAt"));
            timeline.add(item);
        }
        // Sort timeline descending by date
        timeline.sort((a, b) -> {
            LocalDateTime da = (LocalDateTime) a.get("date");
            LocalDateTime db = (LocalDateTime) b.get("date");
            if (da == null) return 1;
            if (db == null) return -1;
            return db.compareTo(da);
        });

        // 5. Most Active Category
        String mostActiveCategory = "N/A";
        int maxCount = 0;
        for (Map.Entry<String, Integer> entry : categoryCounts.entrySet()) {
            if (entry.getValue() > maxCount) {
                maxCount = entry.getValue();
                mostActiveCategory = entry.getKey();
            }
        }

        // 6. Compute Score
        int eventsJoinedCount = joinedEvents.size();
        int eventsAttendedCount = attendedEvents.size();
        int clubsJoinedCount = joinedClubs.size();
        int participationScore = Math.min(100, (eventsJoinedCount * 8) + (clubsJoinedCount * 12) + (eventsAttendedCount * 10));

        details.put("joinedEvents", joinedEvents);
        details.put("attendedEvents", attendedEvents);
        details.put("joinedClubs", joinedClubs);
        details.put("attendanceHistory", attendanceHistory);
        details.put("participationTimeline", timeline);
        details.put("mostActiveCategory", mostActiveCategory);
        details.put("lastActiveDate", lastActiveDate);
        details.put("participationScore", participationScore);
        details.put("categoryAnalytics", categoryCounts);

        return ResponseEntity.ok(details);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam("username") String username, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        List<User> matchedUsers = userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(userDetails.getId()))
                .filter(u -> {
                    String uName = u.getUsername() != null ? u.getUsername().toLowerCase() : "";
                    String actualName = u.getName() != null ? u.getName().toLowerCase() : "";
                    String searchVal = username.toLowerCase();
                    return uName.contains(searchVal) || actualName.contains(searchVal);
                })
                .limit(10)
                .collect(Collectors.toList());

        List<Map<String, Object>> result = matchedUsers.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("username", u.getUsername());
            map.put("profileImage", u.getProfileImage());
            map.put("role", u.getRole().name());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody com.campusai.dto.ProfileUpdateRequest request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (request.getName() != null) user.setName(request.getName());
        if (request.getBranch() != null) user.setBranch(request.getBranch());
        if (request.getInterests() != null) user.setInterests(request.getInterests());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getProfileImage() != null) user.setProfileImage(request.getProfileImage());
        
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/password")
    public ResponseEntity<?> updatePassword(@RequestBody com.campusai.dto.PasswordUpdateRequest request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Incorrect current password"));
        }
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        return ResponseEntity.ok(java.util.Map.of("message", "Password updated successfully"));
    }
}
