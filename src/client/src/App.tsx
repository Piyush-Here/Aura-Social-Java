import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PostCard } from './components/PostCard';
import { AuthForm } from './components/AuthForm';
import { CreatePostModal } from './components/CreatePostModal';
import { Post } from './types';

const API_BASE = '/api';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`);
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_BASE}/posts`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (error) {
        console.error("Fetch posts failed:", error);
      }
    };

    fetchPosts();
    const interval = setInterval(fetchPosts, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = async (email: string, pass: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleSignup = async (email: string, pass: string, name: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, name })
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleCreatePost = async (imageUrl: string, caption: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, caption })
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [newPost, ...prev]);
      }
    } catch (error) {
      console.error("Create post failed:", error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/like`, { method: 'POST' });
      if (res.ok) {
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p
        ));
      }
    } catch (error) {
      console.error("Like failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-subtitle animate-pulse">Aura</div>
      </div>
    );
  }

  if (!user) return <AuthForm onLogin={handleLogin} onSignup={handleSignup} />;

  return (
    <div style={{ paddingTop: '80px', paddingBottom: '40px' }}>
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onCreatePost={() => setIsCreateModalOpen(true)} 
      />
      
      <main className="container">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {posts.map(post => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}
          
          {posts.length === 0 && (
            <div className="empty-state">
              <p className="empty-text serif">No stories yet.</p>
            </div>
          )}
        </div>
      </main>

      {isCreateModalOpen && (
        <CreatePostModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onSubmit={handleCreatePost} 
        />
      )}
    </div>
  );
}
