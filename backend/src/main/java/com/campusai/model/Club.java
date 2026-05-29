package com.campusai.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "clubs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;

    private String imageUrl;
    
    private String tags;

    private String venue;

    private java.time.LocalDateTime startDate;

    private String timing;

    private Integer maxMembers;

    private String contactEmail;

    private String clubHeadName;
    
    @Column(nullable = false)
    private Long createdBy;
}
