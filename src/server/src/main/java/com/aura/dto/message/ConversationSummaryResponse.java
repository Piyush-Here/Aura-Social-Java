package com.aura.dto.message;

import java.time.LocalDateTime;

public record ConversationSummaryResponse(
    String username,
    String displayName,
    String photoUrl,
    String lastMessage,
    LocalDateTime lastMessageAt
) {
}
