package com.campusai.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/upload")
public class ImageUploadController {

    private final String BASE_UPLOAD_DIR = "uploads/";
    private final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList("image/jpeg", "image/png", "image/webp");

    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file, @RequestParam(value = "type", defaultValue = "clubs") String type) {
        java.util.Map<String, String> response = new java.util.HashMap<>();
        
        if (file.isEmpty()) {
            response.put("error", "Please select a file to upload.");
            return ResponseEntity.badRequest().body(response);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            response.put("error", "Invalid file type. Only JPG, PNG, and WEBP are allowed.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // Ensure directory exists
            String targetDir = BASE_UPLOAD_DIR + type + "/";
            Path uploadPath = Paths.get(targetDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = "";
            if (originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = UUID.randomUUID().toString() + fileExtension;

            // Save file
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return URL
            String fileUrl = "/" + targetDir + newFilename;
            
            response.put("url", fileUrl);
            response.put("message", "File uploaded successfully");
            
            return ResponseEntity.ok(response);

        } catch (IOException ex) {
            response.put("error", "Could not store the file. Error: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
