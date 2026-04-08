package com.aura.model;

import java.time.Instant;

public class Post {
    private String id;
    private String authorUid;
    private String authorName;
    private String authorPhoto;
    private String imageUrl;
    private String caption;
    private int likesCount;
    private int commentsCount;
    private String createdAt;

    // Constructors
    public Post() {}

    public Post(String id, String authorName, String imageUrl, String caption) {
        this.id = id;
        this.authorName = authorName;
        this.imageUrl = imageUrl;
        this.caption = caption;
        this.createdAt = Instant.now().toString();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAuthorUid() { return authorUid; }
    public void setAuthorUid(String authorUid) { this.authorUid = authorUid; }
    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    public String getAuthorPhoto() { return authorPhoto; }
    public void setAuthorPhoto(String authorPhoto) { this.authorPhoto = authorPhoto; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public int getLikesCount() { return likesCount; }
    public void setLikesCount(int likesCount) { this.likesCount = likesCount; }
    public int getCommentsCount() { return commentsCount; }
    public void setCommentsCount(int commentsCount) { this.commentsCount = commentsCount; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
