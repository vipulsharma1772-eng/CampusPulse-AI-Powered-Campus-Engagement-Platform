package com.campusai.controller;

import com.campusai.model.Club;
import com.campusai.model.Event;
import com.campusai.repository.ClubRepository;
import com.campusai.repository.EventRepository;
import com.campusai.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}, maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    EventRepository eventRepository;

    @Autowired
    ClubRepository clubRepository;

    private boolean checkAdmin(UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return false;
        }
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping("/events/pending")
    public ResponseEntity<?> getPendingEvents(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (!checkAdmin(userDetails)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden: Admin role required");
        }
        List<Event> pendingEvents = eventRepository.findAll().stream()
                .filter(e -> "PENDING".equalsIgnoreCase(e.getStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(pendingEvents);
    }

    @GetMapping("/clubs/pending")
    public ResponseEntity<?> getPendingClubs(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (!checkAdmin(userDetails)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden: Admin role required");
        }
        List<Club> pendingClubs = clubRepository.findAll().stream()
                .filter(c -> "PENDING".equalsIgnoreCase(c.getStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(pendingClubs);
    }

    @PutMapping("/events/{id}/approve")
    public ResponseEntity<?> approveEvent(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (!checkAdmin(userDetails)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden: Admin role required");
        }
        Optional<Event> eventOpt = eventRepository.findById(id);
        if (eventOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Event event = eventOpt.get();
        event.setStatus("PUBLISHED");
        eventRepository.save(event);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Event approved and published successfully.");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/events/{id}/reject")
    public ResponseEntity<?> rejectEvent(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (!checkAdmin(userDetails)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden: Admin role required");
        }
        Optional<Event> eventOpt = eventRepository.findById(id);
        if (eventOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Event event = eventOpt.get();
        event.setStatus("REJECTED");
        eventRepository.save(event);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Event rejected successfully.");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/clubs/{id}/approve")
    public ResponseEntity<?> approveClub(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (!checkAdmin(userDetails)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden: Admin role required");
        }
        Optional<Club> clubOpt = clubRepository.findById(id);
        if (clubOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Club club = clubOpt.get();
        club.setStatus("PUBLISHED");
        clubRepository.save(club);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Club approved and published successfully.");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/clubs/{id}/reject")
    public ResponseEntity<?> rejectClub(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (!checkAdmin(userDetails)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden: Admin role required");
        }
        Optional<Club> clubOpt = clubRepository.findById(id);
        if (clubOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Club club = clubOpt.get();
        club.setStatus("REJECTED");
        clubRepository.save(club);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Club rejected successfully.");
        return ResponseEntity.ok(response);
    }
}
