package com.aura.dto.comment;

import java.time.LocalDateTime;

public record CommentResponse(
    Long id,
    Long postId,
    String authorUsername,
    String authorDisplayName,
    String content,
    LocalDateTime createdAt
) {
}
