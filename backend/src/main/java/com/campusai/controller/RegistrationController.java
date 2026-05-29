package com.campusai.controller;

import com.campusai.model.Event;
import com.campusai.model.Registration;
import com.campusai.repository.EventRepository;
import com.campusai.repository.RegistrationRepository;
import com.campusai.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {

    @Autowired
    RegistrationRepository registrationRepository;

    @Autowired
    EventRepository eventRepository;

    @GetMapping("/my-events")
    public ResponseEntity<?> getMyEvents(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<Registration> regs = registrationRepository.findByUserId(userDetails.getId());
        
        List<Map<String, Object>> result = regs.stream().map(r -> {
            Event event = eventRepository.findById(r.getEventId()).orElse(null);
            return Map.of(
                "registration", r,
                "event", event != null ? event : new Object()
            );
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/status/{eventId}")
    public ResponseEntity<?> getRegistrationStatus(@PathVariable Long eventId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return registrationRepository.findByUserIdAndEventId(userDetails.getId(), eventId)
                .map(r -> ResponseEntity.ok(Map.of("registered", true, "status", r.getAttendanceStatus())))
                .orElse(ResponseEntity.ok(Map.of("registered", false)));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<?> cancelRegistration(@PathVariable Long eventId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Registration r = registrationRepository.findByUserIdAndEventId(userDetails.getId(), eventId)
                .orElseThrow(() -> new RuntimeException("Not registered"));
        registrationRepository.delete(r);
        return ResponseEntity.ok("Registration cancelled");
    }
}
