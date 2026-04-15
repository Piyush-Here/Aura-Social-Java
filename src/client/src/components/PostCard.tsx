import { Link } from 'react-router-dom';
import type { Post } from '../types';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: Post;
  onLike: (postId: number) => Promise<void>;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function PostCard({ post, onLike }: PostCardProps) {
  return (
    <article className="card post-card">
      <div className="post-header">
        <div>
          <Link className="post-author" to={`/profile/${post.authorUsername}`}>
            {post.authorDisplayName}
          </Link>
          <p className="muted-text">@{post.authorUsername}</p>
        </div>
        <time className="muted-text">{formatTime(post.createdAt)}</time>
      </div>

      {post.imageUrl && (
        <img
          alt={post.caption}
          className="post-image"
          referrerPolicy="no-referrer"
          src={post.imageUrl}
        />
      )}

      <p className="post-caption">{post.caption}</p>

      <div className="post-actions">
        <button className="button subtle" onClick={() => void onLike(post.id)} type="button">
          Like ({post.likesCount})
        </button>
        <span className="muted-text">{post.commentsCount} comments</span>
      </div>

      <CommentSection postId={post.id} />
    </article>
  );
}
