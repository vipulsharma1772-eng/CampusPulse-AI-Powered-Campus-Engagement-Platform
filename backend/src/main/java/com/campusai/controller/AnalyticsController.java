package com.campusai.controller;

import com.campusai.model.Club;
import com.campusai.model.ClubMember;
import com.campusai.model.Event;
import com.campusai.model.Feedback;
import com.campusai.model.Registration;
import com.campusai.model.User;
import com.campusai.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    EventRepository eventRepository;

    @Autowired
    RegistrationRepository registrationRepository;

    @Autowired
    FeedbackRepository feedbackRepository;

    @Autowired
    ClubRepository clubRepository;

    @Autowired
    ClubMemberRepository clubMemberRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        List<ClubMember> clubMembers = clubMemberRepository.findAll();
        List<Club> allClubs = clubRepository.findAll();
        Map<Long, Long> clubCreatorMap = allClubs.stream()
                .filter(c -> c.getId() != null && c.getCreatedBy() != null)
                .collect(Collectors.toMap(Club::getId, Club::getCreatedBy, (a, b) -> a));

        List<ClubMember> realJoins = clubMembers.stream()
                .filter(m -> {
                    Long creatorId = clubCreatorMap.get(m.getClubId());
                    return creatorId == null || !m.getUserId().equals(creatorId);
                })
                .collect(Collectors.toList());

        List<Registration> rawRegistrations = registrationRepository.findAll();
        List<Event> allEvents = eventRepository.findAll();
        Map<Long, Long> eventCreatorMap = allEvents.stream()
                .filter(e -> e.getId() != null && e.getOrganizerId() != null)
                .collect(Collectors.toMap(Event::getId, Event::getOrganizerId, (a, b) -> a));

        List<Registration> registrations = rawRegistrations.stream()
                .filter(r -> {
                    Long creatorId = eventCreatorMap.get(r.getEventId());
                    return creatorId == null || !r.getUserId().equals(creatorId);
                })
                .collect(Collectors.toList());

        // 1. Core Event Metrics: count unique registered users across all events
        long uniqueRegisteredUsers = registrations.stream()
                .map(Registration::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        stats.put("totalUsers", uniqueRegisteredUsers);
        stats.put("totalEvents", eventRepository.count());

        // Calculate real satisfaction rating from FeedbackRepository
        List<Feedback> allFeedbacks = feedbackRepository.findAll();
        String averageSatisfaction = "95%";
        if (!allFeedbacks.isEmpty()) {
            double totalRating = 0;
            for (Feedback feedback : allFeedbacks) {
                totalRating += feedback.getRating();
            }
            double avgRating = totalRating / allFeedbacks.size();
            double satisfactionPercentage = (avgRating / 5.0) * 100.0;
            averageSatisfaction = String.format("%.0f%%", satisfactionPercentage);
        }
        stats.put("averageSatisfaction", averageSatisfaction);

        // 2. Attendance Trends (Line Graph: last 6 calendar months registrations count)
        List<String> attendanceTrendsLabels = new ArrayList<>();
        List<Integer> attendanceTrendsData = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 5; i >= 0; i--) {
            LocalDateTime targetMonth = now.minusMonths(i);
            String monthName = targetMonth.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            attendanceTrendsLabels.add(monthName);

            int year = targetMonth.getYear();
            int monthVal = targetMonth.getMonthValue();
            long count = registrations.stream()
                    .filter(r -> r.getRegistrationDate() != null
                            && r.getRegistrationDate().getYear() == year
                            && r.getRegistrationDate().getMonthValue() == monthVal)
                    .count();
            attendanceTrendsData.add((int) count);
        }
        stats.put("attendanceTrendsLabels", attendanceTrendsLabels);
        stats.put("attendanceTrendsData", attendanceTrendsData);

        // 3. Popular Categories (Bar Graph: Category-wise registrations mapped to Design, Social, Business, Technology)
        Map<String, Integer> categoryCounts = new HashMap<>();
        categoryCounts.put("Design", 0);
        categoryCounts.put("Social", 0);
        categoryCounts.put("Business", 0);
        categoryCounts.put("Technology", 0);

        for (Registration reg : registrations) {
            Optional<Event> eventOpt = allEvents.stream().filter(e -> e.getId().equals(reg.getEventId())).findFirst();
            if (eventOpt.isPresent()) {
                String cat = eventOpt.get().getCategory();
                String normalized = "Technology";
                if (cat != null) {
                    String lower = cat.toLowerCase();
                    if (lower.contains("design")) {
                        normalized = "Design";
                    } else if (lower.contains("social")) {
                        normalized = "Social";
                    } else if (lower.contains("business")) {
                        normalized = "Business";
                    } else if (lower.contains("tech") || lower.contains("engineer") || lower.contains("compet")) {
                        normalized = "Technology";
                    }
                }
                categoryCounts.put(normalized, categoryCounts.get(normalized) + 1);
            }
        }
        
        List<String> popularCategoriesLabels = new ArrayList<>();
        List<Integer> popularCategoriesData = new ArrayList<>();
        for (String key : new String[]{"Social", "Business", "Design", "Technology"}) {
            popularCategoriesLabels.add(key);
            popularCategoriesData.add(categoryCounts.get(key));
        }
        stats.put("popularCategoriesLabels", popularCategoriesLabels);
        stats.put("popularCategoriesData", popularCategoriesData);

        // 4. Core Club Metrics
        stats.put("totalClubMembers", realJoins.size());

        long uniqueStudentsInClubs = realJoins.stream()
                .map(ClubMember::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        stats.put("totalStudentsInClubs", uniqueStudentsInClubs);

        // 5. Club Join Trends (Line Graph: last 6 calendar months club member joins)
        List<String> clubJoinTrendsLabels = new ArrayList<>();
        List<Integer> clubJoinTrendsData = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime targetMonth = now.minusMonths(i);
            String monthName = targetMonth.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            clubJoinTrendsLabels.add(monthName);

            int year = targetMonth.getYear();
            int monthVal = targetMonth.getMonthValue();
            long count = realJoins.stream()
                    .filter(m -> m.getJoinedAt() != null
                            && m.getJoinedAt().getYear() == year
                            && m.getJoinedAt().getMonthValue() == monthVal)
                    .count();
            clubJoinTrendsData.add((int) count);
        }
        stats.put("clubJoinTrendsLabels", clubJoinTrendsLabels);
        stats.put("clubJoinTrendsData", clubJoinTrendsData);

        // 6. Popular Clubs (Bar Graph: sorted top 4 clubs by member counts)
        Map<Long, Integer> clubCounts = new HashMap<>();
        for (ClubMember member : realJoins) {
            clubCounts.put(member.getClubId(), clubCounts.getOrDefault(member.getClubId(), 0) + 1);
        }

        List<Map.Entry<Club, Integer>> sortedClubs = allClubs.stream()
                .map(club -> new AbstractMap.SimpleEntry<>(club, clubCounts.getOrDefault(club.getId(), 0)))
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(4)
                .collect(Collectors.toList());

        List<String> popularClubsLabels = new ArrayList<>();
        List<Integer> popularClubsData = new ArrayList<>();
        for (Map.Entry<Club, Integer> entry : sortedClubs) {
            popularClubsLabels.add(entry.getKey().getName());
            popularClubsData.add(entry.getValue());
        }
        // If less than 4 clubs exist, pad with standard/mock clubs just to make visual charts beautiful and stable
        if (popularClubsLabels.isEmpty()) {
            popularClubsLabels.add("No Clubs Yet");
            popularClubsData.add(0);
        }
        stats.put("popularClubsLabels", popularClubsLabels);
        stats.put("popularClubsData", popularClubsData);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/registrations-details")
    public ResponseEntity<?> getRegistrationsDetails() {
        List<Registration> registrations = registrationRepository.findAll();
        List<User> allUsers = userRepository.findAll();
        List<Event> allEvents = eventRepository.findAll();

        List<Map<String, Object>> details = new ArrayList<>();
        for (Registration reg : registrations) {
            Optional<User> userOpt = allUsers.stream().filter(u -> u.getId() != null && u.getId().equals(reg.getUserId())).findFirst();
            Optional<Event> eventOpt = allEvents.stream().filter(e -> e.getId() != null && e.getId().equals(reg.getEventId())).findFirst();

            if (userOpt.isPresent() && eventOpt.isPresent()) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", reg.getId());
                map.put("studentName", userOpt.get().getName() != null ? userOpt.get().getName() : "Unknown");
                map.put("studentEmail", userOpt.get().getEmail() != null ? userOpt.get().getEmail() : "No Email");
                map.put("eventName", eventOpt.get().getTitle() != null ? eventOpt.get().getTitle() : "Unnamed Event");
                
                String cat = eventOpt.get().getCategory();
                String normalized = "Technology";
                if (cat != null) {
                    String lower = cat.toLowerCase();
                    if (lower.contains("design")) {
                        normalized = "Design";
                    } else if (lower.contains("social")) {
                        normalized = "Social";
                    } else if (lower.contains("business")) {
                        normalized = "Business";
                    } else if (lower.contains("tech") || lower.contains("engineer") || lower.contains("compet")) {
                        normalized = "Technology";
                    }
                }
                map.put("eventCategory", normalized);
                map.put("registrationDate", reg.getRegistrationDate());
                map.put("attendanceStatus", reg.getAttendanceStatus() != null ? reg.getAttendanceStatus() : "PENDING");
                details.add(map);
            }
        }
        return ResponseEntity.ok(details);
    }

    @GetMapping("/campus-activity")
    public ResponseEntity<?> getCampusActivity(@RequestParam(value = "club", required = false) String clubName) {
        Map<String, Object> response = new HashMap<>();

        List<Registration> rawRegistrations = registrationRepository.findAll();
        List<ClubMember> clubMembers = clubMemberRepository.findAll();
        List<User> allUsers = userRepository.findAll();
        List<Event> allEvents = eventRepository.findAll();
        List<Club> allClubs = clubRepository.findAll();

        Map<Long, Long> eventCreatorMap = allEvents.stream()
                .filter(e -> e.getId() != null && e.getOrganizerId() != null)
                .collect(Collectors.toMap(Event::getId, Event::getOrganizerId, (a, b) -> a));

        List<Registration> registrations = rawRegistrations.stream()
                .filter(r -> {
                    Long creatorId = eventCreatorMap.get(r.getEventId());
                    return creatorId == null || !r.getUserId().equals(creatorId);
                })
                .collect(Collectors.toList());

        Map<Long, Long> clubCreatorMap = allClubs.stream()
                .filter(c -> c.getId() != null && c.getCreatedBy() != null)
                .collect(Collectors.toMap(Club::getId, Club::getCreatedBy, (a, b) -> a));

        List<ClubMember> realJoins = clubMembers.stream()
                .filter(m -> {
                    Long creatorId = clubCreatorMap.get(m.getClubId());
                    return creatorId == null || !m.getUserId().equals(creatorId);
                })
                .collect(Collectors.toList());

        // 1. Calculations for Platform-wide Summary Cards
        long totalRegisteredUsers = allUsers.size();
        long totalEventRegistrations = registrations.size();
        long totalClubRegistrations = realJoins.size();

        // Most Popular Category
        Map<String, Integer> categoryRegistrations = new HashMap<>();
        categoryRegistrations.put("Design", 0);
        categoryRegistrations.put("Social", 0);
        categoryRegistrations.put("Business", 0);
        categoryRegistrations.put("Technology", 0);
        categoryRegistrations.put("Sports", 0);

        for (Registration reg : registrations) {
            Optional<Event> eventOpt = allEvents.stream().filter(e -> e.getId() != null && e.getId().equals(reg.getEventId())).findFirst();
            if (eventOpt.isPresent()) {
                String cat = eventOpt.get().getCategory();
                if (cat != null) {
                    String matchedKey = null;
                    for (String key : categoryRegistrations.keySet()) {
                        if (key.equalsIgnoreCase(cat)) {
                            matchedKey = key;
                            break;
                        }
                    }
                    if (matchedKey != null) {
                        categoryRegistrations.put(matchedKey, categoryRegistrations.get(matchedKey) + 1);
                    }
                }
            }
        }
        String mostPopularCategory = "Technology";
        int maxRegCount = 0;
        for (Map.Entry<String, Integer> entry : categoryRegistrations.entrySet()) {
            if (entry.getValue() > maxRegCount) {
                maxRegCount = entry.getValue();
                mostPopularCategory = entry.getKey();
            }
        }

        // Most Joined Club
        String mostJoinedClub = "None";
        Map<Long, Integer> clubJoinCounts = new HashMap<>();
        for (ClubMember cm : realJoins) {
            clubJoinCounts.put(cm.getClubId(), clubJoinCounts.getOrDefault(cm.getClubId(), 0) + 1);
        }
        int maxClubCount = 0;
        for (Map.Entry<Long, Integer> entry : clubJoinCounts.entrySet()) {
            if (entry.getValue() > maxClubCount) {
                maxClubCount = entry.getValue();
                Optional<Club> clubOpt = allClubs.stream().filter(c -> c.getId() != null && c.getId().equals(entry.getKey())).findFirst();
                if (clubOpt.isPresent()) {
                    mostJoinedClub = clubOpt.get().getName();
                }
            }
        }

        // Total Active Users (Joined at least 1 event OR joined at least 1 club)
        Map<Long, Integer> studentActivityCount = new HashMap<>();
        for (Registration reg : registrations) {
            studentActivityCount.put(reg.getUserId(), studentActivityCount.getOrDefault(reg.getUserId(), 0) + 1);
        }
        for (ClubMember cm : realJoins) {
            studentActivityCount.put(cm.getUserId(), studentActivityCount.getOrDefault(cm.getUserId(), 0) + 1);
        }
        long totalActiveUsers = studentActivityCount.size();

        // 2. Category-wise Analytics
        List<Map<String, Object>> categoryAnalytics = new ArrayList<>();
        for (String cat : new String[]{"Business", "Social", "Technology", "Design", "Sports"}) {
            Map<String, Object> catMap = new HashMap<>();
            catMap.put("category", cat);
            
            long totalEvents = allEvents.stream().filter(e -> cat.equalsIgnoreCase(e.getCategory())).count();
            
            long totalParticipants = registrations.stream().filter(r -> {
                Optional<Event> eventOpt = allEvents.stream().filter(e -> e.getId() != null && e.getId().equals(r.getEventId())).findFirst();
                return eventOpt.isPresent() && cat.equalsIgnoreCase(eventOpt.get().getCategory());
            }).count();

            long attendanceCount = registrations.stream().filter(r -> {
                Optional<Event> eventOpt = allEvents.stream().filter(e -> e.getId() != null && e.getId().equals(r.getEventId())).findFirst();
                return eventOpt.isPresent() && cat.equalsIgnoreCase(eventOpt.get().getCategory()) && "ATTENDED".equals(r.getAttendanceStatus());
            }).count();

            long totalClubs = allClubs.stream().filter(c -> cat.equalsIgnoreCase(c.getCategory())).count();
            
            long totalClubMembers = realJoins.stream().filter(m -> {
                Optional<Club> clubOpt = allClubs.stream().filter(c -> c.getId() != null && c.getId().equals(m.getClubId())).findFirst();
                return clubOpt.isPresent() && cat.equalsIgnoreCase(clubOpt.get().getCategory());
            }).count();

            catMap.put("totalEvents", totalEvents);
            catMap.put("totalParticipants", totalParticipants);
            catMap.put("attendanceCount", attendanceCount);
            catMap.put("totalClubs", totalClubs);
            catMap.put("totalClubMembers", totalClubMembers);

            categoryAnalytics.add(catMap);
        }

        // 3. Real Activity Table rows
        List<Map<String, Object>> activityRows = new ArrayList<>();
        
        // Add registration rows
        for (Registration reg : registrations) {
            Optional<User> userOpt = allUsers.stream().filter(u -> u.getId() != null && u.getId().equals(reg.getUserId())).findFirst();
            Optional<Event> eventOpt = allEvents.stream().filter(e -> e.getId() != null && e.getId().equals(reg.getEventId())).findFirst();
            if (userOpt.isPresent() && eventOpt.isPresent()) {
                Map<String, Object> row = new HashMap<>();
                row.put("id", "reg-" + reg.getId());
                row.put("studentId", userOpt.get().getId());
                row.put("studentName", userOpt.get().getName());
                row.put("studentEmail", userOpt.get().getEmail());
                row.put("eventName", eventOpt.get().getTitle());
                row.put("eventCategory", eventOpt.get().getCategory() != null ? eventOpt.get().getCategory() : "Technology");
                
                // Map clubName dynamically using clubId!
                Long eventClubId = eventOpt.get().getClubId();
                String eventClubName = "";
                if (eventClubId != null) {
                    Optional<Club> clubOpt = allClubs.stream().filter(c -> c.getId() != null && c.getId().equals(eventClubId)).findFirst();
                    if (clubOpt.isPresent()) {
                        eventClubName = clubOpt.get().getName();
                    }
                }
                row.put("clubName", eventClubName);
                
                row.put("attendanceStatus", reg.getAttendanceStatus() != null ? reg.getAttendanceStatus() : "PENDING");
                row.put("date", reg.getRegistrationDate());
                
                // Row 1: Registration
                Map<String, Object> regRow = new HashMap<>(row);
                regRow.put("id", "reg-" + reg.getId());
                regRow.put("type", "EVENT_REG");
                if (clubName == null || clubName.trim().isEmpty() || eventClubName.equalsIgnoreCase(clubName.trim())) {
                    activityRows.add(regRow);
                }
                
                // Row 2: Attendance
                if ("ATTENDED".equalsIgnoreCase(reg.getAttendanceStatus())) {
                    Map<String, Object> attRow = new HashMap<>(row);
                    attRow.put("id", "att-" + reg.getId());
                    attRow.put("type", "EVENT_ATTEND");
                    if (clubName == null || clubName.trim().isEmpty() || eventClubName.equalsIgnoreCase(clubName.trim())) {
                        activityRows.add(attRow);
                    }
                }
            }
        }

        // Add account creation rows
        for (User u : allUsers) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", "user-" + u.getId());
            row.put("studentId", u.getId());
            row.put("studentName", u.getName());
            row.put("studentEmail", u.getEmail());
            row.put("eventName", "");
            row.put("eventCategory", "");
            row.put("clubName", "");
            row.put("attendanceStatus", "JOINED_PLATFORM");
            row.put("date", u.getCreatedAt() != null ? u.getCreatedAt() : LocalDateTime.now());
            row.put("type", "ACCOUNT");
            
            if (clubName == null || clubName.trim().isEmpty()) {
                activityRows.add(row);
            }
        }

        // Add club membership rows
        for (ClubMember cm : realJoins) {
            Optional<User> userOpt = allUsers.stream().filter(u -> u.getId() != null && u.getId().equals(cm.getUserId())).findFirst();
            Optional<Club> clubOpt = allClubs.stream().filter(c -> c.getId() != null && c.getId().equals(cm.getClubId())).findFirst();
            if (userOpt.isPresent() && clubOpt.isPresent()) {
                Map<String, Object> row = new HashMap<>();
                row.put("id", "club-" + cm.getId());
                row.put("studentId", userOpt.get().getId());
                row.put("studentName", userOpt.get().getName());
                row.put("studentEmail", userOpt.get().getEmail());
                row.put("eventName", "");
                row.put("eventCategory", clubOpt.get().getCategory() != null ? clubOpt.get().getCategory() : "");
                row.put("clubName", clubOpt.get().getName());
                row.put("attendanceStatus", "JOINED");
                row.put("date", cm.getJoinedAt());
                row.put("type", "CLUB");
                
                // Filter by clubName if query param is set
                if (clubName == null || clubName.trim().isEmpty() || clubOpt.get().getName().equalsIgnoreCase(clubName.trim())) {
                    activityRows.add(row);
                }
            }
        }
        
        // Sort activity rows by date descending
        activityRows.sort((a, b) -> {
            LocalDateTime da = (LocalDateTime) a.get("date");
            LocalDateTime db = (LocalDateTime) b.get("date");
            if (da == null) return 1;
            if (db == null) return -1;
            return db.compareTo(da);
        });

        // 4. Map the users list safely for client clickthroughs
        List<Map<String, Object>> usersList = new ArrayList<>();
        for (User u : allUsers) {
            Map<String, Object> uMap = new HashMap<>();
            uMap.put("id", u.getId());
            uMap.put("name", u.getName() != null ? u.getName() : "Unknown");
            uMap.put("email", u.getEmail() != null ? u.getEmail() : "No Email");
            uMap.put("role", u.getRole() != null ? u.getRole() : "ROLE_USER");
            usersList.add(uMap);
        }

        // 5. If a club is selected, update the counts dynamically to reflect that club's context!
        if (clubName != null && !clubName.trim().isEmpty()) {
            final String trimmed = clubName.trim();
            Optional<Club> selectedClubOpt = allClubs.stream()
                    .filter(c -> c.getName() != null && c.getName().equalsIgnoreCase(trimmed))
                    .findFirst();
            if (selectedClubOpt.isPresent()) {
                final Long selectedClubId = selectedClubOpt.get().getId();
                
                totalEventRegistrations = registrations.stream().filter(r -> {
                    Optional<Event> eventOpt = allEvents.stream().filter(e -> e.getId() != null && e.getId().equals(r.getEventId())).findFirst();
                    return eventOpt.isPresent() && selectedClubId.equals(eventOpt.get().getClubId());
                }).count();

                totalClubRegistrations = realJoins.stream().filter(cm -> selectedClubId.equals(cm.getClubId())).count();

                Set<Long> activeUserIds = new HashSet<>();
                registrations.stream().filter(r -> {
                    Optional<Event> eventOpt = allEvents.stream().filter(e -> e.getId() != null && e.getId().equals(r.getEventId())).findFirst();
                    return eventOpt.isPresent() && selectedClubId.equals(eventOpt.get().getClubId());
                }).forEach(r -> activeUserIds.add(r.getUserId()));
                realJoins.stream().filter(cm -> selectedClubId.equals(cm.getClubId())).forEach(cm -> activeUserIds.add(cm.getUserId()));
                totalActiveUsers = activeUserIds.size();
            } else {
                totalEventRegistrations = 0;
                totalClubRegistrations = 0;
                totalActiveUsers = 0;
            }
        }

        response.put("totalRegisteredUsers", totalRegisteredUsers);
        response.put("totalEventRegistrations", totalEventRegistrations);
        response.put("totalClubRegistrations", totalClubRegistrations);
        response.put("totalActiveUsers", totalActiveUsers);
        response.put("mostPopularCategory", mostPopularCategory);
        response.put("mostJoinedClub", mostJoinedClub);
        response.put("categoryAnalytics", categoryAnalytics);
        response.put("activityRows", activityRows);
        response.put("usersList", usersList);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/student-activity/{userId}")
    public ResponseEntity<?> getStudentActivityDetails(@PathVariable Long userId) {
        java.util.Map<String, Object> details = new java.util.HashMap<>();

        // Query the specific student
        Optional<User> studentOpt = userRepository.findById(userId);
        if (!studentOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        User student = studentOpt.get();

        List<Event> allEvents = eventRepository.findAll();
        List<Registration> registrations = registrationRepository.findByUserId(userId).stream()
                .filter(r -> {
                    Optional<Event> eventOpt = allEvents.stream().filter(e -> e.getId() != null && e.getId().equals(r.getEventId())).findFirst();
                    return eventOpt.isPresent() && (eventOpt.get().getOrganizerId() == null || !eventOpt.get().getOrganizerId().equals(userId));
                })
                .collect(Collectors.toList());
        List<Club> allClubs = clubRepository.findAll();

        List<ClubMember> clubMemberships = clubMemberRepository.findByUserId(userId).stream()
                .filter(cm -> {
                    Optional<Club> clubOpt = allClubs.stream().filter(c -> c.getId() != null && c.getId().equals(cm.getClubId())).findFirst();
                    return clubOpt.isPresent() && (clubOpt.get().getCreatedBy() == null || !clubOpt.get().getCreatedBy().equals(userId));
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> joinedEvents = new ArrayList<>();
        List<Map<String, Object>> attendedEvents = new ArrayList<>();
        List<Map<String, Object>> attendanceHistory = new ArrayList<>();

        Map<String, Integer> categoryCounts = new HashMap<>();
        categoryCounts.put("Technology", 0);
        categoryCounts.put("Design", 0);
        categoryCounts.put("Business", 0);
        categoryCounts.put("Social", 0);
        categoryCounts.put("Sports", 0);

        for (Registration reg : registrations) {
            Optional<Event> eventOpt = allEvents.stream().filter(e -> e.getId() != null && e.getId().equals(reg.getEventId())).findFirst();
            if (eventOpt.isPresent()) {
                Event event = eventOpt.get();
                Map<String, Object> eventMap = new HashMap<>();
                eventMap.put("id", event.getId());
                eventMap.put("title", event.getTitle() != null ? event.getTitle() : "Unnamed Event");
                eventMap.put("category", event.getCategory() != null ? event.getCategory() : "Technology");
                eventMap.put("date", event.getDate());
                eventMap.put("attendanceStatus", reg.getAttendanceStatus() != null ? reg.getAttendanceStatus() : "PENDING");
                eventMap.put("registrationDate", reg.getRegistrationDate());

                joinedEvents.add(eventMap);
                if ("ATTENDED".equals(reg.getAttendanceStatus())) {
                    attendedEvents.add(eventMap);
                }
                attendanceHistory.add(eventMap);

                // Group and Count Categories
                String cat = event.getCategory();
                if (cat != null) {
                    String matchedKey = null;
                    for (String key : categoryCounts.keySet()) {
                        if (key.equalsIgnoreCase(cat)) {
                            matchedKey = key;
                            break;
                        }
                    }
                    if (matchedKey != null) {
                        categoryCounts.put(matchedKey, categoryCounts.get(matchedKey) + 1);
                    }
                }
            }
        }

        // Resolve joined clubs
        List<Map<String, Object>> joinedClubs = new ArrayList<>();
        for (ClubMember cm : clubMemberships) {
            Optional<Club> clubOpt = allClubs.stream().filter(c -> c.getId() != null && c.getId().equals(cm.getClubId())).findFirst();
            if (clubOpt.isPresent()) {
                Club club = clubOpt.get();
                Map<String, Object> clubMap = new HashMap<>();
                clubMap.put("id", club.getId());
                clubMap.put("name", club.getName() != null ? club.getName() : "Unnamed Club");
                clubMap.put("category", club.getCategory() != null ? club.getCategory() : "Social");
                clubMap.put("joinedAt", cm.getJoinedAt());
                joinedClubs.add(clubMap);
            }
        }

        // Most Active Category
        String mostActiveCategory = "N/A";
        int maxCount = 0;
        for (Map.Entry<String, Integer> entry : categoryCounts.entrySet()) {
            if (entry.getValue() > maxCount) {
                maxCount = entry.getValue();
                mostActiveCategory = entry.getKey();
            }
        }

        // Compute Score
        int eventsJoinedCount = joinedEvents.size();
        int eventsAttendedCount = attendedEvents.size();
        int clubsJoinedCount = joinedClubs.size();
        int participationScore = Math.min(100, (eventsJoinedCount * 8) + (clubsJoinedCount * 12) + (eventsAttendedCount * 10));

        details.put("studentName", student.getName());
        details.put("studentEmail", student.getEmail());
        details.put("joinedEvents", joinedEvents);
        details.put("attendedEvents", attendedEvents);
        details.put("joinedClubs", joinedClubs);
        details.put("attendanceHistory", attendanceHistory);
        details.put("mostActiveCategory", mostActiveCategory);
        details.put("participationScore", participationScore);

        return ResponseEntity.ok(details);
    }
}
