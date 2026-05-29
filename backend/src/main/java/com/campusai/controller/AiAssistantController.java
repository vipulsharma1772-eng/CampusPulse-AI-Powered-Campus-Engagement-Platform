package com.campusai.controller;

import com.campusai.dto.AiChatRequest;
import com.campusai.dto.AiChatResponse;
import com.campusai.model.Club;
import com.campusai.model.Event;
import com.campusai.repository.ClubRepository;
import com.campusai.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/ai")
public class AiAssistantController {

    @Autowired
    private com.campusai.service.GeminiService geminiService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> handleChat(@RequestBody AiChatRequest request) {
        String userMessage = request.getMessage();
        
        // Pass the message to the Gemini AI Engine
        String responseText = geminiService.generateResponse(userMessage);

        return ResponseEntity.ok(new AiChatResponse(responseText));
    }
}
