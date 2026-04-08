import React, { useState } from 'react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (imageUrl: string, caption: string) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    onSubmit(imageUrl, caption);
    setImageUrl('');
    setCaption('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="modal-close">Close</button>
        
        <h2 className="modal-title serif">New Story</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="preview-box">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="preview-img"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>
                Preview
              </div>
            )}
          </div>
          
          <div className="form-group">
            <input 
              type="text"
              placeholder="Image URL" 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="input-field"
              required
            />
            <textarea 
              placeholder="Caption" 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input-field"
              style={{ minHeight: '80px', resize: 'none' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="primary-btn"
            disabled={!imageUrl}
            style={{ opacity: !imageUrl ? 0.3 : 1 }}
          >
            Share
          </button>
        </form>
      </div>
    </div>
  );
};
