// GET /api/tweets
// Searches X for tweets relevant to RightPDFKit

import { TwitterApi } from 'twitter-api-v2';

const KEYWORDS = [
  // Founder/builder community
  '"what are you building"',
  '"what did you ship"',
  '"build in public" "just shipped"',
  '"indie hacker" "working on"',
  '"side project" "just launched"',
  '"show your product"',
  // PDF pain points — high intent
  '"hate uploading" pdf',
  '"pdf tool" free',
  'ilovepdf OR smallpdf alternative',
  '"pdf" "privacy" "upload"',
  // Specific use cases we solve
  '"scan to pdf"',
  '"pdf to excel" OR "pdf to csv"',
  '"sign pdf" free',
  '"compress pdf" free',
  '"merge pdf" free',
  // Professional use cases
  '"bates number" pdf',
  '"redline" pdf contract',
];

export async function GET(request) {
  const client = new TwitterApi({
    appKey:       process.env.X_API_KEY,
    appSecret:    process.env.X_API_SECRET,
    accessToken:  process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  });

  try {
    const url = new URL(request.url);
    const kidx = +(url.searchParams.get('k') || 0) % KEYWORDS.length;
    const query = KEYWORDS[kidx] + ' -is:retweet lang:en';

    const response = await client.v2.search(query, {
      max_results: 10,
      'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
      'user.fields':  ['name', 'username', 'profile_image_url', 'public_metrics'],
      expansions:     ['author_id'],
    });

    const tweets = response.data?.data || [];
    const users  = response.data?.includes?.users || [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const results = tweets.map(t => ({
      id:        t.id,
      text:      t.text,
      createdAt: t.created_at,
      metrics:   t.public_metrics,
      author:    userMap[t.author_id] || { name: 'Unknown', username: 'unknown' },
      url:       `https://x.com/${userMap[t.author_id]?.username}/status/${t.id}`,
    }));

    return Response.json({ tweets: results, keyword: KEYWORDS[kidx], keywordIndex: kidx });
  } catch (err) {
    console.error('X search error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
