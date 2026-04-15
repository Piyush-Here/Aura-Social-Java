package com.aura.controller;

import com.aura.dto.comment.CommentRequest;
import com.aura.dto.comment.CommentResponse;
import com.aura.service.CommentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public List<CommentResponse> list(@PathVariable Long postId) {
        return commentService.listByPost(postId);
    }

    @PostMapping
    public CommentResponse create(
        @PathVariable Long postId,
        @Valid @RequestBody CommentRequest request,
        Authentication authentication
    ) {
        return commentService.create(postId, authentication.getName(), request);
    }
}
