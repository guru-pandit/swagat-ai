import OpenAI from 'openai';
import { knowledgeBaseModel } from '../models';
import { env } from '../config/env';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// Fetch the knowledge base from DB and format context for the AI
async function buildSystemPrompt(): Promise<string> {
    const kb = await knowledgeBaseModel.findMany({ take: 50 });
    const kbText = kb.map(e => {
        return `Q: ${e.question}\nA: ${e.answer}`
    }).join('\n\n');

    return `You are Disha, the AI receptionist for this office.
    You are friendly, concise, and professional.
    Answer only questions you know from the context below.
    If unsure, say "Let me check with the reception team."

    KNOWLEDGE BASE:
    ${kbText}`;
}

export const aiService = {
    async chat(message: string) {
        const systemPrompt = await buildSystemPrompt();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Cheap and fast for kiosk queries
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message.trim() }],
            max_tokens: 300
        })
        return completion.choices[0]?.message.content ?? '';
    },

    // Stream version for the staff dashboard (real-time typing effect)
    async* stream(prompt: string) {
        const systemPrompt = await buildSystemPrompt();
        const stream = await openai.chat.completions.create({
            model: 'gpt-4o-mini', stream: true,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        });

        for await (const chunk of stream) {
            yield chunk.choices[0]?.delta?.content || ''
        }
    }
}
