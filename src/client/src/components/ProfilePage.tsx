import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import type { Post, User } from '../types';
import { useAuth } from './AuthContext';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState({ displayName: '', bio: '', photoUrl: '' });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isOwner = currentUser?.username === username;

  useEffect(() => {
    if (!username) {
      return;
    }

    setLoading(true);
    Promise.all([
      apiRequest<User>(`/users/${username}`),
      apiRequest<Post[]>(`/posts?username=${encodeURIComponent(username)}`),
    ])
      .then(([profileResponse, postResponse]) => {
        setProfile(profileResponse);
        setPosts(postResponse);
        setDraft({
          displayName: profileResponse.displayName,
          bio: profileResponse.bio || '',
          photoUrl: profileResponse.photoUrl || '',
        });
        setError('');
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : 'Unable to load profile.');
      })
      .finally(() => setLoading(false));
  }, [username]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await apiRequest<User>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: draft.displayName.trim(),
          bio: draft.bio.trim(),
          photoUrl: draft.photoUrl.trim(),
        }),
      });
      setProfile(updated);
      setEditing(false);
      await refreshUser();
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="page-container"><div className="card empty-card">Loading profile...</div></main>;
  }

  if (!profile) {
    return <main className="page-container"><div className="card empty-card">Profile not found.</div></main>;
  }

  return (
    <main className="page-container stack-lg">
      <section className="card profile-card">
        <div className="profile-header">
          <div className="avatar-large">{profile.displayName.charAt(0).toUpperCase()}</div>
          <div className="stack-sm profile-copy">
            <div className="profile-line">
              <div>
                <h1>{profile.displayName}</h1>
                <p className="muted-text">@{profile.username}</p>
              </div>
              {!isOwner && (
                <button
                  className="button subtle"
                  onClick={() => navigate(`/messages/${profile.username}`)}
                  type="button"
                >
                  Message
                </button>
              )}
            </div>
            <p>{profile.bio || 'No bio yet.'}</p>
          </div>
        </div>

        {isOwner && (
          <div className="stack-sm">
            {!editing ? (
              <button className="button ghost" onClick={() => setEditing(true)} type="button">
                Edit profile
              </button>
            ) : (
              <div className="stack-sm profile-editor">
                <label className="field">
                  <span>Display name</span>
                  <input
                    value={draft.displayName}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, displayName: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Bio</span>
                  <textarea
                    rows={3}
                    value={draft.bio}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, bio: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Photo URL</span>
                  <input
                    value={draft.photoUrl}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, photoUrl: event.target.value }))
                    }
                  />
                </label>
                <div className="row-end">
                  <button className="button ghost" onClick={() => setEditing(false)} type="button">
                    Cancel
                  </button>
                  <button className="button primary" disabled={saving} onClick={() => void saveProfile()} type="button">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div className="form-banner error">{error}</div>}
      </section>

      <section className="stack-md">
        <div className="section-heading">
          <h2>Posts</h2>
          <span className="muted-text">{posts.length}</span>
        </div>
        {posts.length === 0 ? (
          <div className="card empty-card">No posts published yet.</div>
        ) : (
          <div className="profile-posts">
            {posts.map((post) => (
              <Link className="profile-post" key={post.id} to="/">
                {post.imageUrl ? <img alt={post.caption} src={post.imageUrl} /> : <div>{post.caption}</div>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
