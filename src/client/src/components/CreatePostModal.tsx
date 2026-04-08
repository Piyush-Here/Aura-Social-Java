import React, { useState, useEffect } from 'react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (imageUrl: string, caption: string) => Promise<void>;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) { setImageUrl(''); setCaption(''); setError(''); }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) { setError('Image URL is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(imageUrl.trim(), caption.trim());
      onClose();
    } catch {
      setError('Failed to create post. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%',
        maxWidth: 480, overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '0.5px solid #ececec',
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              fontSize: 13, color: '#666', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <h3 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 16, fontWeight: 700, margin: 0,
          }}>
            New post
          </h3>
          <button
            onClick={handleSubmit}
            disabled={!imageUrl.trim() || submitting}
            style={{
              background: 'none', border: 'none',
              fontSize: 13, fontWeight: 600,
              color: !imageUrl.trim() || submitting ? '#aaa' : '#0095f6',
              cursor: !imageUrl.trim() || submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Sharing…' : 'Share'}
          </button>
        </div>

        {/* Image preview */}
        <div style={{
          background: '#f5f5f5', height: 280,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Preview"
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setError('Could not load this image URL')}
            />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🖼</div>
              <p style={{ fontSize: 12, color: '#aaa' }}>Image preview</p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            placeholder="Paste image URL…"
            value={imageUrl}
            onChange={e => { setImageUrl(e.target.value); setError(''); }}
            style={{
              width: '100%', padding: '10px 12px',
              border: '0.5px solid #ddd', borderRadius: 8,
              fontSize: 13, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <textarea
            placeholder="Write a caption…"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={3}
            style={{
              width: '100%', padding: '10px 12px',
              border: '0.5px solid #ddd', borderRadius: 8,
              fontSize: 13, resize: 'none', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.5,
            }}
          />
          {error && <p style={{ fontSize: 12, color: '#E24B4A', margin: 0 }}>{error}</p>}
        </form>
      </div>
    </div>
  );
};
