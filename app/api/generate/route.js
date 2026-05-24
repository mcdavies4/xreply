// POST /api/generate
// Generates a personalised reply using Claude — trained on all 40 tools

export async function POST(request) {
  const { tweet } = await request.json();
  if (!tweet) return Response.json({ error: 'Missing tweet' }, { status: 400 });

  const PRODUCT = `
RightPDFKit (rightpdfkit.com) — 40 free PDF tools that run entirely in your browser.
Your files NEVER leave your device. No uploads. No server. No account. Works offline.

CORE DIFFERENTIATOR: Files are processed locally using pdf-lib and PDF.js (WebAssembly).
There is no server endpoint — it is architecturally impossible for files to be intercepted.

KEY TOOLS BY CATEGORY:

Organise: Merge PDFs, Split PDF, Reorder Pages, Extract Pages, Delete Pages

Edit: Rotate Pages, Crop Pages, Add Image, Annotate, Redact (permanently), Header/Footer

Enhance: Watermark, Page Numbers, Compress

Security: Protect PDF (AES-128), Unlock PDF, Password Strength Checker

Analyse: OCR (Tesseract.js — extracts text from scans), PDF to Text, PDF Info, Preview, PDF to Images

Convert: PDF to Word (.docx), PDF to Excel/CSV (table extraction)

Legal/Professional: Bates Numbering (sequential legal stamps), PDF Redline (tracked changes), Compare PDFs (word-level diff, side by side)

Create: Scan to PDF (camera → auto edge detection → perspective correction → PDF, works on mobile)

Forms: Fill PDF Form (text fields, checkboxes, dropdowns, radio buttons), Flatten Forms

Transform: Insert Blank Page, Resize Pages, Grayscale, Edit Metadata, Sign PDF (draw/type/upload), Duplicate Page, N-up Print (2/4 pages per sheet), Repair PDF

AI Assistant: Natural language commands — type "compress this, watermark CONFIDENTIAL, add page numbers" and it does all three locally. Powered by Claude API, files still never leave device.

COMPARISON vs competitors:
- iLovePDF: uploads every file, has ads, 25MB limit, daily caps
- Smallpdf: uploads every file, £12/mo for pro, 25MB limit
- Adobe Online: uploads every file, £14.99/mo, account required
- RightPDFKit: ZERO uploads, free forever, no limits, no account, works offline

SOCIAL PROOF: 42,000+ page views in first few weeks, zero paid ads, purely organic
BUILT BY: Solo founder, London. The 36th Company Ltd.
`;

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
        system: `You write short, genuine, friendly replies to tweets on behalf of a founder promoting RightPDFKit.

PRODUCT INFO:
${PRODUCT}

RULES:
- Max 250 characters INCLUDING the URL rightpdfkit.com
- Sound like a real founder, not a bot or marketing copy
- Pick ONE specific feature that directly relates to what they tweeted about
- If they mention legal docs → mention Bates numbering or redline
- If they mention scanning/camera → mention Scan to PDF
- If they mention privacy/security → lead with "files never leave your device"
- If they mention AI → mention the AI assistant
- If they mention contracts/legal → mention compare PDFs or redline
- If they mention Excel/spreadsheets → mention PDF to CSV
- If they mention signing → mention Sign PDF
- If they mention forms → mention Fill PDF Form
- If they mention converting → mention PDF to Word
- If general building/productivity → mention the 40 free tools privacy angle
- Always end with: rightpdfkit.com
- Don't start with "Hey" or "Hi" or "Great"
- Don't be salesy — be genuinely helpful
- Write in first person as the founder
- Output ONLY the reply text, nothing else`,
        messages: [{
          role: 'user',
          content: `Write a reply to this tweet:\n\n"${tweet.text}"\n\nBy @${tweet.author?.username}\n\nPick the most relevant feature from RightPDFKit based on what they're talking about.`
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
