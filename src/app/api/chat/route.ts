import { NextRequest, NextResponse } from "next/server";

type RawMessage = {
  role: string;
  content: string;
};

type GrokMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const DEFAULT_SYSTEM_PROMPT =
  process.env.GROK_SYSTEM_PROMPT ??
  "You are Grok, xAI's conversational assistant. Provide helpful, accurate answers with wit when appropriate.";

const GROK_API_URL = process.env.GROK_API_URL ?? "https://api.x.ai/v1/chat/completions";
const GROK_MODEL = process.env.GROK_MODEL ?? "grok-beta";

function normalizeMessages(messages: RawMessage[] | undefined): GrokMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("A non-empty messages array is required.");
  }

  const allowedRoles = new Set(["user", "assistant", "system"]);

  return messages.map((message, index) => {
    const role = typeof message?.role === "string" ? message.role.toLowerCase() : "";
    const content = typeof message?.content === "string" ? message.content : "";

    if (!allowedRoles.has(role)) {
      throw new Error(`Message ${index + 1} has an invalid role.`);
    }

    if (!content.trim()) {
      throw new Error(`Message ${index + 1} is empty.`);
    }

    return {
      role: role as GrokMessage["role"],
      content,
    };
  });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfiguration: GROK_API_KEY is not set." },
      { status: 500 }
    );
  }

  let body: { messages?: RawMessage[]; temperature?: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  let preparedMessages: GrokMessage[];

  try {
    preparedMessages = normalizeMessages(body.messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid message payload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const temperature = typeof body.temperature === "number" ? Math.min(Math.max(body.temperature, 0), 1) : 0.6;

  const payload = {
    model: GROK_MODEL,
    temperature,
    messages: [
      { role: "system", content: DEFAULT_SYSTEM_PROMPT },
      ...preparedMessages,
    ],
    stream: false,
  };

  try {
    const response = await fetch(GROK_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = typeof data?.error === "string" ? data.error : "Failed to generate a response from Grok.";
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const content: string =
      data?.choices?.[0]?.message?.content ??
      data?.output?.[0]?.content ??
      data?.message?.content ??
      "";

    return NextResponse.json({ content, usage: data?.usage ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request to Grok failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
