import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Post } from '../types';
import { PostCard } from '../components/PostCard';
import { CreatePostModal } from '../components/CreatePostModal';
import { useAuth } from './AuthContext';

export const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const createOpen = searchParams.get('create') === '1';

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts', { credentials: 'include' });
      if (res.ok) setPosts(await res.json());
    } catch (err) {
      console.error('Fetch posts failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // Poll every 15s for new posts
    const interval = setInterval(fetchPosts, 15_000);
    return () => clearInterval(interval);
  }, []);

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? updated : p));
      }
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleCreatePost = async (imageUrl: string, caption: string) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, caption }),
    });
    if (!res.ok) throw new Error('Failed to create post');
    const newPost = await res.json();
    setPosts(prev => [newPost, ...prev]);
  };

  const closeModal = () => {
    searchParams.delete('create');
    setSearchParams(searchParams);
  };

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#bbb', fontSize: 13 }}>
          Loading feed…
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <p style={{ color: '#bbb', fontSize: 14 }}>No posts yet.</p>
          <p style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>
            Be the first to share something.
          </p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post.id} post={post} onLike={handleLike} />
        ))
      )}

      <CreatePostModal
        isOpen={createOpen}
        onClose={closeModal}
        onSubmit={handleCreatePost}
      />
    </main>
  );
};
