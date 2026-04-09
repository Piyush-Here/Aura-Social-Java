package com.aura.service;
import com.aura.model.User;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

@Service  // tells Spring: create ONE instance and share it everywhere
public class UserStore {
    private final Map<String, User> users = new HashMap<>();
    //               ^ key=userId        ^ value=User object

    public void save(User user) { users.put(user.getId(), user); }
    public User findById(String id) { return users.get(id); }
    public User findByEmail(String email) {
        return users.values().stream()
            .filter(u -> u.getEmail().equals(email))
            .findFirst().orElse(null);
    }
    public User all(){
        return (User) users;
    }
}
