package com.campusai.service;

import com.campusai.model.Club;
import com.campusai.model.Event;
import com.campusai.repository.ClubRepository;
import com.campusai.repository.EventRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private ClubRepository clubRepository;

    // Shift to the stable 'v1' API endpoint for gemini-1.5-flash
    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=";

    public String generateResponse(String userMessage) {
        try {
            // Build Context from Database
            List<Event> upcomingEvents = eventRepository.findAll();
            List<Club> activeClubs = clubRepository.findAll();

            String eventsContext = upcomingEvents.isEmpty() ? "No upcoming events right now." :
                    upcomingEvents.stream()
                            .limit(5)
                            .map(e -> e.getTitle() + " (" + e.getCategory() + ")")
                            .collect(Collectors.joining(", "));

            String clubsContext = activeClubs.isEmpty() ? "No active clubs right now." :
                    activeClubs.stream()
                            .limit(5)
                            .map(c -> c.getName() + " (" + c.getCategory() + ")")
                            .collect(Collectors.joining(", "));

            // Construct System Prompt
            String systemPrompt = "You are a helpful AI Assistant for CampusAI, a university platform for clubs and events. " +
                    "Be highly conversational, friendly, and concise. " +
                    "Use the following real-time data to answer the user's questions contextually: " +
                    "Active Clubs: [" + clubsContext + "]. " +
                    "Upcoming Events: [" + eventsContext + "]. " +
                    "If the user asks a question not related to clubs, events, or campus life, politely pivot back to those topics. " +
                    "If the user asks for recommendations, explicitly suggest events from the upcoming events list based on their interests or clubs. " +
                    "Keep your responses short (under 4 sentences) unless asked for details. " +
                    "Do NOT invent events or clubs that are not in the context. " +
                    "The user says: " + userMessage;

            // Prepare HTTP Request Payload using Jackson ObjectMapper (handles escaping automatically)
            Map<String, Object> payloadMap = new HashMap<>();
            Map<String, Object> partMap = new HashMap<>();
            partMap.put("text", systemPrompt);
            Map<String, Object> contentMap = new HashMap<>();
            contentMap.put("parts", Collections.singletonList(partMap));
            payloadMap.put("contents", Collections.singletonList(contentMap));

            ObjectMapper mapper = new ObjectMapper();
            String jsonPayload = mapper.writeValueAsString(payloadMap);

            // Verbose logging of the Request Details
            System.out.println("==============================================================");
            System.out.println("[GEMINI AI REQUEST]");
            System.out.println("Target URL: " + GEMINI_API_URL + (geminiApiKey != null && geminiApiKey.length() > 8 ? geminiApiKey.substring(0, 8) + "..." : "null/empty"));
            System.out.println("Payload: " + jsonPayload);
            System.out.println("==============================================================");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> requestEntity = new HttpEntity<>(jsonPayload, headers);

            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.postForObject(GEMINI_API_URL + geminiApiKey, requestEntity, String.class);

            // Verbose logging of the Response Details
            System.out.println("==============================================================");
            System.out.println("[GEMINI AI RESPONSE]");
            System.out.println("Raw Response Body: " + response);
            System.out.println("==============================================================");

            // Robust JSON parsing using Jackson JsonNode
            if (response != null) {
                JsonNode rootNode = mapper.readTree(response);
                JsonNode textNode = rootNode.path("candidates")
                        .path(0)
                        .path("content")
                        .path("parts")
                        .path(0)
                        .path("text");
                if (!textNode.isMissingNode()) {
                    return textNode.asText();
                }
            }

            return "I received a response, but couldn't parse it correctly. Please try again.";

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("[GEMINI AI ERROR]: " + e.getMessage());
            // Bubble up the actual Exception to the chat interface for easy debugging
            return "AI Service Error: " + e.getMessage() + " (" + e.getClass().getSimpleName() + ")";
        }
    }
}
