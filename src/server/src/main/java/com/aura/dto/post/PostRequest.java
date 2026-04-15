package com.aura.dto.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostRequest(
    @Size(max = 255, message = "Image URL must not exceed 255 characters")
    String imageUrl,
    @NotBlank(message = "Caption is required")
    @Size(max = 1000, message = "Caption must not exceed 1000 characters")
    String caption
) {
}
