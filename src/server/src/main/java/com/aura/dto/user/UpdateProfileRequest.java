package com.aura.dto.user;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(max = 120, message = "Display name must not exceed 120 characters")
    String displayName,
    @Size(max = 500, message = "Bio must not exceed 500 characters")
    String bio,
    @Size(max = 255, message = "Photo URL must not exceed 255 characters")
    String photoUrl
) {
}
