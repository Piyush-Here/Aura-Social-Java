package com.aura.controller;

import com.aura.model.User;
import com.aura.service.UserStore;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserStore userStore;

    public UserController(UserStore userStore) {
        this.userStore = userStore;
    }

    /**
     * GET /api/users/{uid}
     * Public profile view — strips password via toPublicView().
     */
    @GetMapping("/{uid}")
    public User getProfile(@PathVariable String uid) {
        User user = userStore.findById(uid);
        if (user == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        return user.toPublicView();
    }

    /**
     * PATCH /api/users/{uid}/bio
     * Update bio — only the logged-in user can update their own bio.
     */
    @PatchMapping("/{uid}/bio")
    public User updateBio(@PathVariable String uid,
                          @RequestBody Map<String, String> body,
                          HttpSession session) {
        String sessionUid = (String) session.getAttribute("userId");
        if (sessionUid == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        if (!sessionUid.equals(uid))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot edit another user's profile");

        User user = userStore.findById(uid);
        if (user == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");

        user.setBio(body.get("bio"));
        return user.toPublicView();
    }

    /**
     * PATCH /api/users/{uid}/photo
     * Update profile photo URL.
     */
    @PatchMapping("/{uid}/photo")
    public User updatePhoto(@PathVariable String uid,
                            @RequestBody Map<String, String> body,
                            HttpSession session) {
        String sessionUid = (String) session.getAttribute("userId");
        if (sessionUid == null || !sessionUid.equals(uid))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");

        User user = userStore.findById(uid);
        if (user == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");

        user.setPhotoURL(body.get("photoURL"));
        return user.toPublicView();
    }

    /**
     * GET /api/users/search?q=regex
     * Regex-based user search by name or email.
     */
    @GetMapping("/search")
    public java.util.List<User> searchUsers(@RequestParam String q) {
        if (q == null || q.isBlank()) return java.util.List.of();

        java.util.regex.Pattern pattern;
        try {
            pattern = java.util.regex.Pattern.compile(q, java.util.regex.Pattern.CASE_INSENSITIVE);
        } catch (java.util.regex.PatternSyntaxException e) {
            pattern = java.util.regex.Pattern.compile(
                java.util.regex.Pattern.quote(q),
                java.util.regex.Pattern.CASE_INSENSITIVE
            );
        }

        final java.util.regex.Pattern p = pattern;
        return userStore.all().values().stream()
            .filter(u -> p.matcher(u.getName()).find() || p.matcher(u.getEmail()).find())
            .map(User::toPublicView)
            .toList();
    }
}
