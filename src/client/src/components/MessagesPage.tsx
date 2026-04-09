import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface Message {
  id: string;
  fromUid: string;
  toUid: string;
  content: string;
  createdAt: string;
}

interface InboxEntry {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastTime: string;
}

export const MessagesPage = () => {
  const { user } = useAuth();
  const { recipientId } = useParams<{ recipientId?: string }>();
  const navigate = useNavigate();

  const [inbox, setInbox] = useState<InboxEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [userSearch, setUserSearch] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Open SSE connection when page loads
  useEffect(() => {
    if (!user) return;

    const es = new EventSource(`/api/messages/stream/${user.id}`);
    esRef.current = es;

    es.addEventListener('message', (e) => {
      try {
        const msg: Message = JSON.parse(e.data);
        // If this message is from the current open conversation, append it
        if (msg.fromUid === recipientId || msg.toUid === recipientId) {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
        // Refresh inbox
        fetchInbox();
      } catch {}
    });

    es.onerror = () => {
      // SSE disconnected — retry is automatic for EventSource
      console.warn('SSE disconnected, browser will retry');
    };

    return () => { es.close(); esRef.current = null; };
  }, [user, recipientId]);

  const fetchInbox = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/messages/inbox/${user.id}`, { credentials: 'include' });
      if (!res.ok) return;
      const messages: Message[] = await res.json();
      // Group into inbox entries — we don't have names, use IDs for now
      // In production you'd join with user data
      const entries: InboxEntry[] = messages.map(m => ({
        partnerId: m.fromUid === user.id ? m.toUid : m.fromUid,
        partnerName: m.fromUid === user.id ? m.toUid : m.fromUid,
        lastMessage: m.content,
        lastTime: m.createdAt,
      }));
      setInbox(entries);
    } catch {}
  }, [user]);

  useEffect(() => { fetchInbox(); }, [fetchInbox]);

  // Load conversation when recipientId changes
  useEffect(() => {
    if (!user || !recipientId) { setMessages([]); return; }
    fetch(`/api/messages/${user.id}/${recipientId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(setMessages)
      .catch(() => {});
  }, [user, recipientId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !recipientId || !user || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');

    // Optimistic update
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      fromUid: user.id,
      toUid: recipientId,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUid: recipientId, content }),
      });
      if (res.ok) {
        const real = await res.json();
        // Replace optimistic with real
        setMessages(prev => prev.map(m => m.id === optimistic.id ? real : m));
        fetchInbox();
      }
    } catch {
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setText(content);
    } finally {
      setSending(false);
    }
  };

  // Search users to start a new conversation
  const searchUsers = async (q: string) => {
    if (!q.trim()) { setUserSearch([]); return; }
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { credentials: 'include' });
      if (res.ok) setUserSearch(await res.json());
    } catch {}
  };

  const formatTime = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{
      maxWidth: 800, margin: '0 auto',
      height: 'calc(100vh - 64px)',
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      border: '0.5px solid #ececec',
      borderRadius: 12,
      overflow: 'hidden',
      background: '#fff',
    }}>
      {/* Sidebar: inbox + new DM search */}
      <div style={{ borderRight: '0.5px solid #ececec', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '0.5px solid #ececec' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>Messages</h3>
          <input
            value={newRecipient}
            onChange={e => { setNewRecipient(e.target.value); searchUsers(e.target.value); }}
            placeholder="Find a user…"
            style={{
              width: '100%', padding: '7px 10px',
              border: '0.5px solid #ddd', borderRadius: 8,
              fontSize: 12, outline: 'none', fontFamily: 'inherit',
            }}
          />
          {userSearch.length > 0 && (
            <div style={{
              marginTop: 4, border: '0.5px solid #ddd',
              borderRadius: 8, overflow: 'hidden', background: '#fff',
            }}>
              {userSearch.map(u => (
                <div key={u.id}
                  onClick={() => { navigate(`/messages/${u.id}`); setNewRecipient(''); setUserSearch([]); }}
                  style={{
                    padding: '8px 12px', cursor: 'pointer',
                    fontSize: 13, borderBottom: '0.5px solid #f5f5f5',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <span style={{ fontWeight: 500 }}>{u.name}</span>
                  <span style={{ color: '#aaa', fontSize: 11, marginLeft: 6 }}>{u.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inbox list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {inbox.length === 0 ? (
            <p style={{ padding: 16, fontSize: 12, color: '#bbb', textAlign: 'center' }}>
              No conversations yet.
            </p>
          ) : (
            inbox.map(entry => (
              <div
                key={entry.partnerId}
                onClick={() => navigate(`/messages/${entry.partnerId}`)}
                style={{
                  padding: '12px 16px', cursor: 'pointer',
                  background: recipientId === entry.partnerId ? '#f9f9f9' : 'transparent',
                  borderBottom: '0.5px solid #f5f5f5',
                }}
                onMouseEnter={e => {
                  if (recipientId !== entry.partnerId)
                    (e.currentTarget as HTMLElement).style.background = '#fafafa';
                }}
                onMouseLeave={e => {
                  if (recipientId !== entry.partnerId)
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{entry.partnerName}</span>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{formatTime(entry.lastTime)}</span>
                </div>
                <p style={{
                  fontSize: 12, color: '#888', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {entry.lastMessage}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conversation panel */}
      {recipientId ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div style={{
            padding: '14px 20px', borderBottom: '0.5px solid #ececec',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Link to={`/profile/${recipientId}`}
              style={{ fontWeight: 600, fontSize: 14, textDecoration: 'none', color: 'inherit' }}>
              {recipientId}
            </Link>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <p style={{ textAlign: 'center', color: '#bbb', fontSize: 13, marginTop: 40 }}>
                No messages yet. Say hello!
              </p>
            )}
            {messages.map(m => {
              const isMine = m.fromUid === user?.id;
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '72%', padding: '9px 14px',
                    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isMine ? '#000' : '#f0f0f0',
                    color: isMine ? '#fff' : '#000',
                    fontSize: 13, lineHeight: 1.5,
                  }}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px', borderTop: '0.5px solid #ececec',
            display: 'flex', gap: 10, alignItems: 'flex-end',
          }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Message…"
              style={{
                flex: 1, padding: '10px 14px',
                border: '0.5px solid #ddd', borderRadius: 22,
                fontSize: 13, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: text.trim() ? '#000' : '#ddd',
                border: 'none', color: '#fff', fontSize: 16,
                cursor: text.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
            >
              ↑
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#bbb', fontSize: 13, flexDirection: 'column', gap: 8,
        }}>
          <span style={{ fontSize: 32 }}>✉</span>
          <p>Select a conversation or search for someone</p>
        </div>
      )}
    </div>
  );
};
