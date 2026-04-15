package com.aura.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AuthRequest(
    @NotBlank(message = "Username is required")
    @Pattern(
        regexp = "^[a-z0-9_.-]+$",
        message = "Username can only contain lowercase letters, numbers, dot, underscore, and hyphen"
    )
    String username,
    @NotBlank(message = "Password is required")
    String password
) {
}
