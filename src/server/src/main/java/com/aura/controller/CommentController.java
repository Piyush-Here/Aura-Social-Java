package com.aura.controller;

import com.aura.model.Comment;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
public class CommentController {

    // postId -> ordered list of comments
    private final Map<String, List<Comment>> store = new HashMap<>();
    private final PostController postController;

    public CommentController(PostController postController) {
        this.postController = postController;
    }

    @GetMapping
    public List<Comment> list(@PathVariable String postId) {
        return store.getOrDefault(postId, List.of());
    }

    @PostMapping
    public Comment create(@PathVariable String postId,
                          @RequestBody Map<String, String> body,
                          HttpSession session) {
        String uid = (String) session.getAttribute("userId");
        if (uid == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        if (body.get("content") == null || body.get("content").isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content required");

        Comment c = new Comment(
            UUID.randomUUID().toString(),
            postId,
            uid,
            body.get("authorName"),
            body.get("content"),
            java.time.Instant.now().toString()
        );

        store.computeIfAbsent(postId, k -> new CopyOnWriteArrayList<>()).add(c);
        postController.incrementCommentCount(postId);
        return c;
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String postId,
                       @PathVariable String commentId,
                       HttpSession session) {
        String uid = (String) session.getAttribute("userId");
        List<Comment> comments = store.get(postId);
        if (comments != null)
            comments.removeIf(c -> c.getId().equals(commentId)
                                && c.getAuthorUid().equals(uid));
    }
}
