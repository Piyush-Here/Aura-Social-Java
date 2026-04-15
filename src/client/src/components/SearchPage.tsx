import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import type { Post, User } from '../types';

type SearchMode = 'posts' | 'users';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setPosts([]);
      setUsers([]);
      setError('');
      return;
    }

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        if (mode === 'posts') {
          setPosts(await apiRequest<Post[]>(`/posts?q=${encodeURIComponent(normalizedQuery)}`));
          setUsers([]);
        } else {
          setUsers(await apiRequest<User[]>(`/users/search?q=${encodeURIComponent(normalizedQuery)}`));
          setPosts([]);
        }
        setError('');
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Search failed.');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [mode, query]);

  return (
    <main className="page-container stack-lg">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Search</p>
          <h1>Find people and posts quickly.</h1>
        </div>
      </section>

      <section className="card stack-md">
        <div className="segmented">
          <button
            className={mode === 'posts' ? 'segment active' : 'segment'}
            onClick={() => setMode('posts')}
            type="button"
          >
            Posts
          </button>
          <button
            className={mode === 'users' ? 'segment active' : 'segment'}
            onClick={() => setMode('users')}
            type="button"
          >
            Users
          </button>
        </div>

        <label className="field">
          <span>Keyword</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={mode === 'posts' ? 'Search captions or authors' : 'Search usernames or display names'}
          />
        </label>

        {error && <div className="form-banner error">{error}</div>}
        {loading && <p className="muted-text">Searching...</p>}

        {mode === 'posts' && !loading && (
          <div className="stack-sm">
            {posts.length === 0 && query.trim() ? (
              <div className="empty-card">No posts matched that query.</div>
            ) : (
              posts.map((post) => (
                <article className="result-card" key={post.id}>
                  <Link to={`/profile/${post.authorUsername}`}>{post.authorDisplayName}</Link>
                  <p>{post.caption}</p>
                </article>
              ))
            )}
          </div>
        )}

        {mode === 'users' && !loading && (
          <div className="stack-sm">
            {users.length === 0 && query.trim() ? (
              <div className="empty-card">No users matched that query.</div>
            ) : (
              users.map((user) => (
                <Link className="result-card" key={user.id} to={`/profile/${user.username}`}>
                  <strong>{user.displayName}</strong>
                  <span className="muted-text">@{user.username}</span>
                </Link>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}
