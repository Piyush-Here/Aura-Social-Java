import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import type { ConversationSummary, Message, User } from '../types';
import { useAuth } from './AuthContext';

export function MessagesPage() {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const loadConversations = async () => {
    try {
      setConversations(await apiRequest<ConversationSummary[]>('/messages/conversations'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load conversations.');
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!username) {
      setMessages([]);
      return;
    }

    apiRequest<Message[]>(`/messages/${encodeURIComponent(username)}`)
      .then((response) => {
        setMessages(response);
        setError('');
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : 'Unable to load messages.');
      });
  }, [username]);

  useEffect(() => {
    const normalizedQuery = userQuery.trim();
    if (!normalizedQuery) {
      setUserResults([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const results = await apiRequest<User[]>(`/users/search?q=${encodeURIComponent(normalizedQuery)}`);
        setUserResults(results.filter((candidate) => candidate.username !== user?.username));
      } catch {
        setUserResults([]);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [user?.username, userQuery]);

  const sendMessage = async () => {
    const normalizedDraft = draft.trim();
    if (!username || !normalizedDraft) {
      return;
    }

    setSending(true);
    try {
      const created = await apiRequest<Message>('/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientUsername: username,
          content: normalizedDraft,
        }),
      });
      setMessages((current) => [...current, created]);
      setDraft('');
      setError('');
      await loadConversations();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="page-container">
      <section className="messages-layout">
        <aside className="card messages-sidebar">
          <div className="stack-sm">
            <div className="section-heading">
              <h2>Conversations</h2>
            </div>
            <label className="field">
              <span>Start a new chat</span>
              <input
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
                placeholder="Search usernames"
              />
            </label>
          </div>

          {userResults.length > 0 && (
            <div className="stack-xs">
              {userResults.map((candidate) => (
                <button
                  className="result-card"
                  key={candidate.id}
                  onClick={() => {
                    navigate(`/messages/${candidate.username}`);
                    setUserQuery('');
                    setUserResults([]);
                  }}
                  type="button"
                >
                  <strong>{candidate.displayName}</strong>
                  <span className="muted-text">@{candidate.username}</span>
                </button>
              ))}
            </div>
          )}

          <div className="stack-xs">
            {conversations.map((conversation) => (
              <Link
                className={conversation.username === username ? 'result-card active-link' : 'result-card'}
                key={conversation.username}
                to={`/messages/${conversation.username}`}
              >
                <strong>{conversation.displayName}</strong>
                <span className="muted-text">{conversation.lastMessage}</span>
              </Link>
            ))}
          </div>
        </aside>

        <section className="card messages-thread">
          {username ? (
            <>
              <div className="section-heading">
                <h2>Chat with @{username}</h2>
              </div>

              <div className="message-list">
                {messages.length === 0 ? (
                  <div className="empty-card">No messages yet.</div>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderUsername === user?.username;
                    return (
                      <article className={mine ? 'message-bubble mine' : 'message-bubble'} key={message.id}>
                        <p>{message.content}</p>
                        <time>{new Date(message.createdAt).toLocaleString()}</time>
                      </article>
                    );
                  })
                )}
              </div>

              <div className="message-compose">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Write a message"
                />
                <button className="button primary" disabled={sending} onClick={() => void sendMessage()} type="button">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="empty-card">Choose a conversation or search for a user to start one.</div>
          )}

          {error && <div className="form-banner error">{error}</div>}
        </section>
      </section>
    </main>
  );
}
