# X Reply Assistant — RightPDFKit

Find tweets asking "what are you building?" and reply with one click.
Claude writes a personalised reply. You review, edit, and post.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Get X (Twitter) API credentials
1. Go to developer.twitter.com
2. Create a new app (or use existing)
3. Under "Keys and Tokens":
   - Copy **API Key** and **API Key Secret**
   - Generate **Access Token** and **Access Token Secret**
   - Make sure the app has **Read and Write** permissions

### 3. Get Anthropic API key
1. Go to console.anthropic.com
2. Create an API key

### 4. Set environment variables
Copy `.env.local.example` to `.env.local` and fill in:
```
X_API_KEY=...
X_API_SECRET=...
X_ACCESS_TOKEN=...
X_ACCESS_SECRET=...
ANTHROPIC_API_KEY=...
```

### 5. Run locally
```bash
npm run dev
```
Open http://localhost:3000

## Deploy to Vercel
1. Push to GitHub
2. Connect repo to Vercel
3. Add all 5 env vars in Vercel dashboard
4. Deploy

## How it works
1. Click a keyword tab to search for relevant tweets
2. Click "✦ Generate AI reply" on any tweet
3. Review and edit the reply (Claude personalises it)
4. Click "↑ Post reply" to send from your account
5. Tweet is auto-dismissed so you don't see it again

## Keywords monitored
- "what are you building"
- "what did you ship"
- "show me your project"
- "side project launched"
- "build in public shipped"
- "indie hacker working on"
- "show your product"
- "what are you working on founder"

## Notes
- Dismissed tweets are stored in localStorage (per browser)
- X free tier: 500 posts/month, 100 searches/month
- Replies come from your own account (X_ACCESS_TOKEN)
- Always review before posting — you're in control
