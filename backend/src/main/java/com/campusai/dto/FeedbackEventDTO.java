package com.campusai.dto;

import com.campusai.model.Event;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackEventDTO {
    private Event event;
    private boolean feedbackSubmitted;
}
