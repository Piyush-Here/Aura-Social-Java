package com.aura.controller;

import com.aura.model.Message;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    // userId -> their active SSE emitter
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    // All messages (in-memory) — replace with DB for persistence
    private final List<Message> history = new CopyOnWriteArrayList<>();

    /**
     * GET /api/messages/stream/{userId}
     * Client calls this once on mount to open SSE connection.
     * Spring holds the HTTP response open and pushes messages as they arrive.
     */
    @GetMapping(value = "/stream/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable String userId, HttpSession session) {
        String sessionUid = (String) session.getAttribute("userId");
        if (sessionUid == null || !sessionUid.equals(userId))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");

        SseEmitter emitter = new SseEmitter(0L); // 0 = never timeout

        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId, emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            emitters.remove(userId, emitter);
        });
        emitter.onError(e -> {
            emitter.completeWithError(e);
            emitters.remove(userId, emitter);
        });

        // Send a keep-alive comment immediately so the browser doesn't close
        try {
            emitter.send(SseEmitter.event().comment("connected"));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }

        return emitter;
    }

    /**
     * POST /api/messages
     * Send a direct message. Pushes to recipient's SSE stream instantly.
     */
    @PostMapping
    public Message send(@RequestBody Message msg, HttpSession session) {
        String uid = (String) session.getAttribute("userId");
        if (uid == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        if (msg.getContent() == null || msg.getContent().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content required");

        msg.setId(UUID.randomUUID().toString());
        msg.setFromUid(uid);
        msg.setCreatedAt(java.time.Instant.now().toString());
        history.add(msg);

        // Push to recipient's open SSE connection (if they're online)
        SseEmitter recipientEmitter = emitters.get(msg.getToUid());
        if (recipientEmitter != null) {
            try {
                recipientEmitter.send(
                    SseEmitter.event()
                        .name("message")
                        .data(msg)
                );
            } catch (IOException e) {
                // Recipient disconnected — clean up
                recipientEmitter.completeWithError(e);
                emitters.remove(msg.getToUid(), recipientEmitter);
            }
        }

        return msg;
    }

    /**
     * GET /api/messages/{userId}/{otherId}
     * Fetch full conversation history between two users.
     */
    @GetMapping("/{userId}/{otherId}")
    public List<Message> conversation(
            @PathVariable String userId,
            @PathVariable String otherId,
            HttpSession session) {
        String uid = (String) session.getAttribute("userId");
        if (uid == null || !uid.equals(userId))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");

        return history.stream()
            .filter(m ->
                (m.getFromUid().equals(userId) && m.getToUid().equals(otherId)) ||
                (m.getFromUid().equals(otherId) && m.getToUid().equals(userId))
            )
            .sorted(Comparator.comparing(Message::getCreatedAt))
            .toList();
    }

    /**
     * GET /api/messages/inbox/{userId}
     * Returns the most recent message per unique conversation partner.
     */
    @GetMapping("/inbox/{userId}")
    public List<Message> inbox(@PathVariable String userId, HttpSession session) {
        String uid = (String) session.getAttribute("userId");
        if (uid == null || !uid.equals(userId))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");

        // Get all messages involving this user, grouped by conversation partner
        Map<String, Message> latestPerPartner = new LinkedHashMap<>();
        history.stream()
            .filter(m -> m.getFromUid().equals(userId) || m.getToUid().equals(userId))
            .sorted(Comparator.comparing(Message::getCreatedAt).reversed())
            .forEach(m -> {
                String partner = m.getFromUid().equals(userId) ? m.getToUid() : m.getFromUid();
                latestPerPartner.putIfAbsent(partner, m);
            });

        return new ArrayList<>(latestPerPartner.values());
    }
}
