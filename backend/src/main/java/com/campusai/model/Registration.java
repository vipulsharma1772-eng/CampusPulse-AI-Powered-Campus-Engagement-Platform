package com.campusai.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "registrations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long eventId;

    @Column(updatable = false)
    private LocalDateTime registrationDate;

    private String attendanceStatus; // PENDING, ATTENDED, MISSED

    @PrePersist
    protected void onCreate() {
        registrationDate = LocalDateTime.now();
        if (attendanceStatus == null) {
            attendanceStatus = "PENDING";
        }
    }
}
