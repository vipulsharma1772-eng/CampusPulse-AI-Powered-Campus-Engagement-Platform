package com.campusai.controller;

import com.campusai.model.Certificate;
import com.campusai.model.Club;
import com.campusai.model.Event;
import com.campusai.model.Registration;
import com.campusai.repository.CertificateRepository;
import com.campusai.repository.ClubRepository;
import com.campusai.repository.EventRepository;
import com.campusai.repository.RegistrationRepository;
import com.campusai.security.UserDetailsImpl;
import com.campusai.service.CertificateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private CertificateService certificateService;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private ClubRepository clubRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @GetMapping("/my")
    public ResponseEntity<?> getMyCertificates(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        // Auto-generate missing certificates for ALL registered events
        List<Registration> registrations = registrationRepository.findByUserId(userDetails.getId());
        for (Registration reg : registrations) {
            certificateService.issueCertificate(userDetails.getId(), reg.getEventId());
        }

        List<Certificate> certificates = certificateRepository.findByUserId(userDetails.getId());
        List<Map<String, Object>> result = new ArrayList<>();

        if (certificates.isEmpty()) {
            System.out.println("No certificates found. Generating DEMO certificate.");
            Map<String, Object> demo = new HashMap<>();
            demo.put("id", 9999L);
            demo.put("certificateNumber", "DEMO-" + java.util.UUID.randomUUID().toString().substring(0, 8));
            demo.put("certificateUrl", "/api/certificates/9999/download");
            demo.put("issuedDate", java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")));
            demo.put("eventName", "AI Workshop Demo Event");
            demo.put("clubName", "CampusAI Demo Club");
            result.add(demo);
        } else {
            for (Certificate cert : certificates) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", cert.getId());
                map.put("certificateNumber", cert.getCertificateNumber());
                map.put("certificateUrl", "/api/certificates/" + cert.getId() + "/download");
                map.put("issuedDate", cert.getIssuedDate() != null ? cert.getIssuedDate().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")) : "N/A");

                Event event = eventRepository.findById(cert.getEventId()).orElse(null);
                if (event != null) {
                    map.put("eventName", event.getTitle());
                    Club club = (event.getClubId() != null) ? clubRepository.findById(event.getClubId()).orElse(null) : null;
                    map.put("clubName", club != null ? club.getName() : "CampusAI Platform");
                } else {
                    map.put("eventName", "Unknown Event");
                    map.put("clubName", "Unknown Club");
                }
                result.add(map);
            }
        }

        System.out.println("Certificates fetched successfully for user: " + userDetails.getId() + ", total count: " + result.size());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (id == 9999L) {
            byte[] demoPdf = certificateService.generateDemoPdfBytes();
            if (demoPdf == null) {
                System.out.println("Error: Failed to generate DEMO PDF");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "Certificate_DEMO.pdf");
            return new ResponseEntity<>(demoPdf, headers, HttpStatus.OK);
        }

        Optional<Certificate> certOpt = certificateRepository.findById(id);
        if (!certOpt.isPresent() || !certOpt.get().getUserId().equals(userDetails.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        byte[] pdfBytes = certificateService.getPdfBytes(id);
        if (pdfBytes == null || pdfBytes.length == 0) {
            System.out.println("Error: Failed to read PDF bytes for certificate ID " + id);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "Certificate_" + id + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
