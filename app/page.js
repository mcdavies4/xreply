'use client';
import { useState, useEffect, useCallback } from 'react';

const KEYWORD_LABELS = [
  'what are you building',
  'what did you ship',
  'show me your project',
  'side project launched',
  'build in public shipped',
  'indie hacker working on',
  'show your product',
  'what are you working on',
];

export default function Home() {
  const [tweets, setTweets]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [keyword, setKeyword]       = useState('');
  const [kidx, setKidx]             = useState(0);
  const [error, setError]           = useState('');
  const [dismissed, setDismissed]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissed') || '[]'); } catch { return []; }
  });
  const [replies, setReplies]       = useState({});   // tweetId → {text, loading, sent, error}

  // Load tweets
  const loadTweets = useCallback(async (k) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/tweets?k=${k ?? kidx}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTweets(data.tweets.filter(t => !dismissed.includes(t.id)));
      setKeyword(data.keyword);
      setKidx(data.keywordIndex);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [kidx, dismissed]);

  useEffect(() => { loadTweets(0); }, []);

  // Generate AI reply for a tweet
  async function generateReply(tweet) {
    setReplies(r => ({ ...r, [tweet.id]: { text: '', loading: true, sent: false, error: '' } }));
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweet }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReplies(r => ({ ...r, [tweet.id]: { text: data.reply, loading: false, sent: false, error: '' } }));
    } catch(e) {
      setReplies(r => ({ ...r, [tweet.id]: { text: '', loading: false, sent: false, error: e.message } }));
    }
  }

  // Post reply
  async function sendReply(tweet) {
    const rep = replies[tweet.id];
    if (!rep?.text) return;
    setReplies(r => ({ ...r, [tweet.id]: { ...rep, loading: true } }));
    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetId: tweet.id, text: rep.text }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReplies(r => ({ ...r, [tweet.id]: { ...rep, loading: false, sent: true } }));
      // Auto-dismiss after sending
      setTimeout(() => dismiss(tweet.id), 1500);
    } catch(e) {
      setReplies(r => ({ ...r, [tweet.id]: { ...rep, loading: false, error: e.message } }));
    }
  }

  function dismiss(id) {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('dismissed', JSON.stringify(next));
    setTweets(t => t.filter(tw => tw.id !== id));
  }

  function updateReplyText(id, text) {
    setReplies(r => ({ ...r, [id]: { ...r[id], text } }));
  }

  const timeAgo = (iso) => {
    const d = (Date.now() - new Date(iso)) / 1000;
    if (d < 60) return `${Math.round(d)}s ago`;
    if (d < 3600) return `${Math.round(d/60)}m ago`;
    if (d < 86400) return `${Math.round(d/3600)}h ago`;
    return `${Math.round(d/86400)}d ago`;
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 3 }}>
              ✦ X Reply Assistant
            </h1>
            <p style={{ fontSize: 12, color: '#888' }}>
              Find tweets asking about what people are building — reply with one click
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => loadTweets(kidx)} disabled={loading}
              style={btnStyle('#E8450A')}>
              {loading ? '⟳ Loading…' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {/* Keyword selector */}
        <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {KEYWORD_LABELS.map((label, i) => (
            <button key={i} onClick={() => loadTweets(i)}
              style={{
                background: i === kidx ? 'rgba(232,69,10,.15)' : 'rgba(255,255,255,.05)',
                border: `1px solid ${i === kidx ? 'rgba(232,69,10,.4)' : 'rgba(255,255,255,.1)'}`,
                borderRadius: 20, padding: '4px 11px', fontSize: 11,
                color: i === kidx ? '#E8450A' : '#888', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all .13s',
              }}>
              {label}
            </button>
          ))}
        </div>

        {keyword && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#555' }}>
            Searching: <span style={{ color: '#E8450A' }}>{keyword}</span>
            {' · '}{tweets.length} tweets · {dismissed.length} dismissed
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(231,76,60,.1)', border: '1px solid rgba(231,76,60,.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#e74c3c' }}>
          ⚠ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && [1,2,3].map(i => (
        <div key={i} style={{ ...cardStyle, marginBottom: 12 }}>
          <div style={{ height: 14, background: '#1a1a2e', borderRadius: 4, marginBottom: 8, width: '60%' }}></div>
          <div style={{ height: 50, background: '#1a1a2e', borderRadius: 4, marginBottom: 8 }}></div>
          <div style={{ height: 12, background: '#1a1a2e', borderRadius: 4, width: '40%' }}></div>
        </div>
      ))}

      {/* No tweets */}
      {!loading && tweets.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 14, marginBottom: 6 }}>No new tweets found</div>
          <div style={{ fontSize: 12 }}>Try a different keyword or check back soon</div>
        </div>
      )}

      {/* Tweet cards */}
      {!loading && tweets.map(tweet => {
        const rep = replies[tweet.id] || {};
        const charCount = rep.text?.length || 0;
        const overLimit = charCount > 280;

        return (
          <div key={tweet.id} style={{ ...cardStyle, marginBottom: 14 }}>

            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#E8450A', flexShrink: 0 }}>
                  {tweet.author?.name?.[0] || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0ede8' }}>{tweet.author?.name}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>@{tweet.author?.username} · {timeAgo(tweet.createdAt)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <a href={tweet.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: '#555', padding: '4px 8px', border: '1px solid #222', borderRadius: 6, textDecoration: 'none' }}>
                  View ↗
                </a>
                <button onClick={() => dismiss(tweet.id)}
                  style={{ fontSize: 11, color: '#555', padding: '4px 8px', border: '1px solid #222', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Skip
                </button>
              </div>
            </div>

            {/* Tweet text */}
            <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6, marginBottom: 12, padding: '10px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 8, borderLeft: '2px solid #333' }}>
              {tweet.text}
            </div>

            {/* Metrics */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 12, fontSize: 11, color: '#555' }}>
              <span>♥ {tweet.metrics?.like_count || 0}</span>
              <span>↺ {tweet.metrics?.retweet_count || 0}</span>
              <span>💬 {tweet.metrics?.reply_count || 0}</span>
              <span>👁 {(tweet.metrics?.impression_count || 0).toLocaleString()}</span>
            </div>

            {/* Reply section */}
            {!rep.sent ? (
              <div>
                {!rep.text && !rep.loading && (
                  <button onClick={() => generateReply(tweet)}
                    style={btnStyle('#E8450A', true)}>
                    ✦ Generate AI reply
                  </button>
                )}

                {rep.loading && (
                  <div style={{ fontSize: 12, color: '#888', padding: '8px 0' }}>✦ Writing reply…</div>
                )}

                {rep.text && !rep.loading && (
                  <div>
                    <textarea
                      value={rep.text}
                      onChange={e => updateReplyText(tweet.id, e.target.value)}
                      rows={4}
                      style={{
                        width: '100%', background: '#0f0f1a', border: `1px solid ${overLimit ? '#e74c3c' : '#2a2a3e'}`,
                        borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#f0ede8',
                        fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', outline: 'none',
                        marginBottom: 8,
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => generateReply(tweet)}
                          style={{ fontSize: 11, color: '#888', padding: '5px 10px', border: '1px solid #2a2a3e', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                          ↻ Regenerate
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: overLimit ? '#e74c3c' : '#555' }}>
                          {charCount}/280
                        </span>
                        <button onClick={() => sendReply(tweet)} disabled={overLimit || rep.loading}
                          style={btnStyle('#2ECC71', false, overLimit || rep.loading)}>
                          {rep.loading ? 'Posting…' : '↑ Post reply'}
                        </button>
                      </div>
                    </div>
                    {rep.error && (
                      <div style={{ fontSize: 12, color: '#e74c3c', marginTop: 6 }}>⚠ {rep.error}</div>
                    )}
                  </div>
                )}

                {rep.error && !rep.text && (
                  <div style={{ fontSize: 12, color: '#e74c3c' }}>⚠ {rep.error}</div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#2ECC71', fontWeight: 600 }}>
                ✓ Reply posted — removing…
              </div>
            )}
          </div>
        );
      })}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: '#444' }}>
        Built for RightPDFKit · Replies post from your X account
      </div>
    </div>
  );
}

// Styles
const cardStyle = {
  background: '#0f0f1a',
  border: '1px solid #1a1a2e',
  borderRadius: 12,
  padding: '16px',
};

function btnStyle(color, full = false, disabled = false) {
  return {
    background: disabled ? '#333' : color,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: full ? '10px 20px' : '7px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    opacity: disabled ? 0.5 : 1,
    width: full ? '100%' : 'auto',
    transition: 'all .13s',
  };
}
