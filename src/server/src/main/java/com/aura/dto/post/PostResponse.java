package com.aura.dto.post;

import java.time.LocalDateTime;

public record PostResponse(
    Long id,
    String authorUsername,
    String authorDisplayName,
    String authorPhotoUrl,
    String imageUrl,
    String caption,
    int likesCount,
    int commentsCount,
    LocalDateTime createdAt
) {
}
