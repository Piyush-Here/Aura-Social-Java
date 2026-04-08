package com.aura.service;

import com.aura.model.User;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

/**
 * Shared in-memory user store — injected into both
 * AuthController and UserController so they share one map.
 * Replace with JPA + PostgreSQL for production.
 */
@Service
public class UserStore {
    private final Map<String, User> users = new HashMap<>();

    public void save(User user) { users.put(user.getId(), user); }
    public User findById(String id) { return users.get(id); }
    public Map<String, User> all() { return users; }

    public User findByEmail(String email) {
        return users.values().stream()
                .filter(u -> u.getEmail().equals(email))
                .findFirst().orElse(null);
    }
}
