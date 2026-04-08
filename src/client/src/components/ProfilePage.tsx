import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  bio?: string;
  createdAt: string;
}

export const ProfilePage = () => {
  const { uid } = useParams<{ uid: string }>();
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const isOwner = currentUser?.id === uid;

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError('');

    Promise.all([
      fetch(`/api/users/${uid}`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch(`/api/posts?authorUid=${uid}`, { credentials: 'include' }).then(r => r.ok ? r.json() : []),
    ])
      .then(([profileData, postsData]) => {
        if (!profileData) { setError('User not found'); return; }
        setProfile(profileData);
        setBio(profileData.bio || '');
        setPhotoURL(profileData.photoURL || '');
        setPosts(postsData);
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [uid]);

  const saveBio = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${uid}/bio`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setEditingBio(false);
        refreshUser();
      }
    } finally {
      setSaving(false);
    }
  };

  const savePhoto = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${uid}/photo`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoURL }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setEditingPhoto(false);
        refreshUser();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#bbb', fontSize: 13 }}>
      Loading profile…
    </div>
  );

  if (error || !profile) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ color: '#E24B4A', fontSize: 14 }}>{error || 'User not found'}</p>
      <button onClick={() => navigate(-1)}
        style={{ marginTop: 16, background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13 }}>
        ← Go back
      </button>
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    border: '0.5px solid #ddd', borderRadius: 8,
    fontSize: 13, outline: 'none', fontFamily: 'inherit',
  };

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px' }}>
      {/* Profile header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 32,
        marginBottom: 40, paddingBottom: 32,
        borderBottom: '0.5px solid #ececec',
      }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          {profile.photoURL ? (
            <img src={profile.photoURL} alt={profile.name}
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#111', color: '#fff',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 28, fontWeight: 600,
            }}>
              {profile.name[0]?.toUpperCase()}
            </div>
          )}
          {isOwner && (
            <button onClick={() => setEditingPhoto(p => !p)}
              style={{
                marginTop: 6, width: '100%', background: 'none',
                border: '0.5px solid #ddd', borderRadius: 6,
                fontSize: 11, padding: '4px 0', cursor: 'pointer', color: '#666',
              }}>
              Edit photo
            </button>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{profile.name}</h2>
            {!isOwner && (
              <button
                onClick={() => navigate(`/messages/${profile.id}`)}
                style={{
                  padding: '6px 16px', background: '#000', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 12,
                  fontWeight: 500, cursor: 'pointer',
                }}
              >
                Message
              </button>
            )}
          </div>

          <p style={{ fontSize: 13, color: '#888', margin: '0 0 12px' }}>
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </p>

          {/* Bio */}
          {editingBio ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="Write a bio…"
                style={{ ...inputStyle, resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveBio} disabled={saving}
                  style={{
                    padding: '6px 14px', background: '#000', color: '#fff',
                    border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditingBio(false); setBio(profile.bio || ''); }}
                  style={{
                    padding: '6px 14px', background: 'none',
                    border: '0.5px solid #ddd', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: bio ? '#111' : '#bbb' }}>
                {bio || (isOwner ? 'Add a bio…' : '')}
              </p>
              {isOwner && (
                <button onClick={() => setEditingBio(true)}
                  style={{
                    marginTop: 8, background: 'none', border: 'none',
                    fontSize: 12, color: '#888', cursor: 'pointer', padding: 0,
                  }}>
                  {bio ? 'Edit bio' : '+ Add bio'}
                </button>
              )}
            </div>
          )}

          {/* Photo URL editor */}
          {editingPhoto && isOwner && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                value={photoURL}
                onChange={e => setPhotoURL(e.target.value)}
                placeholder="Photo URL…"
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={savePhoto} disabled={saving}
                  style={{
                    padding: '6px 14px', background: '#000', color: '#fff',
                    border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  }}>
                  {saving ? 'Saving…' : 'Save photo'}
                </button>
                <button onClick={() => setEditingPhoto(false)}
                  style={{
                    padding: '6px 14px', background: 'none',
                    border: '0.5px solid #ddd', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post grid */}
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#bbb', fontSize: 14 }}>
            {isOwner ? 'You haven't posted yet.' : 'No posts yet.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 3,
        }}>
          {posts.map(post => (
            <div key={post.id} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', cursor: 'pointer' }}>
              <img
                src={post.imageUrl}
                alt={post.caption}
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
};
