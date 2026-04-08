package com.aura.controller;

import com.aura.model.Post;
import com.aura.service.UserStore;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.*;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final List<Post> posts = new CopyOnWriteArrayList<>();
    // postId -> set of userIds who liked it (prevents double-like)
    private final Map<String, Set<String>> likedBy = new HashMap<>();
    private final UserStore userStore;

    public PostController(UserStore userStore) {
        this.userStore = userStore;
    }

    /**
     * GET /api/posts
     * Optional query params:
     *   q         — Java regex matched against caption + authorName
     *   authorUid — filter posts by specific author
     */
    @GetMapping
    public List<Post> getPosts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String authorUid) {

        Pattern pattern = null;
        if (q != null && !q.isBlank()) {
            try {
                pattern = Pattern.compile(q, Pattern.CASE_INSENSITIVE);
            } catch (PatternSyntaxException e) {
                // Treat bad regex as literal substring search
                pattern = Pattern.compile(Pattern.quote(q), Pattern.CASE_INSENSITIVE);
            }
        }

        final Pattern finalPattern = pattern;
        return posts.stream()
            .filter(p -> authorUid == null || p.getAuthorUid().equals(authorUid))
            .filter(p -> {
                if (finalPattern == null) return true;
                return finalPattern.matcher(p.getCaption() != null ? p.getCaption() : "").find()
                    || finalPattern.matcher(p.getAuthorName() != null ? p.getAuthorName() : "").find();
            })
            .toList();
    }

    @GetMapping("/{id}")
    public Post getPost(@PathVariable String id) {
        return posts.stream()
            .filter(p -> p.getId().equals(id))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    @PostMapping
    public Post createPost(@RequestBody Post post, HttpSession session) {
        String uid = (String) session.getAttribute("userId");
        if (uid == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");

        // Populate author info from session user
        var user = userStore.findById(uid);
        if (user != null) {
            post.setAuthorUid(uid);
            post.setAuthorName(user.getName());
            post.setAuthorPhoto(user.getPhotoURL());
        }

        post.setId(UUID.randomUUID().toString());
        post.setCreatedAt(java.time.Instant.now().toString());
        post.setLikesCount(0);
        post.setCommentsCount(0);
        posts.add(0, post);
        return post;
    }

    /**
     * POST /api/posts/{id}/like
     * Toggles like — calling twice will unlike.
     */
    @PostMapping("/{id}/like")
    public Post toggleLike(@PathVariable String id, HttpSession session) {
        String uid = (String) session.getAttribute("userId");
        if (uid == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");

        return posts.stream()
            .filter(p -> p.getId().equals(id))
            .findFirst()
            .map(p -> {
                Set<String> likers = likedBy.computeIfAbsent(id, k -> new HashSet<>());
                if (likers.add(uid)) {
                    p.setLikesCount(p.getLikesCount() + 1);
                } else {
                    likers.remove(uid);
                    p.setLikesCount(Math.max(0, p.getLikesCount() - 1));
                }
                return p;
            })
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(@PathVariable String id, HttpSession session) {
        String uid = (String) session.getAttribute("userId");
        posts.removeIf(p -> p.getId().equals(id) && p.getAuthorUid().equals(uid));
    }

    // Called by CommentController to bump commentsCount
    public void incrementCommentCount(String postId) {
        posts.stream().filter(p -> p.getId().equals(postId))
             .findFirst()
             .ifPresent(p -> p.setCommentsCount(p.getCommentsCount() + 1));
    }
}
