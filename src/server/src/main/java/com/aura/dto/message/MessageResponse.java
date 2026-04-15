package com.aura.dto.message;

import java.time.LocalDateTime;

public record MessageResponse(
    Long id,
    String senderUsername,
    String recipientUsername,
    String content,
    LocalDateTime createdAt
) {
}
