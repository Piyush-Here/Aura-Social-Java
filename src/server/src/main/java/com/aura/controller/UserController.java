package com.aura.controller;

import com.aura.dto.user.UpdateProfileRequest;
import com.aura.dto.user.UserResponse;
import com.aura.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/search")
    public List<UserResponse> search(@RequestParam String q) {
        return userService.search(q);
    }

    @GetMapping("/{username}")
    public UserResponse profile(@PathVariable String username) {
        return userService.profile(username);
    }

    @PatchMapping("/me")
    public UserResponse update(@Valid @RequestBody UpdateProfileRequest request, Authentication authentication) {
        return userService.update(authentication.getName(), request);
    }
}
