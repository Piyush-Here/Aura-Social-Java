import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../types';

type SearchMode = 'posts' | 'users';

interface UserResult {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  bio?: string;
}

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('posts');
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [regexError, setRegexError] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateRegex = (q: string): boolean => {
    try { new RegExp(q); return true; }
    catch { return false; }
  };

  const doSearch = useCallback(async (q: string, searchMode: SearchMode) => {
    if (!q.trim()) {
      setPostResults([]);
      setUserResults([]);
      setRegexError('');
      return;
    }

    if (!validateRegex(q)) {
      setRegexError('Invalid regex — check your pattern syntax');
      return;
    }
    setRegexError('');
    setLoading(true);

    try {
      if (searchMode === 'posts') {
        const res = await fetch(
          `/api/posts?q=${encodeURIComponent(q)}`,
          { credentials: 'include' }
        );
        setPostResults(res.ok ? await res.json() : []);
      } else {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(q)}`,
          { credentials: 'include' }
        );
        setUserResults(res.ok ? await res.json() : []);
      }
    } catch {
      setPostResults([]);
      setUserResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value, mode), 300);
  };

  const handleModeSwitch = (newMode: SearchMode) => {
    setMode(newMode);
    setPostResults([]);
    setUserResults([]);
    if (query.trim()) doSearch(query, newMode);
  };

  const results = mode === 'posts' ? postResults.length : userResults.length;

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: 20,
    border: '0.5px solid',
    borderColor: active ? '#000' : '#ddd',
    background: active ? '#000' : 'transparent',
    color: active ? '#fff' : '#666',
    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s',
  });

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 20px' }}>Search</h2>

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder="Type a regex pattern…  e.g.  ^beach  |  \b(cat|dog)\b  |  [Ll]ove"
          autoFocus
          style={{
            width: '100%', padding: '12px 44px 12px 14px',
            border: `0.5px solid ${regexError ? '#E24B4A' : '#ddd'}`,
            borderRadius: 10, fontSize: 13,
            fontFamily: 'monospace', outline: 'none',
            transition: 'border-color 0.15s',
          }}
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 14, top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11, color: '#aaa',
          }}>
            …
          </span>
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(''); setPostResults([]); setUserResults([]); }}
            style={{
              position: 'absolute', right: 12, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none',
              fontSize: 16, color: '#aaa', cursor: 'pointer', lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {regexError && (
        <p style={{ fontSize: 12, color: '#E24B4A', margin: '4px 0 12px 2px' }}>
          {regexError}
        </p>
      )}

      <p style={{ fontSize: 11, color: '#bbb', marginBottom: 16, paddingLeft: 2 }}>
        Full Java regex syntax. Matches captions, usernames, bios.
      </p>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={pillStyle(mode === 'posts')} onClick={() => handleModeSwitch('posts')}>
          Posts
        </button>
        <button style={pillStyle(mode === 'users')} onClick={() => handleModeSwitch('users')}>
          People
        </button>
      </div>

      {/* Result count */}
      {query && !loading && !regexError && (
        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
          {results} {results === 1 ? 'result' : 'results'}
        </p>
      )}

      {/* Post results */}
      {mode === 'posts' && postResults.map(post => (
        <div key={post.id} style={{
          display: 'flex', gap: 12, marginBottom: 16,
          padding: 12, border: '0.5px solid #ececec',
          borderRadius: 10, background: '#fff',
        }}>
          <img
            src={post.imageUrl}
            alt={post.caption}
            referrerPolicy="no-referrer"
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to={`/profile/${post.authorUid}`}
              style={{ fontWeight: 600, fontSize: 13, textDecoration: 'none', color: 'inherit' }}>
              {post.authorName}
            </Link>
            <p style={{
              fontSize: 13, color: '#444', margin: '3px 0 0',
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {post.caption}
            </p>
            <p style={{ fontSize: 11, color: '#bbb', margin: '4px 0 0' }}>
              {post.likesCount} likes · {post.commentsCount} comments
            </p>
          </div>
        </div>
      ))}

      {/* User results */}
      {mode === 'users' && userResults.map(u => (
        <Link key={u.id} to={`/profile/${u.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center',
            padding: '12px 14px', marginBottom: 8,
            border: '0.5px solid #ececec', borderRadius: 10,
            background: '#fff', transition: 'background 0.12s',
            cursor: 'pointer',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            {u.photoURL ? (
              <img src={u.photoURL} alt={u.name}
                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#111', color: '#fff', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {u.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{u.name}</p>
              {u.bio && <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{u.bio}</p>}
            </div>
          </div>
        </Link>
      ))}

      {/* Empty state */}
      {query && !loading && !regexError && results === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#bbb', fontSize: 14 }}>No {mode} matched your pattern.</p>
          <p style={{ color: '#ddd', fontSize: 12, marginTop: 6 }}>
            Try a simpler pattern or check your regex syntax.
          </p>
        </div>
      )}
    </main>
  );
};
