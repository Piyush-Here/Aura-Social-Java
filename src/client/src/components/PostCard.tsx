import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Post } from '../types';
import { CommentSection } from './CommentSection';
import { useAuth } from './AuthContext';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likesCount);

  const handleLike = () => {
    onLike(post.id);
    setLiked(l => !l);
    setLocalLikes(n => liked ? n - 1 : n + 1);
  };

  const formatTime = (iso: string | number) => {
    const d = typeof iso === 'number' ? new Date(iso) : new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const buttonBase: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, padding: 0, fontFamily: 'inherit',
  };

  return (
    <article style={{
      background: '#fff',
      border: '0.5px solid #ececec',
      borderRadius: 12,
      marginBottom: 24,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
      }}>
        <Link
          to={`/profile/${post.authorUid}`}
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}
        >
          {post.authorPhoto ? (
            <img
              src={post.authorPhoto} alt=""
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#111', color: '#fff', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {post.authorName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{post.authorName}</p>
          </div>
        </Link>
        <span style={{ fontSize: 11, color: '#aaa' }}>{formatTime(post.createdAt)}</span>
      </div>

      {/* Image */}
      <div style={{ position: 'relative', background: '#f5f5f5', lineHeight: 0 }}>
        <img
          src={post.imageUrl}
          alt={post.caption}
          referrerPolicy="no-referrer"
          style={{ width: '100%', maxHeight: 520, objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          <button
            onClick={handleLike}
            style={{ ...buttonBase, color: liked ? '#E24B4A' : '#000', fontSize: 20, lineHeight: 1 }}
            title="Like"
          >
            {liked ? '♥' : '♡'}
          </button>
          <button
            onClick={() => {/* scroll to comment input */}}
            style={{ ...buttonBase, fontSize: 16 }}
            title="Comment"
          >
            💬
          </button>
          <button
            onClick={() => {
              if (post.authorUid && post.authorUid !== user?.id)
                navigate(`/messages/${post.authorUid}`);
            }}
            style={{ ...buttonBase, fontSize: 16 }}
            title="Message"
          >
            ✉
          </button>
        </div>

        <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 6px' }}>
          {localLikes.toLocaleString()} {localLikes === 1 ? 'like' : 'likes'}
        </p>

        {post.caption && (
          <p style={{ fontSize: 13, margin: '0 0 8px', lineHeight: 1.5 }}>
            <Link
              to={`/profile/${post.authorUid}`}
              style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit', marginRight: 4 }}
            >
              {post.authorName}
            </Link>
            {post.caption}
          </p>
        )}

        <CommentSection postId={post.id} />
      </div>
    </article>
  );
};
