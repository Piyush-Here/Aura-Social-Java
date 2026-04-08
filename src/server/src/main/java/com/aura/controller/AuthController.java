package com.aura.controller;

import com.aura.model.User;
import com.aura.service.UserStore;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserStore userStore;

    public AuthController(UserStore userStore) {
        this.userStore = userStore;
    }

    @PostMapping("/signup")
    public User signup(@RequestBody Map<String, String> body,
                       HttpSession session) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email required");
        if (userStore.findByEmail(email) != null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already taken");

        User user = new User(
            UUID.randomUUID().toString(),
            body.get("name"),
            email,
            body.get("password")  // TODO: hash with BCrypt in production
        );
        userStore.save(user);
        session.setAttribute("userId", user.getId());
        return user.toPublicView();
    }

    @PostMapping("/login")
    public User login(@RequestBody Map<String, String> body,
                      HttpSession session) {
        User user = userStore.findByEmail(body.get("email"));
        if (user == null || !user.getPassword().equals(body.get("password")))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");

        session.setAttribute("userId", user.getId());
        return user.toPublicView();
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpSession session) {
        session.invalidate();
    }

    @GetMapping("/me")
    public User me(HttpSession session) {
        String uid = (String) session.getAttribute("userId");
        if (uid == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        User user = userStore.findById(uid);
        if (user == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired");
        return user.toPublicView();
    }
}
