package com.campusai.config;

import com.campusai.model.User;
import com.campusai.model.Club;
import com.campusai.model.Event;
import com.campusai.repository.UserRepository;
import com.campusai.repository.ClubRepository;
import com.campusai.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    UserRepository userRepository;

    @Autowired
    ClubRepository clubRepository;

    @Autowired
    EventRepository eventRepository;

    @Autowired
    PasswordEncoder encoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Super Admin if not exists
        String adminEmail = "vipulsharma123@gmail.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .name("Super Admin")
                    .username("vipulsharma123")
                    .email(adminEmail)
                    .password(encoder.encode("admin123"))
                    .role(User.Role.ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("Super Admin seeded successfully with email: " + adminEmail);
        } else {
            // Ensure existing seeded user has ADMIN role
            userRepository.findByEmail(adminEmail).ifPresent(admin -> {
                if (admin.getRole() != User.Role.ADMIN) {
                    admin.setRole(User.Role.ADMIN);
                    userRepository.save(admin);
                    System.out.println("Updated existing user " + adminEmail + " to ADMIN role.");
                }
            });
        }

        // 2. Migrate existing events status to PUBLISHED if null
        List<Event> events = eventRepository.findAll();
        long migratedEvents = 0;
        for (Event event : events) {
            if (event.getStatus() == null) {
                event.setStatus("PUBLISHED");
                eventRepository.save(event);
                migratedEvents++;
            }
        }
        if (migratedEvents > 0) {
            System.out.println("Migrated " + migratedEvents + " events to status PUBLISHED.");
        }

        // 3. Migrate existing clubs status to PUBLISHED if null
        List<Club> clubs = clubRepository.findAll();
        long migratedClubs = 0;
        for (Club club : clubs) {
            if (club.getStatus() == null) {
                club.setStatus("PUBLISHED");
                clubRepository.save(club);
                migratedClubs++;
            }
        }
        if (migratedClubs > 0) {
            System.out.println("Migrated " + migratedClubs + " clubs to status PUBLISHED.");
        }
    }
}
