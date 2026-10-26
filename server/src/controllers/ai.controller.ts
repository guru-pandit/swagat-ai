import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';

export const aiController = {
    // POST /api/ai/chat
    async chat(req: Request, res: Response) {
        const { message } = req.body;
        if (typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ success: false, error: 'A message is required.' });
        }
        const reply = await aiService.chat(message);
        res.json({ success: true, data: { reply } });
    },

    // GET /api/ai/stream?messages=...
    async stream(req: Request, res: Response) {
        const prompt = req.query.message;
        if (typeof prompt !== 'string' || !prompt.trim()) {
            res.status(400).json({ success: false, error: 'A message is required.' });
            return;
        }

        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        // Stream one validated prompt; never parse arbitrary JSON from a URL parameter.
        try {
            for await (const chunk of aiService.stream(prompt)) {
                if (res.destroyed) return;
                res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            }
            res.end();
        } catch {
            // Headers are already sent for SSE, so report a stream error as an SSE event.
            if (!res.destroyed) {
                res.write(`event: error\ndata: ${JSON.stringify({ error: 'The assistant could not respond.' })}\n\n`);
                res.end();
            }
        }
    }
}
