package com.campusai.service;

import com.campusai.model.Club;
import com.campusai.model.Event;
import com.campusai.repository.ClubRepository;
import com.campusai.repository.EventRepository;
import com.campusai.repository.UserRepository;
import com.campusai.repository.RegistrationRepository;
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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    // Shift to the stable 'v1' API endpoint for gemini-2.5-flash-lite (higher free-tier rate limits)
    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=";

    public String generateResponse(String userMessage) {
        try {
            // Build Dynamic Context from Database
            List<Event> upcomingEvents = eventRepository.findAll();
            List<Club> activeClubs = clubRepository.findAll();
            long totalUsers = userRepository.count();
            long totalRegistrations = registrationRepository.count();

            // Format dynamic database entities details
            String eventsContext = upcomingEvents.isEmpty() ? "No events are registered in the database." :
                    upcomingEvents.stream()
                            .limit(15)
                            .map(e -> "- " + e.getTitle() + " [ID: " + e.getId() + "] (Category: " + e.getCategory() + ", Date: " + e.getDate() + ", Venue: " + e.getVenue() + ", Organizer: " + e.getOrganizerName() + ", Max Participants: " + e.getMaxParticipants() + ", Status: " + e.getStatus() + ")")
                            .collect(Collectors.joining("\n"));

            String clubsContext = activeClubs.isEmpty() ? "No clubs are registered in the database." :
                    activeClubs.stream()
                            .limit(15)
                            .map(c -> "- " + c.getName() + " [ID: " + c.getId() + "] (Category: " + c.getCategory() + ", Head: " + c.getClubHeadName() + ", Contact: " + c.getContactEmail() + ", Venue: " + c.getVenue() + ", Status: " + c.getStatus() + ")")
                            .collect(Collectors.joining("\n"));

            List<com.campusai.model.User> allUsers = userRepository.findAll();
            String platformUsersSummary = allUsers.isEmpty() ? "No students/users are registered in the database yet." :
                    allUsers.stream()
                            .limit(10)
                            .map(u -> "- " + u.getName() + " (" + u.getUsername() + ", Role: " + u.getRole() + ", Branch: " + (u.getBranch() != null ? u.getBranch() : "Not Specified") + ")")
                            .collect(Collectors.joining("\n"));

            // Identify active authenticated user context dynamically
            String currentUserContext = "Not Authenticated / Anonymous User";
            String userRegistrationsContext = "The user is not authenticated, so there are no personal registrations available.";
            try {
                org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof com.campusai.security.UserDetailsImpl) {
                    com.campusai.security.UserDetailsImpl userDetails = (com.campusai.security.UserDetailsImpl) auth.getPrincipal();
                    java.util.Optional<com.campusai.model.User> userOpt = userRepository.findById(userDetails.getId());
                    if (userOpt.isPresent()) {
                        com.campusai.model.User user = userOpt.get();
                        currentUserContext = "ID: " + user.getId() + ", Name: " + user.getName() + 
                                ", Email: " + user.getEmail() + ", Username: " + user.getUsername() + 
                                ", Branch: " + (user.getBranch() != null ? user.getBranch() : "Not Specified") + 
                                ", Interests: " + (user.getInterests() != null ? user.getInterests() : "None") + 
                                ", Bio: " + (user.getBio() != null ? user.getBio() : "None") + 
                                ", Role: " + user.getRole();
                        
                        // Fetch this user's specific event registrations
                        List<com.campusai.model.Registration> myRegs = registrationRepository.findByUserId(user.getId());
                        if (myRegs.isEmpty()) {
                            userRegistrationsContext = "The user has not registered for any events yet.";
                        } else {
                            userRegistrationsContext = myRegs.stream()
                                    .map(reg -> {
                                        Event event = eventRepository.findById(reg.getEventId()).orElse(null);
                                        if (event != null) {
                                            return "- " + event.getTitle() + " (Date: " + event.getDate() + ", Attendance: " + reg.getAttendanceStatus() + ")";
                                        }
                                        return "";
                                    })
                                    .filter(s -> !s.isEmpty())
                                    .collect(Collectors.joining("\n"));
                        }
                    }
                }
            } catch (Exception ex) {
                System.err.println("Could not resolve authenticated user context: " + ex.getMessage());
            }

            // Construct System Prompt
            String systemPrompt = "You are the official CampusPulse Support & Engagement AI Assistant, a friendly and highly knowledgeable helper for the CampusPulse university platform.\n\n" +
                    "Your primary goal is to guide students and organizers through all the features of CampusPulse and answer their campus-life questions. Always prioritize answering questions about CampusPulse features and actual database entities before using general knowledge.\n\n" +
                    "Here are the exact core features of CampusPulse that you are fully aware of and should explain clearly to users:\n" +
                    "1. **Event Registration**: Users can browse upcoming events on the 'Events' page, view detailed schedules/venues, and click the 'Register' button on the event's detail page to sign up. They can view registered events on the 'My Events' section in their dashboard.\n" +
                    "2. **Smart Attendance**: Attendance can be marked on the 'Smart Attendance' page. Depending on organizer configuration, users check in by scanning event-specific QR codes, entering a custom check-in code, or completing face validation.\n" +
                    "3. **Certificate Downloads**: After registering for and completing an event, the system automatically generates a unique PDF certificate. Users can go to the 'Certificates' page or access it from their dashboard to view a list of issued certificates and click 'Download' to save the high-quality PDF.\n" +
                    "4. **Club Joining & Memberships**: Users browse student-run groups on the 'Clubs' page. They click 'Join Club' to instantly become members, giving them access to post updates, participate in announcements/discussions, and view coordinates. They can leave a club at any time by clicking 'Leave Club'.\n" +
                    "5. **User Profiles**: Accessible via the 'Profile' page (/profile). Users can customize their Name, Bio, academic Branch (department), academic Interests, and upload a customized Profile Image.\n" +
                    "6. **Private Chat System**: Direct real-time messaging with other students, club heads, or organizers. Navigate to the 'Messages' page (/messages), select a user from the directory, and exchange text messages or upload images.\n" +
                    "7. **Dashboard Analytics**: Visually represents real-time campus activities, registrations, and engagement graphs. Accessible via the 'Analytics' page or the main dashboard, it displays registration trends, activity logs, and attendance charts.\n" +
                    "8. **AI Recommendations**: Personalized smart discovery. By visiting the 'Recommendations' section, the platform analyzes user profile interests and branch data to suggest the most relevant clubs to join and upcoming events to attend.\n" +
                    "9. **Admin Panel Features**: For administrators and designated club heads. Provides extensive controls to approve or reject new club submissions, publish/unpublish events, moderate posts, manage memberships, and analyze institution-wide engagement metrics.\n\n" +
                    "Additionally, use the following real-time database context to answer contextual questions:\n" +
                    "- Current Authenticated User talking to you: [" + currentUserContext + "]\n" +
                    "- This user's specific event registrations: \n" + userRegistrationsContext + "\n\n" +
                    "- Platform-wide Analytics & Statistics:\n" +
                    "  * Total Registered Students/Users: " + totalUsers + "\n" +
                    "  * Total Active Clubs: " + activeClubs.size() + "\n" +
                    "  * Total Events: " + upcomingEvents.size() + "\n" +
                    "  * Total Event Registrations Institution-wide: " + totalRegistrations + "\n\n" +
                    "- Active Clubs list in the database: \n" + clubsContext + "\n\n" +
                    "- Upcoming Events list in the database: \n" + eventsContext + "\n\n" +
                    "- Registered users/students list (Limit 10): \n" + platformUsersSummary + "\n\n" +
                    "Instructions for Responses:\n" +
                    "- ALWAYS answer using the actual, real-time database context and platform data provided above whenever a user asks about events, clubs, registrations, or users.\n" +
                    "- If a user asks 'Who am I?', 'What department am I in?', or 'What events have I registered for?', use the current authenticated user context and registrations context above to answer in a warm, personal tone.\n" +
                    "- If a user asks how to perform any action on the platform (e.g., 'How do I download my certificate?'), explain the exact CampusPulse feature and navigation process details listed above instead of saying you cannot help.\n" +
                    "- If a user asks for recommendations or real-time info, suggest clubs or events explicitly from the active database context provided above. Do NOT invent events or clubs not listed in the context.\n" +
                    "- Keep your tone conversational, enthusiastic, helpful, and concise (under 4-5 sentences, unless detailed navigation instructions are requested).\n" +
                    "- Format your answers with clear markdown formatting and friendly emojis.\n\n" +
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

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            e.printStackTrace();
            System.err.println("[GEMINI AI HTTP ERROR]: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                return "⚠️ **Rate Limit Exceeded**: The CampusPulse AI Assistant is currently experiencing very high demand and has temporarily hit its free-tier rate limits (15-30 requests per minute). Please wait a few moments and try your message again! ⏳";
            }
            if (e.getResponseBodyAsString().contains("RESOURCE_EXHAUSTED") || e.getResponseBodyAsString().contains("quota")) {
                return "⚠️ **Quota Exhausted**: The free-tier API quota for this Gemini model has been temporarily exhausted. Please wait a moment and try again, or ask a platform administrator to configure a billing-enabled API key. ⚙️";
            }
            return "AI Service Error: " + e.getMessage() + " (" + e.getClass().getSimpleName() + ")";
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("[GEMINI AI ERROR]: " + e.getMessage());
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("429") || msg.contains("RESOURCE_EXHAUSTED") || msg.contains("quota")) {
                return "⚠️ **Rate Limit Exceeded**: The CampusPulse AI Assistant has temporarily reached its free-tier API quota. Please wait a few moments and try again! ⏳";
            }
            return "AI Service Error: " + e.getMessage() + " (" + e.getClass().getSimpleName() + ")";
        }
    }
}
