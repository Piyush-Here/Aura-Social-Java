package com.aura.dto.auth;

import com.aura.dto.user.UserResponse;

public record AuthResponse(
    String token,
    UserResponse user
) {
}
