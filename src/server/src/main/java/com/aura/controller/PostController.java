package com.aura.controller;

import com.aura.model.Post;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/posts")
public class PostController {
    
    private List<Post> posts = new ArrayList<>();

    @GetMapping
    public List<Post> getPosts() {
        return posts;
    }

    @PostMapping
    public Post createPost(@RequestBody Post post) {
        post.setId(UUID.randomUUID().toString());
        post.setCreatedAt(java.time.Instant.now().toString());
        posts.add(0, post);
        return post;
    }

    @PostMapping("/{id}/like")
    public void likePost(@PathVariable String id) {
        posts.stream()
            .filter(p -> p.getId().equals(id))
            .findFirst()
            .ifPresent(p -> p.setLikesCount(p.getLikesCount() + 1));
    }
}
