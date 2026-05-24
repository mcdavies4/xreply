'use client';
import { useState, useEffect, useCallback } from 'react';

const ACCENT = '#E8450A';
const GREEN  = '#2ECC71';
const BLUE   = '#1d9bf0';

const TONES = [
  { id: 'genuine',   label: '💬 Genuine',   desc: 'Real founder voice' },
  { id: 'privacy',   label: '🔒 Privacy',   desc: 'Files never leave device' },
  { id: 'technical', label: '⚙ Technical',  desc: 'Local processing angle' },
  { id: 'feature',   label: '✦ Feature',    desc: 'Match their specific need' },
];

export default function Home() {
  const [tweets, setTweets]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [meta, setMeta]             = useState(null); // {keyword, group, keywordIndex, totalKeywords, groups}
  const [kidx, setKidx]             = useState(0);
  const [activeGroup, setActiveGroup] = useState(null);
  const [tone, setTone]             = useState('genuine');
  const [replies, setReplies]       = useState({});
  const [copied, setCopied]         = useState({});
  const [dismissed, setDismissed]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('xra-dismissed2') || '[]'); } catch { return []; }
  });
  const [stats, setStats]           = useState(() => {
    try { return JSON.parse(localStorage.getItem('xra-stats') || '{"sent":0,"generated":0}'); } catch { return {sent:0,generated:0}; }
  });

  const loadTweets = useCallback(async (k) => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`/api/tweets?k=${k ?? kidx}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTweets(data.tweets.filter(t => !dismissed.includes(t.id)));
      setMeta(data);
      setKidx(data.keywordIndex);
    } catch(e) { setError(e.message); }
    finally    { setLoading(false); }
  }, [kidx, dismissed]);

  useEffect(() => { loadTweets(0); }, []);

  async function generate(tweet) {
    setReplies(r => ({ ...r, [tweet.id]: { text:'', loading:true, error:'' } }));
    const newStats = { ...stats, generated: stats.generated + 1 };
    setStats(newStats);
    localStorage.setItem('xra-stats', JSON.stringify(newStats));
    try {
      const res  = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweet, tone }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReplies(r => ({ ...r, [tweet.id]: { text: data.reply, loading: false, error: '' } }));
    } catch(e) {
      setReplies(r => ({ ...r, [tweet.id]: { text:'', loading:false, error: e.message } }));
    }
  }

  async function copyReply(tweetId) {
    const text = replies[tweetId]?.text;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(c => ({ ...c, [tweetId]: true }));
    setTimeout(() => setCopied(c => ({ ...c, [tweetId]: false })), 2000);
    const newStats = { ...stats, sent: stats.sent + 1 };
    setStats(newStats);
    localStorage.setItem('xra-stats', JSON.stringify(newStats));
  }

  function openOnX(tweet) {
    const text = replies[tweet.id]?.text || '';
    const url  = text
      ? `https://twitter.com/intent/tweet?in_reply_to=${tweet.id}&text=${encodeURIComponent(text)}`
      : `https://twitter.com/intent/tweet?in_reply_to=${tweet.id}`;
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    const newStats = { ...stats, sent: stats.sent + 1 };
    setStats(newStats);
    localStorage.setItem('xra-stats', JSON.stringify(newStats));
  }

  function updateText(id, text) {
    setReplies(r => ({ ...r, [id]: { ...r[id], text } }));
  }

  function dismiss(id) {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('xra-dismissed2', JSON.stringify(next));
    setTweets(t => t.filter(tw => tw.id !== id));
  }

  function clearDismissed() {
    setDismissed([]);
    localStorage.removeItem('xra-dismissed2');
  }

  const timeAgo = (iso) => {
    if (!iso) return '';
    const d = (Date.now() - new Date(iso)) / 1000;
    if (d < 60)    return `${Math.round(d)}s`;
    if (d < 3600)  return `${Math.round(d/60)}m`;
    if (d < 86400) return `${Math.round(d/3600)}h`;
    return `${Math.round(d/86400)}d`;
  };

  // Group keywords for navigation
  const groups = meta?.groups || [];

  return (
    <div style={{ maxWidth:700, margin:'0 auto', padding:'16px 12px 80px', background:'#0a0a0f', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, background:ACCENT, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'#fff', flexShrink:0 }}>R</div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:'#f0ede8', letterSpacing:'-.02em' }}>X Reply Assistant</div>
              <div style={{ fontSize:11, color:'#555' }}>RightPDFKit · rightpdfkit.com</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            {/* Stats */}
            <div style={{ display:'flex', gap:12, padding:'5px 12px', background:'#0f0f1a', border:'1px solid #1a1a2e', borderRadius:8, fontSize:11 }}>
              <span style={{ color:'#555' }}>Generated: <span style={{ color:ACCENT, fontWeight:700 }}>{stats.generated}</span></span>
              <span style={{ color:'#555' }}>Sent: <span style={{ color:GREEN, fontWeight:700 }}>{stats.sent}</span></span>
            </div>
            <button onClick={() => loadTweets(kidx)} disabled={loading}
              style={btn('#1a1a2e', false, loading, '1px solid #2a2a3e')}>
              {loading ? '⟳' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {/* Tone selector */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:'#555', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>Reply tone</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {TONES.map(t => (
              <button key={t.id} onClick={() => setTone(t.id)} style={{
                background: tone===t.id ? 'rgba(232,69,10,.15)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${tone===t.id ? 'rgba(232,69,10,.4)' : 'rgba(255,255,255,.08)'}`,
                borderRadius:20, padding:'5px 12px', fontSize:12,
                color: tone===t.id ? ACCENT : '#666',
                cursor:'pointer', fontFamily:'inherit', transition:'all .13s',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Group tabs */}
        {groups.length > 0 && (
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, color:'#555', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>Category</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <button onClick={() => { setActiveGroup(null); loadTweets(kidx); }} style={{
                background: !activeGroup ? 'rgba(232,69,10,.15)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${!activeGroup ? 'rgba(232,69,10,.4)' : 'rgba(255,255,255,.08)'}`,
                borderRadius:20, padding:'4px 11px', fontSize:11,
                color: !activeGroup ? ACCENT : '#666',
                cursor:'pointer', fontFamily:'inherit',
              }}>All</button>
              {groups.map((g, i) => (
                <button key={g} onClick={() => {
                  setActiveGroup(g);
                  // Find first keyword in this group
                  loadTweets(i * Math.ceil(meta.totalKeywords / groups.length));
                }} style={{
                  background: activeGroup===g ? 'rgba(232,69,10,.15)' : 'rgba(255,255,255,.04)',
                  border: `1px solid ${activeGroup===g ? 'rgba(232,69,10,.4)' : 'rgba(255,255,255,.08)'}`,
                  borderRadius:20, padding:'4px 11px', fontSize:11,
                  color: activeGroup===g ? ACCENT : '#666',
                  cursor:'pointer', fontFamily:'inherit',
                }}>{g}</button>
              ))}
            </div>
          </div>
        )}

        {/* Current search */}
        {meta && (
          <div style={{ fontSize:11, color:'#3a3a4a', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ background:'#0f0f1a', border:'1px solid #1a1a2e', borderRadius:4, padding:'2px 7px', color:ACCENT }}>{meta.group}</span>
            <span>→ {meta.keyword}</span>
            <span style={{ color:'#2a2a3a' }}>· {tweets.length} tweets · {dismissed.length} dismissed</span>
            {dismissed.length > 0 && (
              <button onClick={clearDismissed} style={{ fontSize:10, color:'#444', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', textDecoration:'underline' }}>clear dismissed</button>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background:'rgba(231,76,60,.1)', border:'1px solid rgba(231,76,60,.3)', borderRadius:10, padding:'12px 14px', marginBottom:14, fontSize:13, color:'#e74c3c' }}>
          ⚠ {error}
          {error.includes('429') && <div style={{ fontSize:11, marginTop:4, color:'#c0392b' }}>Rate limited — X API free tier allows 1 search/15 mins. Wait a moment and try again.</div>}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && [1,2,3].map(i => (
        <div key={i} style={{ ...card, marginBottom:12, opacity:0.5 }}>
          <div style={{ height:12, background:'#1a1a2e', borderRadius:4, marginBottom:8, width:'55%' }}></div>
          <div style={{ height:44, background:'#1a1a2e', borderRadius:4, marginBottom:8 }}></div>
          <div style={{ height:10, background:'#1a1a2e', borderRadius:4, width:'35%' }}></div>
        </div>
      ))}

      {/* Empty state */}
      {!loading && !error && tweets.length === 0 && (
        <div style={{ textAlign:'center', padding:'50px 20px', color:'#333' }}>
          <div style={{ fontSize:28, marginBottom:10 }}>🔍</div>
          <div style={{ fontSize:14, color:'#555', marginBottom:6 }}>No tweets found for this keyword</div>
          <div style={{ fontSize:12, color:'#444', marginBottom:16 }}>Try a different category or keyword</div>
          <button onClick={() => loadTweets((kidx + 1) % (meta?.totalKeywords || 17))}
            style={btn(ACCENT, false)}>Try next keyword →</button>
        </div>
      )}

      {/* Tweet cards */}
      {!loading && tweets.map(tweet => {
        const rep        = replies[tweet.id] || {};
        const charCount  = rep.text?.length || 0;
        const overLimit  = charCount > 280;
        const isCopied   = copied[tweet.id];
        const engagement = (tweet.metrics?.like_count||0) + (tweet.metrics?.retweet_count||0) + (tweet.metrics?.reply_count||0);
        const isHighEngagement = engagement > 10;

        return (
          <div key={tweet.id} style={{ ...card, marginBottom:12, borderColor: isHighEngagement ? 'rgba(232,69,10,.2)' : '#1a1a2e' }}>

            {/* Author */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'#1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:ACCENT, flexShrink:0 }}>
                  {tweet.author?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#f0ede8', display:'flex', alignItems:'center', gap:5 }}>
                    {tweet.author?.name}
                    {isHighEngagement && <span style={{ fontSize:9, background:'rgba(232,69,10,.15)', color:ACCENT, border:'1px solid rgba(232,69,10,.3)', borderRadius:3, padding:'1px 5px', fontWeight:600 }}>🔥 HOT</span>}
                  </div>
                  <div style={{ fontSize:11, color:'#555' }}>@{tweet.author?.username} · {timeAgo(tweet.createdAt)}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:5 }}>
                <a href={tweet.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:11, color:'#555', padding:'4px 8px', border:'1px solid #222', borderRadius:6, textDecoration:'none' }}>
                  View ↗
                </a>
                <button onClick={() => dismiss(tweet.id)}
                  style={{ fontSize:11, color:'#333', padding:'4px 8px', border:'1px solid #1a1a2e', borderRadius:6, background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>
                  Skip
                </button>
              </div>
            </div>

            {/* Tweet text */}
            <div style={{ fontSize:13, color:'#bbb', lineHeight:1.65, marginBottom:10, padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:8, borderLeft:'2px solid #2a2a3e' }}>
              {tweet.text}
            </div>

            {/* Metrics */}
            <div style={{ display:'flex', gap:12, marginBottom:12, fontSize:11, color:'#444' }}>
              <span>♥ {tweet.metrics?.like_count||0}</span>
              <span>↺ {tweet.metrics?.retweet_count||0}</span>
              <span>💬 {tweet.metrics?.reply_count||0}</span>
              <span>👁 {(tweet.metrics?.impression_count||0).toLocaleString()}</span>
            </div>

            {/* Reply section */}
            <div style={{ borderTop:'1px solid #1a1a2e', paddingTop:10 }}>
              {!rep.text && !rep.loading && (
                <button onClick={() => generate(tweet)} style={btn(ACCENT, true)}>
                  ✦ Generate reply ({tone})
                </button>
              )}

              {rep.loading && (
                <div style={{ fontSize:12, color:'#666', padding:'6px 0', display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ animation:'spin .7s linear infinite', display:'inline-block' }}>◌</span>
                  Writing {tone} reply…
                </div>
              )}

              {rep.error && !rep.text && (
                <div style={{ fontSize:12, color:'#e74c3c' }}>⚠ {rep.error}</div>
              )}

              {rep.text && !rep.loading && (
                <div>
                  <textarea
                    value={rep.text}
                    onChange={e => updateText(tweet.id, e.target.value)}
                    rows={3}
                    style={{
                      width:'100%', background:'#0f0f1a',
                      border:`1px solid ${overLimit ? '#e74c3c' : '#2a2a3e'}`,
                      borderRadius:8, padding:'9px 12px', fontSize:12,
                      color:'#f0ede8', fontFamily:'inherit', lineHeight:1.6,
                      resize:'vertical', outline:'none', marginBottom:8,
                    }}
                  />
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <button onClick={() => generate(tweet)}
                        style={{ fontSize:11, color:'#555', padding:'5px 9px', border:'1px solid #1a1a2e', borderRadius:6, background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>
                        ↻
                      </button>
                      {TONES.filter(t => t.id !== tone).map(t => (
                        <button key={t.id} onClick={() => { setTone(t.id); generate(tweet); }}
                          style={{ fontSize:10, color:'#444', padding:'4px 8px', border:'1px solid #1a1a2e', borderRadius:6, background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>
                          {t.label}
                        </button>
                      ))}
                      <span style={{ fontSize:11, color: overLimit ? '#e74c3c' : '#444' }}>{charCount}/280</span>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => copyReply(tweet.id)}
                        style={btn(isCopied ? '#2ECC71' : '#1a1a2e', false, false, '1px solid #2a2a3e')}>
                        {isCopied ? '✓ Copied' : '📋 Copy'}
                      </button>
                      <button onClick={() => openOnX(tweet)} disabled={overLimit}
                        style={btn(BLUE, false, overLimit)}>
                        Open on X →
                      </button>
                    </div>
                  </div>
                  {overLimit && <div style={{ fontSize:11, color:'#e74c3c', marginTop:5 }}>Too long — edit to under 280 chars</div>}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Load more */}
      {!loading && tweets.length > 0 && (
        <div style={{ textAlign:'center', paddingTop:8 }}>
          <button onClick={() => loadTweets((kidx + 1) % (meta?.totalKeywords || 17))}
            style={btn('#1a1a2e', false, false, '1px solid #2a2a3e')}>
            Next keyword →
          </button>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const card = { background:'#0f0f1a', border:'1px solid #1a1a2e', borderRadius:12, padding:14 };

function btn(bg, full=false, disabled=false, border='none') {
  return {
    background: disabled ? '#111' : bg,
    color: '#fff', border,
    borderRadius:8, padding: full ? '9px 18px' : '6px 12px',
    fontSize:12, fontWeight:700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily:'inherit', opacity: disabled ? 0.4 : 1,
    width: full ? '100%' : 'auto',
    transition:'all .13s', textDecoration:'none', display:'inline-block',
  };
}
