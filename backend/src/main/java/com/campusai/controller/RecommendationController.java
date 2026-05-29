package com.campusai.controller;

import com.campusai.model.Club;
import com.campusai.model.ClubMember;
import com.campusai.model.Event;
import com.campusai.model.Registration;
import com.campusai.model.User;
import com.campusai.repository.*;
import com.campusai.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    EventRepository eventRepository;

    @Autowired
    ClubRepository clubRepository;

    @Autowired
    RegistrationRepository registrationRepository;

    @Autowired
    ClubMemberRepository clubMemberRepository;

    @GetMapping
    public ResponseEntity<?> getCombinedRecommendations(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Long userId = userDetails.getId();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        // 1. Gather all user preferences (interests, registered events, joined clubs)
        Set<String> preferredCategories = new HashSet<>();

        // Interests (from profile)
        if (user.getInterests() != null && !user.getInterests().trim().isEmpty()) {
            for (String interest : user.getInterests().split(",")) {
                preferredCategories.add(interest.trim().toLowerCase());
            }
        }

        // Categories from registered events
        List<Registration> userRegistrations = registrationRepository.findByUserId(userId);
        List<Event> allEvents = eventRepository.findAll();
        for (Registration reg : userRegistrations) {
            allEvents.stream()
                .filter(e -> e.getId().equals(reg.getEventId()) && e.getCategory() != null)
                .findFirst()
                .ifPresent(e -> preferredCategories.add(e.getCategory().trim().toLowerCase()));
        }

        // Categories from joined clubs
        List<ClubMember> memberships = clubMemberRepository.findByUserId(userId);
        List<Club> allClubs = clubRepository.findAll();
        for (ClubMember cm : memberships) {
            allClubs.stream()
                .filter(c -> c.getId().equals(cm.getClubId()) && c.getCategory() != null)
                .findFirst()
                .ifPresent(c -> preferredCategories.add(c.getCategory().trim().toLowerCase()));
        }

        // 2. Fetch and filter events (filtering out mock/test events)
        List<Event> realEvents = allEvents;

        Set<Long> registeredEventIds = userRegistrations.stream()
            .map(Registration::getEventId)
            .collect(Collectors.toSet());

        // 3. Fetch joined club IDs
        Set<Long> joinedClubIds = memberships.stream()
            .map(ClubMember::getClubId)
            .collect(Collectors.toSet());

        // 4. Build combined recommendation list with popularity matching
        List<Map<String, Object>> recommendations = new ArrayList<>();
        List<Registration> allRegistrations = registrationRepository.findAll();

        // Process Events
        for (Event event : realEvents) {
            long registrationCount = allRegistrations.stream()
                .filter(r -> r.getEventId().equals(event.getId()))
                .filter(r -> event.getOrganizerId() == null || !r.getUserId().equals(event.getOrganizerId()))
                .count();
                
            // Add category boost for personalization
            long score = registrationCount * 10;
            if (event.getCategory() != null && preferredCategories.contains(event.getCategory().trim().toLowerCase())) {
                score += 50; 
            }
            if (registeredEventIds.contains(event.getId())) {
                score -= 1000; // Demote already registered events
            }

            Map<String, Object> rec = new HashMap<>();
            rec.put("type", "event");
            rec.put("score", score);
            rec.put("popularity", registrationCount);
            
            Map<String, Object> eventMap = new HashMap<>();
            eventMap.put("id", event.getId());
            eventMap.put("title", event.getTitle());
            eventMap.put("category", event.getCategory());
            eventMap.put("imageUrl", event.getImageUrl());
            eventMap.put("date", event.getDate());
            eventMap.put("venue", event.getVenue());
            eventMap.put("description", event.getDescription());
            eventMap.put("registrationCount", registrationCount);
            rec.put("item", eventMap);

            recommendations.add(rec);
        }

        // Process Clubs
        for (Club club : allClubs) {
            long memberCount = clubMemberRepository.findByClubId(club.getId()).stream()
                    .filter(m -> club.getCreatedBy() == null || !m.getUserId().equals(club.getCreatedBy()))
                    .count();
                    
            long score = memberCount * 10;
            if (club.getCategory() != null && preferredCategories.contains(club.getCategory().trim().toLowerCase())) {
                score += 50;
            }
            if (joinedClubIds.contains(club.getId())) {
                score -= 1000; // Demote already joined clubs
            }

            Map<String, Object> rec = new HashMap<>();
            rec.put("type", "club");
            rec.put("score", score);
            rec.put("popularity", memberCount);

            Map<String, Object> clubMap = new HashMap<>();
            clubMap.put("id", club.getId());
            clubMap.put("name", club.getName());
            clubMap.put("category", club.getCategory());
            clubMap.put("imageUrl", club.getImageUrl());
            clubMap.put("description", club.getDescription());
            clubMap.put("memberCount", memberCount);
            clubMap.put("isMember", joinedClubIds.contains(club.getId()));
            rec.put("item", clubMap);

            recommendations.add(rec);
        }

        // Sort recommendations by score descending (which incorporates popularity + AI preference)
        recommendations.sort((a, b) -> {
            int scoreCompare = Long.compare((Long) b.get("score"), (Long) a.get("score"));
            if (scoreCompare != 0) return scoreCompare;
            
            // Secondary sort by ID if scores are equal (fallback to newest)
            Map<String, Object> itemA = (Map<String, Object>) a.get("item");
            Map<String, Object> itemB = (Map<String, Object>) b.get("item");
            return Long.compare((Long) itemB.get("id"), (Long) itemA.get("id"));
        });

        return ResponseEntity.ok(recommendations);
    }
}
