package com.aura.model;

public class Message {
    private String id;
    private String fromUid;
    private String toUid;
    private String content;
    private String createdAt;

    public Message() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFromUid() { return fromUid; }
    public void setFromUid(String fromUid) { this.fromUid = fromUid; }
    public String getToUid() { return toUid; }
    public void setToUid(String toUid) { this.toUid = toUid; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
