import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import type { Comment } from '../types';

interface CommentSectionProps {
  postId: number;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!expanded) {
      return;
    }

    setLoading(true);
    setError('');

    apiRequest<Comment[]>(`/posts/${postId}/comments`)
      .then(setComments)
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : 'Unable to load comments.');
      })
      .finally(() => setLoading(false));
  }, [expanded, postId]);

  const submit = async () => {
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      setError('Comment cannot be empty.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const created = await apiRequest<Comment>(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: normalizedContent }),
      });
      setComments((current) => [...current, created]);
      setContent('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add comment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="comment-section">
      <button
        className="text-button"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        {expanded ? 'Hide comments' : 'View comments'}
      </button>

      {expanded && (
        <div className="stack-sm">
          {loading && <p className="muted-text">Loading comments...</p>}
          {!loading && comments.length === 0 && <p className="muted-text">No comments yet.</p>}

          {comments.map((comment) => (
            <article className="comment-item" key={comment.id}>
              <div>
                <strong>{comment.authorDisplayName}</strong>
                <p>{comment.content}</p>
              </div>
              <time>{formatTime(comment.createdAt)}</time>
            </article>
          ))}

          <div className="comment-compose">
            <input
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
              placeholder="Write a comment"
            />
            <button className="button subtle" disabled={submitting} onClick={() => void submit()} type="button">
              Post
            </button>
          </div>

          {error && <div className="form-banner error">{error}</div>}
        </div>
      )}
    </section>
  );
}
