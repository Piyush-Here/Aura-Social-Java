import { useEffect, useState, type FormEvent } from 'react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (imageUrl: string | null, caption: string) => Promise<void>;
}

export function CreatePostModal({ isOpen, onClose, onSubmit }: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setCaption('');
    setImageUrl('');
    setError('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCaption = caption.trim();
    if (!normalizedCaption) {
      setError('Caption is required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit(imageUrl.trim() || null, normalizedCaption);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2>Create post</h2>
          <button className="button ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <form className="stack-md" onSubmit={handleSubmit}>
          <label className="field">
            <span>Image URL</span>
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="Optional image URL"
            />
          </label>

          <label className="field">
            <span>Caption</span>
            <textarea
              rows={4}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Write something worth posting."
            />
          </label>

          {error && <div className="form-banner error">{error}</div>}

          <div className="row-end">
            <button className="button primary" disabled={submitting} type="submit">
              {submitting ? 'Posting...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
