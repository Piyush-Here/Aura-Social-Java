package com.aura.controller;

import com.aura.dto.post.PostRequest;
import com.aura.dto.post.PostResponse;
import com.aura.service.PostService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public List<PostResponse> list(@RequestParam(required = false) String q,
                                   @RequestParam(required = false) String username) {
        return postService.list(q, username);
    }

    @GetMapping("/{postId}")
    public PostResponse get(@PathVariable Long postId) {
        return postService.get(postId);
    }

    @PostMapping
    public PostResponse create(@Valid @RequestBody PostRequest request, Authentication authentication) {
        return postService.create(authentication.getName(), request);
    }

    @PostMapping("/{postId}/like")
    public PostResponse toggleLike(@PathVariable Long postId, Authentication authentication) {
        return postService.toggleLike(postId, authentication.getName());
    }
}
