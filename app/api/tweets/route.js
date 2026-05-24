import { TwitterApi } from 'twitter-api-v2';

const KEYWORD_GROUPS = {
  'Founders & builders': [
    '"what are you building"',
    '"what did you ship" "this week"',
    '"build in public" "just shipped"',
    '"indie hacker" "working on"',
    '"side project" "just launched"',
    '"show me your product"',
    '"what are you working on" founders',
    '"shipped today"',
  ],
  'PDF pain points': [
    '"hate uploading" pdf',
    '"pdf tool" free',
    'ilovepdf OR smallpdf alternative',
    '"pdf" "privacy" "upload" -is:retweet',
    '"annoying" "pdf" "upload"',
    '"pdf" "online" "free" "no account"',
  ],
  'Specific tools': [
    '"scan to pdf"',
    '"pdf to excel" OR "pdf to csv"',
    '"sign pdf" free',
    '"compress pdf" free',
    '"merge pdf" free',
    '"fill pdf form" free',
    '"pdf to word" free',
    '"ocr pdf" free',
    '"translate pdf"',
    '"chat with pdf" OR "ask pdf"',
  ],
  'Professional': [
    '"bates number" pdf',
    '"redline" pdf contract',
    '"legal document" pdf free',
    '"invoice" pdf extract',
    '"receipt" scan expense',
  ],
};

// Flatten with group tracking
const ALL_KEYWORDS = [];
for (const [group, keywords] of Object.entries(KEYWORD_GROUPS)) {
  for (const kw of keywords) {
    ALL_KEYWORDS.push({ query: kw, group });
  }
}

export async function GET(request) {
  const client = new TwitterApi({
    appKey:       process.env.X_API_KEY,
    appSecret:    process.env.X_API_SECRET,
    accessToken:  process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  });

  const url   = new URL(request.url);
  const kidx  = +(url.searchParams.get('k') || 0) % ALL_KEYWORDS.length;
  const { query, group } = ALL_KEYWORDS[kidx];
  const fullQuery = query + ' -is:retweet lang:en';

  try {
    const response = await client.v2.search(fullQuery, {
      max_results: 15,
      'tweet.fields': ['created_at', 'author_id', 'public_metrics', 'conversation_id'],
      'user.fields':  ['name', 'username', 'profile_image_url', 'public_metrics', 'verified'],
      expansions:     ['author_id'],
    });

    const tweets  = response.data?.data || [];
    const users   = response.data?.includes?.users || [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const results = tweets.map(t => ({
      id:        t.id,
      text:      t.text,
      createdAt: t.created_at,
      metrics:   t.public_metrics,
      author:    userMap[t.author_id] || { name: 'Unknown', username: 'unknown' },
      url:       `https://twitter.com/${userMap[t.author_id]?.username}/status/${t.id}`,
    }));

    return Response.json({
      tweets: results,
      keyword: query,
      group,
      keywordIndex: kidx,
      totalKeywords: ALL_KEYWORDS.length,
      groups: Object.keys(KEYWORD_GROUPS),
      groupCounts: Object.fromEntries(Object.entries(KEYWORD_GROUPS).map(([g, kws]) => [g, kws.length])),
    });

  } catch (err) {
    console.error('X search error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
