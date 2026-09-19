import { findRelevantSources } from './knowledge.js';

const MAX_MESSAGE_LENGTH = 1200;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({ error: 'ข้อความต้องมีความยาว 1–1200 ตัวอักษร' });
    }

    // Temporary compatibility with the existing Vercel secret. The key is only read server-side.
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'AI service is not configured' });

    const market = req.body?.market || {};
    const sources = findRelevantSources(message);
    const sourceContext = sources.length
        ? sources.map(source => `Source: ${source.title}\n${source.text}`).join('\n\n')
        : 'No first-party source matched this question.';
    const systemInstruction = `You are BoomTech AI, a helpful Thai-language assistant for BoomTech Gateway. The app is a Sandbox demo. Give educational information only, never financial, legal, or investment advice. Do not invent product facts. For questions about BoomTech, rely on the supplied sources and say when information is unavailable. Current market context: ${market.coinSymbol || 'N/A'}, price ${market.currentPrice ?? 'N/A'}, 24h ${market.priceChange ?? 'N/A'}%.\n\nBoomTech sources:\n${sourceContext}`;

    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
            }),
            signal: AbortSignal.timeout(20_000),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || 'Gemini request failed');
        const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
        if (!text) throw new Error('No response generated');
        return res.status(200).json({ text, sources: sources.map(({ id, title }) => ({ id, title })) });
    } catch (error) {
        console.error('[chat] Gemini request failed:', error.message);
        return res.status(502).json({ error: 'BoomTech AI ไม่สามารถตอบได้ในขณะนี้' });
    }
}
