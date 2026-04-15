package com.aura.service;

import com.aura.domain.Post;
import com.aura.domain.PostLike;
import com.aura.domain.User;
import com.aura.dto.post.PostRequest;
import com.aura.dto.post.PostResponse;
import com.aura.repository.PostLikeRepository;
import com.aura.repository.PostRepository;
import com.aura.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;

    public PostService(PostRepository postRepository,
                       PostLikeRepository postLikeRepository,
                       UserRepository userRepository) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PostResponse> list(String query, String username) {
        String normalizedQuery = (query == null || query.isBlank()) ? null : query.trim();
        String normalizedUsername = (username == null || username.isBlank()) ? null : username.trim();
        return postRepository.search(normalizedQuery, normalizedUsername).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public PostResponse get(Long postId) {
        return toResponse(postRepository.findById(postId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found")));
    }

    @Transactional
    public PostResponse create(String username, PostRequest request) {
        User author = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Post post = new Post();
        post.setAuthor(author);
        post.setImageUrl(blankToNull(request.imageUrl()));
        post.setCaption(request.caption().trim());
        postRepository.save(post);
        return toResponse(post);
    }

    @Transactional
    public PostResponse toggleLike(Long postId, String username) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        postLikeRepository.findByPost_IdAndUser_Id(postId, user.getId()).ifPresentOrElse(existingLike -> {
            postLikeRepository.delete(existingLike);
            post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
        }, () -> {
            PostLike postLike = new PostLike();
            postLike.setPost(post);
            postLike.setUser(user);
            postLikeRepository.save(postLike);
            post.setLikesCount(post.getLikesCount() + 1);
        });

        postRepository.save(post);
        return toResponse(post);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private PostResponse toResponse(Post post) {
        return new PostResponse(
            post.getId(),
            post.getAuthor().getUsername(),
            post.getAuthor().getDisplayName(),
            post.getAuthor().getPhotoUrl(),
            post.getImageUrl(),
            post.getCaption(),
            post.getLikesCount(),
            post.getCommentsCount(),
            post.getCreatedAt()
        );
    }
}
