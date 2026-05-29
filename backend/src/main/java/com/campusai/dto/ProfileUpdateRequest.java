package com.campusai.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String name;
    private String branch;
    private String interests;
    private String bio;
    private String profileImage;
}
