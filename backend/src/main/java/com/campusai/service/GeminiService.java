package com.campusai.service;

import com.campusai.model.Club;
import com.campusai.model.Event;
import com.campusai.repository.ClubRepository;
import com.campusai.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private ClubRepository clubRepository;

    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

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

            // Prepare HTTP Request Payload
            String jsonPayload = String.format(
                    "{\"contents\": [{\"parts\": [{\"text\": \"%s\"}]}]}",
                    systemPrompt.replace("\"", "\\\"").replace("\n", " ")
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> requestEntity = new HttpEntity<>(jsonPayload, headers);

            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.postForObject(GEMINI_API_URL + geminiApiKey, requestEntity, String.class);

            // Very basic JSON parsing without a heavy library dependency
            // Gemini response looks like: {"candidates": [{"content": {"parts": [{"text": "Hello world!"}]}}]}
            if (response != null && response.contains("\"text\": \"")) {
                int startIndex = response.indexOf("\"text\": \"") + 9;
                int endIndex = response.indexOf("\"", startIndex);
                // Handle newlines which might be escaped as \n
                String extractedText = response.substring(startIndex, endIndex);
                extractedText = extractedText.replace("\\n", "\n").replace("\\\"", "\"");
                return extractedText;
            }

            return "I received a response, but couldn't parse it correctly. Please try again.";

        } catch (Exception e) {
            e.printStackTrace();
            return "I'm sorry, I am having trouble connecting to my neural network right now. Please try again later.";
        }
    }
}
