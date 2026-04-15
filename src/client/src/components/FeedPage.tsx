import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import type { Post } from '../types';
import { CreatePostModal } from './CreatePostModal';
import { PostCard } from './PostCard';

export function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const loadPosts = async () => {
    try {
      const response = await apiRequest<Post[]>('/posts');
      setPosts(response);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const handleCreate = async (imageUrl: string | null, caption: string) => {
    const created = await apiRequest<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify({ imageUrl, caption }),
    });
    setPosts((current) => [created, ...current]);
  };

  const handleLike = async (postId: number) => {
    const updated = await apiRequest<Post>(`/posts/${postId}/like`, { method: 'POST' });
    setPosts((current) => current.map((post) => (post.id === postId ? updated : post)));
  };

  return (
    <main className="page-container stack-lg">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Feed</p>
          <h1>People, posts, and conversations in one place.</h1>
        </div>
        <button className="button primary" onClick={() => setCreateOpen(true)} type="button">
          Create post
        </button>
      </section>

      {error && <div className="form-banner error">{error}</div>}

      {loading ? (
        <div className="card empty-card">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="card empty-card">No posts yet. Start the feed with your first post.</div>
      ) : (
        <div className="stack-md">
          {posts.map((post) => (
            <PostCard key={post.id} onLike={handleLike} post={post} />
          ))}
        </div>
      )}

      <CreatePostModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </main>
  );
}
