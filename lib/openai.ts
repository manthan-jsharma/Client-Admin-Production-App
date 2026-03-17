import OpenAI from 'openai';

// Initialize client lazily so missing key doesn't crash at import time
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

// Company / platform system prompt injected into every AI conversation
const SYSTEM_PROMPT = `You are an AI assistant embedded in BuildHub, a client project management platform used by a digital agency.

About the platform:
- Clients can view their project roadmap (14-day timeline), track daily progress, manage payments, upload setup items, and communicate with their agency admin.
- Admins manage multiple client projects, approve/reject signups, handle support tickets, manage services catalog, and monitor analytics.
- File sharing uses AWS S3. Authentication uses JWT tokens.
- The platform supports real-time chat with the admin and an AI assistant.

About the agency:
- We are a full-service digital agency specialising in web design, development, SEO, social media management, and digital marketing.
- Our standard project delivery is 14 days for web projects.
- Services include: Website Redesign, SEO Optimization, Social Media Management, Website Maintenance, and custom solutions.
- Payments are tracked per milestone inside the platform.

Your role:
- Answer questions about how to use the platform.
- Provide guidance on the client's project status when asked.
- Explain service offerings and pricing guidance.
- Help troubleshoot common issues (login, payments, file uploads).
- Be professional, friendly, and concise.
- Do NOT make up specific project data — tell users to check their dashboard for live data.
- If a question is outside your scope, suggest the user contact their admin directly.

You are only activated when a message contains "@AI". Always respond in plain text (no markdown).`;

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getAIResponse(
  userMessage: string,
  conversationHistory: AIChatMessage[] = []
): Promise<string> {
  const client = getClient();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.slice(-10), // last 10 messages for context
    { role: 'user', content: userMessage },
  ];

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 500,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content?.trim() ?? 'Sorry, I could not generate a response.';
}

export function extractAIQuery(message: string): string {
  // Remove @AI tag and trim
  return message.replace(/@AI\b/gi, '').trim();
}

export function isAITagged(message: string): boolean {
  return /@AI\b/i.test(message);
}
