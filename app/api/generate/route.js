// POST /api/generate
// Takes a tweet and generates a personalised reply using Claude

export async function POST(request) {
  const { tweet } = await request.json();
  if (!tweet) return Response.json({ error: 'Missing tweet' }, { status: 400 });

  const PRODUCT = `RightPDFKit — 35 free PDF tools that run entirely in your browser. 
No uploads, no account, no server. Your files never leave your device.
Key tools: merge, split, compress, sign, OCR, redact, PDF to Word, AI commands.
AI assistant: type natural language like "compress this, watermark CONFIDENTIAL" and it does it locally.
URL: rightpdfkit.com`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: `You write short, genuine, friendly replies to tweets on behalf of a founder.
The founder is promoting their product: ${PRODUCT}

Rules:
- Max 250 characters including the URL
- Sound like a real founder, not a bot
- Mention one specific relevant feature based on what they tweeted
- Always end with: rightpdfkit.com
- Don't start with "Hey" or "Hi"
- Don't be salesy — be helpful and genuine
- Reply in first person as the builder
- Only output the reply text, nothing else`,
        messages: [{
          role: 'user',
          content: `Write a reply to this tweet:\n\n"${tweet.text}"\n\nBy @${tweet.author?.username}`
        }]
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text?.trim() || '';
    return Response.json({ reply });
  } catch (err) {
    console.error('Claude error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
