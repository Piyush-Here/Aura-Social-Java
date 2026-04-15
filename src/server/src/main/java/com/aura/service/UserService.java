package com.aura.service;

import com.aura.domain.User;
import com.aura.dto.user.UpdateProfileRequest;
import com.aura.dto.user.UserResponse;
import com.aura.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse profile(String username) {
        return toResponse(findByUsername(username));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> search(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        String normalized = query.trim();
        return userRepository.findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(normalized, normalized)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public UserResponse update(String username, UpdateProfileRequest request) {
        User user = findByUsername(username);
        if (request.displayName() != null && !request.displayName().isBlank()) {
            user.setDisplayName(request.displayName().trim());
        }
        if (request.bio() != null) {
            user.setBio(request.bio().isBlank() ? null : request.bio().trim());
        }
        if (request.photoUrl() != null) {
            user.setPhotoUrl(request.photoUrl().isBlank() ? null : request.photoUrl().trim());
        }
        userRepository.save(user);
        return toResponse(user);
    }

    private User findByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getDisplayName(),
            user.getBio(),
            user.getPhotoUrl(),
            user.getCreatedAt()
        );
    }
}
