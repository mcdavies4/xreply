// POST /api/reply
// Posts a reply to a tweet via X API

import { TwitterApi } from 'twitter-api-v2';

export async function POST(request) {
  const { tweetId, text } = await request.json();

  if (!tweetId || !text) {
    return Response.json({ error: 'Missing tweetId or text' }, { status: 400 });
  }
  if (text.length > 280) {
    return Response.json({ error: 'Reply too long (max 280 chars)' }, { status: 400 });
  }

  const client = new TwitterApi({
    appKey:      process.env.X_API_KEY,
    appSecret:   process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  });

  try {
    const result = await client.v2.reply(text, tweetId);
    return Response.json({ success: true, id: result.data.id });
  } catch (err) {
    console.error('X reply error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
