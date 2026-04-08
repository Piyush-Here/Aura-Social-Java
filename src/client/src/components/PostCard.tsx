import React from 'react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike }) => {
  return (
    <div className="post-card">
      <div className="post-header">
        {post.authorPhoto ? (
          <img src={post.authorPhoto} className="avatar" alt="" />
        ) : (
          <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee', fontSize: '10px' }}>
            {post.authorName[0]}
          </div>
        )}
        <span className="username">{post.authorName}</span>
      </div>
      
      <div className="post-image-container">
        <img 
          src={post.imageUrl} 
          alt="" 
          className="post-image"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="post-actions">
        <div className="action-btns">
          <button onClick={() => onLike(post.id)} className="nav-btn">Like</button>
          <button className="nav-btn">Comment</button>
          <button className="nav-btn">Share</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p className="likes-count">{post.likesCount} likes</p>
          <p className="caption">
            <span className="caption-username">{post.authorName}</span>
            {post.caption}
          </p>
        </div>
      </div>
    </div>
  );
};
