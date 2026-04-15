package com.aura.service;

import com.aura.domain.Comment;
import com.aura.domain.Post;
import com.aura.domain.User;
import com.aura.dto.comment.CommentRequest;
import com.aura.dto.comment.CommentResponse;
import com.aura.repository.CommentRepository;
import com.aura.repository.PostRepository;
import com.aura.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository,
                          PostRepository postRepository,
                          UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listByPost(Long postId) {
        return commentRepository.findByPost_IdOrderByCreatedAtAsc(postId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public CommentResponse create(Long postId, String username, CommentRequest request) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        User author = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setAuthor(author);
        comment.setContent(request.content().trim());
        commentRepository.save(comment);

        post.setCommentsCount(post.getCommentsCount() + 1);
        postRepository.save(post);

        return toResponse(comment);
    }

    private CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
            comment.getId(),
            comment.getPost().getId(),
            comment.getAuthor().getUsername(),
            comment.getAuthor().getDisplayName(),
            comment.getContent(),
            comment.getCreatedAt()
        );
    }
}
