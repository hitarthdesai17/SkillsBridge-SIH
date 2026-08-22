import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const results: any = {
    gemini: { configured: false, working: false, details: '' },
    openai: { configured: false, working: false, details: '' }
  };

  // 1. Test Gemini API Key
  if (geminiKey && geminiKey.trim().length > 10 && !geminiKey.includes('your-gemini-api-key')) {
    results.gemini.configured = true;
    try {
      // Try gemini-2.5-flash first, then gemini-flash-latest
      let response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with JSON: {"status": "ok"}' }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );

      if (!response.ok) {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Respond with JSON: {"status": "ok"}' }] }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );
      }

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        results.gemini.working = true;
        results.gemini.details = `SUCCESS! Gemini responded: ${text}`;
      } else {
        const errText = await response.text();
        results.gemini.working = false;
        results.gemini.details = `FAILED (HTTP ${response.status}): ${errText}`;
      }
    } catch (err: any) {
      results.gemini.working = false;
      results.gemini.details = `ERROR: ${err.message}`;
    }
  } else {
    results.gemini.details = 'GEMINI_API_KEY is missing or unconfigured in .env.local';
  }

  // 2. Test OpenAI API Key
  if (openAiKey && openAiKey.startsWith('sk-') && !openAiKey.includes('your-openai-api-key')) {
    results.openai.configured = true;
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Respond with JSON: {"status": "ok"}' }],
          response_format: { type: 'json_object' }
        })
      });

      if (response.ok) {
        const json = await response.json();
        results.openai.working = true;
        results.openai.details = `SUCCESS! OpenAI gpt-4o-mini responded.`;
      } else {
        const errText = await response.text();
        results.openai.working = false;
        results.openai.details = `FAILED (HTTP ${response.status}): ${errText}`;
      }
    } catch (err: any) {
      results.openai.working = false;
      results.openai.details = `ERROR: ${err.message}`;
    }
  } else {
    results.openai.details = 'OPENAI_API_KEY is missing or default in .env.local';
  }

  return NextResponse.json({
    status: results.gemini.working || results.openai.working ? 'LIVE AI WORKING' : 'USING GROUND-TRUTH FALLBACK',
    results
  });
}
