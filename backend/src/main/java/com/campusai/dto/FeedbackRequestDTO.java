package com.campusai.dto;

import lombok.Data;

@Data
public class FeedbackRequestDTO {
    private Long eventId;
    private Integer rating;
    private String comments;
}
