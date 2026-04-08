package com.aura.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class User {
    private String id;
    private String name;
    private String email;
    @JsonIgnore
    private String password;
    private String photoURL;
    private String bio;
    private String createdAt;

    public User() {}

    public User(String id, String name, String email, String password) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.createdAt = java.time.Instant.now().toString();
    }

    public User toPublicView() {
        User u = new User();
        u.id = this.id;
        u.name = this.name;
        u.email = this.email;
        u.photoURL = this.photoURL;
        u.bio = this.bio;
        u.createdAt = this.createdAt;
        return u;
    }

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getPhotoURL() { return photoURL; }
    public void setPhotoURL(String photoURL) { this.photoURL = photoURL; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
