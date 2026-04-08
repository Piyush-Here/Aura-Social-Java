import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface Comment {
  id: string;
  authorUid: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export const CommentSection = ({ postId }: { postId: string }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch comments when panel opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/posts/${postId}/comments`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(setComments)
      .finally(() => setLoading(false));
  }, [open, postId]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const submit = async () => {
    if (!text.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, authorName: user.name }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [...prev, newComment]);
        setText('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    await fetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const formatTime = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: '#888', padding: 0, marginTop: 4,
        }}
      >
        {open ? 'Hide comments' : `View comments`}
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          {/* Comment list */}
          {loading ? (
            <p style={{ fontSize: 12, color: '#aaa' }}>Loading…</p>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: 12, color: '#bbb' }}>No comments yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#eee', flexShrink: 0,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 10, fontWeight: 600,
                  }}>
                    {c.authorName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.authorName} </span>
                    <span style={{ fontSize: 13 }}>{c.content}</span>
                    <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{formatTime(c.createdAt)}</span>
                      {user?.id === c.authorUid && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          style={{
                            background: 'none', border: 'none',
                            fontSize: 11, color: '#ccc', cursor: 'pointer', padding: 0,
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comment input */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '0.5px solid #f0f0f0', paddingTop: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: '#111', color: '#fff', flexShrink: 0,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 10, fontWeight: 600,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Add a comment…"
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: 13, background: 'transparent',
                fontFamily: 'inherit',
              }}
            />
            {text.trim() && (
              <button
                onClick={submit}
                disabled={submitting}
                style={{
                  background: 'none', border: 'none',
                  fontSize: 13, fontWeight: 600,
                  color: submitting ? '#aaa' : '#000', cursor: 'pointer',
                  padding: 0,
                }}
              >
                Post
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
