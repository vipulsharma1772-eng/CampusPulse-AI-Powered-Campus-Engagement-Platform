package com.campusai.controller;

import com.campusai.model.Club;
import com.campusai.model.ClubMember;
import com.campusai.model.Event;
import com.campusai.repository.ClubRepository;
import com.campusai.repository.ClubMemberRepository;
import com.campusai.repository.EventRepository;
import com.campusai.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}, maxAge = 3600)
@RestController
@RequestMapping("/api/clubs")
public class ClubController {

    @Autowired
    ClubRepository clubRepository;

    @Autowired
    ClubMemberRepository clubMemberRepository;

    @Autowired
    com.campusai.repository.UserRepository userRepository;

    @Autowired
    com.campusai.repository.ClubPostRepository clubPostRepository;

    @Autowired
    EventRepository eventRepository;

    @GetMapping
    public ResponseEntity<?> getAllClubs(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<Club> clubs = clubRepository.findAll();
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        
        // Find all club IDs the user is a member of
        List<Long> myClubIds = new java.util.ArrayList<>();
        if (userDetails != null) {
            List<ClubMember> myMemberships = clubMemberRepository.findByUserId(userDetails.getId());
            for (ClubMember cm : myMemberships) {
                myClubIds.add(cm.getClubId());
            }
        }

        for (Club club : clubs) {
            boolean isPublished = "PUBLISHED".equalsIgnoreCase(club.getStatus()) || club.getStatus() == null;
            boolean isCreator = userDetails != null && userDetails.getId().equals(club.getCreatedBy());
            if (!isPublished && !isCreator) {
                continue;
            }

            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", club.getId());
            map.put("name", club.getName());
            map.put("description", club.getDescription());
            map.put("category", club.getCategory());
            map.put("imageUrl", club.getImageUrl());
            map.put("tags", club.getTags());
            map.put("venue", club.getVenue());
            map.put("startDate", club.getStartDate());
            map.put("timing", club.getTiming());
            map.put("maxMembers", club.getMaxMembers());
            map.put("contactEmail", club.getContactEmail());
            map.put("clubHeadName", club.getClubHeadName());
            long realMembers = clubMemberRepository.findByClubId(club.getId()).stream()
                    .filter(m -> !m.getUserId().equals(club.getCreatedBy()))
                    .count();
            map.put("memberCount", realMembers);
            map.put("isMember", myClubIds.contains(club.getId()));
            map.put("createdBy", club.getCreatedBy());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyClubs(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<ClubMember> memberships = clubMemberRepository.findByUserId(userDetails.getId());
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (ClubMember membership : memberships) {
            Optional<Club> clubOpt = clubRepository.findById(membership.getClubId());
            if (clubOpt.isPresent()) {
                Club club = clubOpt.get();
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", club.getId());
                map.put("name", club.getName());
                map.put("description", club.getDescription());
                map.put("category", club.getCategory());
                map.put("imageUrl", club.getImageUrl());
                map.put("tags", club.getTags());
                map.put("venue", club.getVenue());
                map.put("startDate", club.getStartDate());
                map.put("timing", club.getTiming());
                map.put("maxMembers", club.getMaxMembers());
                map.put("contactEmail", club.getContactEmail());
                map.put("clubHeadName", club.getClubHeadName());
                result.add(map);
            }
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Club> createClub(@RequestBody Club club, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        club.setCreatedBy(userDetails.getId());
        Club savedClub = clubRepository.save(club);
        
        // Add creator as Admin
        ClubMember member = ClubMember.builder()
                .userId(userDetails.getId())
                .clubId(savedClub.getId())
                .joinedAt(LocalDateTime.now())
                .build();
        clubMemberRepository.save(member);
        
        return ResponseEntity.ok(savedClub);
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinClub(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Optional<Club> club = clubRepository.findById(id);
        if (!club.isPresent()) {
            return ResponseEntity.badRequest().body("Club not found");
        }

        Club c = club.get();
        boolean isPublished = "PUBLISHED".equalsIgnoreCase(c.getStatus()) || c.getStatus() == null;
        boolean isAdmin = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isCreator = userDetails != null && userDetails.getId().equals(c.getCreatedBy());

        if (!isPublished && !isAdmin && !isCreator) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body("Forbidden: Cannot join a club that is not published.");
        }

        if (clubMemberRepository.findByUserIdAndClubId(userDetails.getId(), id).isPresent()) {
            return ResponseEntity.badRequest().body("Already a member of this club");
        }

        ClubMember member = ClubMember.builder()
                .userId(userDetails.getId())
                .clubId(id)
                .joinedAt(LocalDateTime.now())
                .build();
        
        clubMemberRepository.save(member);
        return ResponseEntity.ok("Successfully joined club: " + club.get().getName());
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveClub(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Optional<ClubMember> member = clubMemberRepository.findByUserIdAndClubId(userDetails.getId(), id);
        if (member.isPresent()) {
            clubMemberRepository.delete(member.get());
            return ResponseEntity.ok("Successfully left the club");
        }
        return ResponseEntity.badRequest().body("Not a member");
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClubDetails(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Optional<Club> clubOpt = clubRepository.findById(id);
        if (clubOpt.isEmpty()) return ResponseEntity.notFound().build();
        
        Club club = clubOpt.get();
        boolean isPublished = "PUBLISHED".equalsIgnoreCase(club.getStatus()) || club.getStatus() == null;
        boolean isAdmin = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isCreator = userDetails != null && userDetails.getId().equals(club.getCreatedBy());

        if (!isPublished && !isAdmin && !isCreator) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body("Forbidden: Club is not published.");
        }
        List<ClubMember> members = clubMemberRepository.findByClubId(id);
        long realMembers = members.stream()
                .filter(m -> !m.getUserId().equals(club.getCreatedBy()))
                .count();
        boolean isMember = members.stream().anyMatch(m -> m.getUserId().equals(userDetails.getId()));
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("club", club);
        response.put("memberCount", realMembers);
        response.put("isMember", isMember);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<?> getClubPosts(@PathVariable Long id) {
        return ResponseEntity.ok(clubPostRepository.findByClubIdOrderByCreatedAtDesc(id));
    }

    @PostMapping("/{id}/posts")
    public ResponseEntity<?> createPost(@PathVariable Long id, @RequestBody com.campusai.model.ClubPost post, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (clubMemberRepository.findByUserIdAndClubId(userDetails.getId(), id).isEmpty()) {
            return ResponseEntity.badRequest().body("Must be a member to post");
        }
        
        com.campusai.model.User user = userRepository.findById(userDetails.getId()).orElse(null);
        post.setClubId(id);
        post.setAuthorId(userDetails.getId());
        post.setAuthorName(user != null ? user.getName() : "Unknown Student");
        
        return ResponseEntity.ok(clubPostRepository.save(post));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClub(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            System.err.println("DELETE CLUB: userDetails is null!");
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<Club> clubOpt = clubRepository.findById(id);
        if (!clubOpt.isPresent()) {
            System.err.println("DELETE CLUB: Club with ID " + id + " not found!");
            return ResponseEntity.badRequest().body("Club not found");
        }
        
        Club club = clubOpt.get();
        
        System.out.println("DELETE CLUB LOGS:");
        System.out.println("Club ID: " + id);
        System.out.println("Club createdBy: " + club.getCreatedBy());
        System.out.println("Logged in user ID: " + userDetails.getId());
        
        // Check permission: creator or admin
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isCreator = club.getCreatedBy() != null && club.getCreatedBy().equals(userDetails.getId());
        
        System.out.println("Is Admin: " + isAdmin);
        System.out.println("Is Creator: " + isCreator);

        if (!isAdmin && !isCreator) {
            System.err.println("DELETE CLUB: Unauthorized! Logged in user: " + userDetails.getId() + " is not creator: " + club.getCreatedBy() + " or Admin!");
            return ResponseEntity.status(403).body("Unauthorized to delete this club. Only the creator can delete it.");
        }
        
        // Delete all members of this club
        List<ClubMember> members = clubMemberRepository.findByClubId(id);
        System.out.println("Deleting members count: " + members.size());
        clubMemberRepository.deleteAll(members);
        
        // Delete all posts of this club
        List<com.campusai.model.ClubPost> posts = clubPostRepository.findByClubIdOrderByCreatedAtDesc(id);
        System.out.println("Deleting posts count: " + posts.size());
        clubPostRepository.deleteAll(posts);
        
        // Dissociate events related to this club (set clubId to null)
        try {
            List<Event> associatedEvents = eventRepository.findAll().stream()
                    .filter(e -> id.equals(e.getClubId()))
                    .collect(Collectors.toList());
            System.out.println("Dissociating associated events count: " + associatedEvents.size());
            for (Event event : associatedEvents) {
                event.setClubId(null);
                eventRepository.save(event);
            }
        } catch (Exception e) {
            System.err.println("Error cleaning up associated club events: " + e.getMessage());
        }
        
        // Finally delete the club
        clubRepository.delete(club);
        System.out.println("Club deleted successfully from repository.");
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("message", "Club deleted successfully.");
        return ResponseEntity.ok(response);
    }
}
