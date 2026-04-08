package com.aura.model;

public class Comment {
    private String id;
    private String postId;
    private String authorUid;
    private String authorName;
    private String content;
    private String createdAt;

    public Comment() {}

    public Comment(String id, String postId, String authorUid,
                   String authorName, String content, String createdAt) {
        this.id = id;
        this.postId = postId;
        this.authorUid = authorUid;
        this.authorName = authorName;
        this.content = content;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPostId() { return postId; }
    public void setPostId(String postId) { this.postId = postId; }
    public String getAuthorUid() { return authorUid; }
    public void setAuthorUid(String authorUid) { this.authorUid = authorUid; }
    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
