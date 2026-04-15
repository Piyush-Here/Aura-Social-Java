package com.aura.dto.user;

import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String username,
    String displayName,
    String bio,
    String photoUrl,
    LocalDateTime createdAt
) {
}
