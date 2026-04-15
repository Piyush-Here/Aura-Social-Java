package com.aura.service;

import com.aura.domain.Message;
import com.aura.domain.User;
import com.aura.dto.message.ConversationSummaryResponse;
import com.aura.dto.message.MessageRequest;
import com.aura.dto.message.MessageResponse;
import com.aura.repository.MessageRepository;
import com.aura.repository.UserRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageService(MessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public MessageResponse send(String senderUsername, MessageRequest request) {
        User sender = findUser(senderUsername);
        String recipientUsername = request.recipientUsername().trim().toLowerCase();
        User recipient = findUser(recipientUsername);

        if (sender.getUsername().equals(recipient.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot send a message to yourself");
        }

        Message message = new Message();
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setContent(request.content().trim());
        messageRepository.save(message);
        return toResponse(message);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> conversation(String currentUsername, String otherUsername) {
        findUser(otherUsername);
        return messageRepository.findConversation(currentUsername, otherUsername).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ConversationSummaryResponse> conversations(String username) {
        Map<String, ConversationSummaryResponse> latestByUser = new LinkedHashMap<>();
        for (Message message : messageRepository.findAllForUser(username)) {
            User partner = message.getSender().getUsername().equals(username) ? message.getRecipient() : message.getSender();
            latestByUser.putIfAbsent(partner.getUsername(), new ConversationSummaryResponse(
                partner.getUsername(),
                partner.getDisplayName(),
                partner.getPhotoUrl(),
                message.getContent(),
                message.getCreatedAt()
            ));
        }
        return latestByUser.values().stream().toList();
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private MessageResponse toResponse(Message message) {
        return new MessageResponse(
            message.getId(),
            message.getSender().getUsername(),
            message.getRecipient().getUsername(),
            message.getContent(),
            message.getCreatedAt()
        );
    }
}
