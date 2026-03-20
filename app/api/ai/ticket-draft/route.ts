import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractToken } from "@/lib/auth";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  const token = extractToken(request.headers.get("Authorization"));
  const payload = token ? verifyToken(token) : null;
  if (!payload || !["admin", "support_admin"].includes(payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { subject, description, type } = await request.json();
  if (!subject || !description)
    return NextResponse.json(
      { error: "subject and description required" },
      { status: 400 }
    );

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful support agent at AI APP LABS, a digital agency platform. Write concise, professional, and friendly support responses. Be empathetic, clear, and actionable. Keep responses under 100 words. Do NOT include a subject line, greeting with a name placeholder, or sign-off with [Your Name] or similar placeholders. Just write the body of the response.",
        },
        {
          role: "user",
          content: `Draft a response to this client ticket:\nType: ${type}\nSubject: ${subject}\nDescription: ${description}`,
        },
      ],
      max_tokens: 250,
      temperature: 0.7,
    });

    const draft = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 500 }
    );
  }
}
