export async function POST(request) {
  const { tweet, tone } = await request.json();
  if (!tweet) return Response.json({ error: 'Missing tweet' }, { status: 400 });

  const PRODUCT = `
RightPDFKit (rightpdfkit.com) — 51 free PDF tools in your browser. Built by a solo founder in London.

CORE DIFFERENTIATOR: Files NEVER leave your device. No server, no upload, no account. Architecturally impossible — there is no endpoint to send files to. Open DevTools Network tab while using it — zero requests during processing.

SOCIAL PROOF: 63,000+ page views in a few weeks. Zero paid ads. Purely organic.

KEY TOOLS:
- Merge, Split, Compress, Rotate, Reorder pages
- Sign PDF (draw/type/upload signature)
- eSign + Certificate (SHA-256 hash, tamper-evident)
- OCR (extract text from scanned PDFs) — FREE unlike competitors
- PDF to Word, PDF to Excel/CSV — FREE
- Fill PDF Forms (text, checkboxes, dropdowns)
- Smart Form Fill (AI fills form conversationally)
- Scan to PDF (camera → perspective correction → PDF)
- Receipt Scanner (scan → expenses CSV)
- Scan to Data (camera → structured table)
- Bulk Extractor (20 PDFs → one spreadsheet)
- Form Creator (describe it → AI builds a PDF form)
- PDF Chat (ask questions about your PDF)
- PDF Translate (translate to any language)
- PDF Summariser (structured/brief/executive summary)
- Bates Numbering (legal reference stamps)
- PDF Redline (tracked changes)
- Compare PDFs (word-level diff)
- Word to PDF (docx → PDF locally)
- Image to PDF (JPG/PNG → PDF, drag to reorder)
- Watermark, Page Numbers, Header/Footer
- Protect, Unlock, Password Strength Checker
- Repair PDF, N-up Print, QR Stamp
- AI Assistant (natural language commands)
- Works offline after first load

vs iLovePDF: iLovePDF uploads every file, has intrusive ads, 25MB limit, daily task caps
vs Smallpdf: uploads every file, £12/month for pro, limited free tools
vs Adobe: uploads everything, £14.99/month, account required
RightPDFKit: zero uploads, free forever, no limits, no account
`;

  const toneInstructions = {
    genuine: 'Sound like a real founder sharing something genuinely useful. Conversational, not salesy.',
    technical: 'Lead with the technical angle — local processing, WebAssembly, architecturally impossible to upload.',
    privacy: 'Lead with the privacy angle — files never leave their device, no server, no upload risk.',
    feature: 'Highlight one specific feature that directly matches what they tweeted about.',
  };

  const selectedTone = toneInstructions[tone] || toneInstructions.genuine;

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
        max_tokens: 250,
        system: `You write short genuine replies to tweets on behalf of a solo founder promoting RightPDFKit.

PRODUCT:
${PRODUCT}

TONE: ${selectedTone}

RULES:
- Max 240 characters INCLUDING rightpdfkit.com
- Sound like a real person, not marketing copy
- Pick ONE specific relevant feature based on their tweet
- Map tweet topics to features:
  * legal/contracts → eSign + Certificate, Bates Numbering, Redline
  * scanning/camera → Scan to PDF, Receipt Scanner  
  * privacy/security → "files never leave your device", zero uploads
  * AI/productivity → AI Assistant, PDF Chat, Smart Form Fill
  * Excel/data → PDF to Excel/CSV, Bulk Extractor
  * signing → Sign PDF, eSign + Certificate
  * forms → Fill PDF Form, Form Creator
  * translating → PDF Translate
  * summarising → PDF Summariser
  * Word/docs → Word to PDF
  * images → Image to PDF
  * general/building → privacy angle + 51 free tools
  * ilovepdf/smallpdf complaints → "your files never leave your device"
- Always end with: rightpdfkit.com
- Don't start with "Hey", "Hi", "Great", or "Wow"
- Write in first person as the founder
- Output ONLY the reply text, nothing else`,
        messages: [{
          role: 'user',
          content: `Write a reply to:\n\n"${tweet.text}"\n\nBy @${tweet.author?.username}`
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
