'use client';
import { useState, useCallback } from 'react';

const KEYWORD_LABELS = [
  'what are you building',
  'what did you ship',
  'build in public shipped',
  'indie hacker working on',
  'side project launched',
  'show your product',
  'hate uploading PDF',
  'PDF tool free',
  'ilovepdf / smallpdf alternative',
  'PDF privacy upload',
  'scan to PDF',
  'PDF to Excel/CSV',
  'sign PDF free',
  'compress PDF free',
  'merge PDF free',
  'bates numbering',
  'redline PDF contract',
];

export default function Home() {
  const [tweets, setTweets]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [keyword, setKeyword]     = useState('');
  const [kidx, setKidx]           = useState(0);
  const [error, setError]         = useState('');
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('xra-dismissed') || '[]'); } catch { return []; }
  });
  const [replies, setReplies]     = useState({});
  const [copied, setCopied]       = useState({});

  const loadTweets = useCallback(async (k) => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`/api/tweets?k=${k ?? kidx}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTweets(data.tweets.filter(t => !dismissed.includes(t.id)));
      setKeyword(data.keyword);
      setKidx(data.keywordIndex);
    } catch(e) { setError(e.message); }
    finally    { setLoading(false); }
  }, [kidx, dismissed]);

  // Generate reply
  async function generate(tweet) {
    setReplies(r => ({ ...r, [tweet.id]: { text: '', loading: true, error: '' } }));
    try {
      const res  = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweet }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReplies(r => ({ ...r, [tweet.id]: { text: data.reply, loading: false, error: '' } }));
    } catch(e) {
      setReplies(r => ({ ...r, [tweet.id]: { text: '', loading: false, error: e.message } }));
    }
  }

  // Copy reply to clipboard
  async function copyReply(tweetId) {
    const text = replies[tweetId]?.text;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(c => ({ ...c, [tweetId]: true }));
    setTimeout(() => setCopied(c => ({ ...c, [tweetId]: false })), 2000);
  }

  // Open X reply intent URL — uses <a> click for iOS Safari compatibility
  function openOnX(tweet) {
    const text = replies[tweet.id]?.text || '';
    const url = text
      ? `https://twitter.com/intent/tweet?in_reply_to=${tweet.id}&text=${encodeURIComponent(text)}`
      : `https://twitter.com/intent/tweet?in_reply_to=${tweet.id}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function updateText(id, text) {
    setReplies(r => ({ ...r, [id]: { ...r[id], text } }));
  }

  function dismiss(id) {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('xra-dismissed', JSON.stringify(next));
    setTweets(t => t.filter(tw => tw.id !== id));
  }

  const timeAgo = (iso) => {
    const d = (Date.now() - new Date(iso)) / 1000;
    if (d < 60)    return `${Math.round(d)}s ago`;
    if (d < 3600)  return `${Math.round(d/60)}m ago`;
    if (d < 86400) return `${Math.round(d/3600)}h ago`;
    return `${Math.round(d/86400)}d ago`;
  };



  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:14 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-.02em', marginBottom:3 }}>
              ✦ X Reply Assistant
            </h1>
            <p style={{ fontSize:12, color:'#666' }}>
              Find tweets → generate reply → copy or open on X to post
            </p>
          </div>
          <button onClick={() => loadTweets(kidx)} disabled={loading} style={btn('#E8450A')}>
            {loading ? '⟳ Loading…' : '↻ Refresh'}
          </button>
        </div>

        {/* Keyword tabs */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {KEYWORD_LABELS.map((label, i) => (
            <button key={i} onClick={() => loadTweets(i)} style={{
              background: i===kidx ? 'rgba(232,69,10,.15)' : 'rgba(255,255,255,.05)',
              border: `1px solid ${i===kidx ? 'rgba(232,69,10,.4)' : 'rgba(255,255,255,.08)'}`,
              borderRadius: 20, padding: '4px 12px', fontSize: 11,
              color: i===kidx ? '#E8450A' : '#666', cursor:'pointer',
              fontFamily:'inherit', transition:'all .13s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {keyword && (
          <div style={{ marginTop:8, fontSize:11, color:'#444' }}>
            Searching: <span style={{ color:'#E8450A' }}>{keyword}</span>
            {' · '}{tweets.length} tweets · {dismissed.length} dismissed
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background:'rgba(231,76,60,.1)', border:'1px solid rgba(231,76,60,.3)', borderRadius:10, padding:'12px 14px', marginBottom:16, fontSize:13, color:'#e74c3c' }}>
          ⚠ {error}
        </div>
      )}

      {/* Skeletons */}
      {loading && [1,2,3].map(i => (
        <div key={i} style={{ ...card, marginBottom:12 }}>
          {[60,100,40].map((w,j) => (
            <div key={j} style={{ height:j===1?50:12, background:'#1a1a2e', borderRadius:4, marginBottom:8, width:w+'%' }} />
          ))}
        </div>
      ))}

      {/* Empty */}
      {!loading && !error && tweets.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#444' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
          <div style={{ fontSize:14, marginBottom:6 }}>No new tweets found</div>
          <div style={{ fontSize:12 }}>Try a different keyword or refresh</div>
          <button onClick={() => loadTweets(0)} style={{ ...btn('#E8450A'), marginTop:16 }}>Load tweets</button>
        </div>
      )}

      {/* Tweet cards */}
      {!loading && tweets.map(tweet => {
        const rep      = replies[tweet.id] || {};
        const charCount = rep.text?.length || 0;
        const overLimit = charCount > 280;
        const isCopied  = copied[tweet.id];

        return (
          <div key={tweet.id} style={{ ...card, marginBottom:14 }}>

            {/* Author row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#E8450A', flexShrink:0 }}>
                  {tweet.author?.name?.[0] || '?'}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#f0ede8' }}>{tweet.author?.name}</div>
                  <div style={{ fontSize:11, color:'#555' }}>@{tweet.author?.username} · {timeAgo(tweet.createdAt)}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <a 
                  href={`https://twitter.com/${tweet.author?.username}/status/${tweet.id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize:11, color:'#555', padding:'4px 9px', border:'1px solid #222', borderRadius:6, textDecoration:'none', display:'inline-block' }}>
                  View on X ↗
                </a>
                <button onClick={() => dismiss(tweet.id)}
                  style={{ fontSize:11, color:'#444', padding:'4px 9px', border:'1px solid #222', borderRadius:6, background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>
                  Skip
                </button>
              </div>
            </div>

            {/* Tweet text */}
            <div style={{ fontSize:13, color:'#bbb', lineHeight:1.65, marginBottom:10, padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:8, borderLeft:'2px solid #2a2a3e' }}>
              {tweet.text}
            </div>

            {/* Metrics */}
            <div style={{ display:'flex', gap:14, marginBottom:12, fontSize:11, color:'#444' }}>
              <span>♥ {tweet.metrics?.like_count || 0}</span>
              <span>↺ {tweet.metrics?.retweet_count || 0}</span>
              <span>💬 {tweet.metrics?.reply_count || 0}</span>
            </div>

            {/* Reply section */}
            <div style={{ borderTop:'1px solid #1a1a2e', paddingTop:12 }}>

              {/* Generate button */}
              {!rep.text && !rep.loading && (
                <button onClick={() => generate(tweet)} style={btn('#E8450A', true)}>
                  ✦ Generate AI reply
                </button>
              )}

              {rep.loading && (
                <div style={{ fontSize:12, color:'#888', padding:'6px 0' }}>✦ Writing reply…</div>
              )}

              {rep.error && !rep.text && (
                <div style={{ fontSize:12, color:'#e74c3c' }}>⚠ {rep.error}</div>
              )}

              {/* Reply text + actions */}
              {rep.text && !rep.loading && (
                <div>
                  <textarea
                    value={rep.text}
                    onChange={e => updateText(tweet.id, e.target.value)}
                    rows={4}
                    style={{
                      width:'100%', background:'#0f0f1a',
                      border:`1px solid ${overLimit ? '#e74c3c' : '#2a2a3e'}`,
                      borderRadius:8, padding:'10px 12px', fontSize:13,
                      color:'#f0ede8', fontFamily:'inherit', lineHeight:1.6,
                      resize:'vertical', outline:'none', marginBottom:8,
                    }}
                  />

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                    {/* Left — regen + char count */}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <button onClick={() => generate(tweet)} style={btn('#333')}>
                        ↻ Regenerate
                      </button>
                      <span style={{ fontSize:11, color: overLimit ? '#e74c3c' : '#444' }}>
                        {charCount}/280
                      </span>
                    </div>

                    {/* Right — Copy + Open on X */}
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => copyReply(tweet.id)}
                        style={btn(isCopied ? '#2ECC71' : '#1a1a2e', false, false, '1px solid #2a2a3e')}>
                        {isCopied ? '✓ Copied!' : '📋 Copy reply'}
                      </button>
                      <button onClick={() => openOnX(tweet)} disabled={overLimit}
                        style={btn('#1d9bf0', false, overLimit)}>
                        Open on X →
                      </button>
                    </div>
                  </div>

                  {/* Helper text */}
                  <div style={{ marginTop:8, fontSize:11, color:'#444', lineHeight:1.5 }}>
                    <strong style={{ color:'#1d9bf0' }}>Open on X</strong> pre-fills the reply box on X.com so you just hit Post.
                    Or <strong style={{ color:'#888' }}>Copy reply</strong> and paste it manually.
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Style helpers
const card = {
  background: '#0f0f1a',
  border: '1px solid #1a1a2e',
  borderRadius: 12,
  padding: 16,
};

function btn(bg, full=false, disabled=false, border='none') {
  return {
    background: disabled ? '#1a1a2e' : bg,
    color: '#fff',
    border,
    borderRadius: 8,
    padding: full ? '10px 20px' : '6px 13px',
    fontSize: 12,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    opacity: disabled ? 0.4 : 1,
    width: full ? '100%' : 'auto',
    transition: 'all .13s',
    textDecoration: 'none',
    display: 'inline-block',
  };
}
