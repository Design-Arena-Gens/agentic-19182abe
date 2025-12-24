"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const systemSummary = `Grok is xAI's conversational model. It excels at delivering grounded, engaging answers with a touch of humor while staying helpful and concise.`;

const defaultAssistantMessage: ChatMessage = {
  id: "assistant-welcome",
  role: "assistant",
  content:
    "Hey there! I'm Grok, your xAI companion. Ask me anything—from quick summaries to ambitious brainstorming—and I'll do my best to help.",
};

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([defaultAssistantMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState(0.6);

  const viewportRef = useRef<HTMLDivElement>(null);
  const isInputDisabled = isLoading;

  useEffect(() => {
    if (!viewportRef.current) {
      return;
    }

    viewportRef.current.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const canSend = input.trim().length > 0 && !isLoading;
  const placeholder = useMemo(
    () =>
      `Share your question. ${systemSummary}`,
    []
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) {
      return;
    }

    const trimmed = input.trim();
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          temperature,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = typeof payload?.error === "string" ? payload.error : "Unexpected response from Grok.";
        throw new Error(message);
      }

      const assistantResponse = String(payload?.content ?? "").trim();

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: assistantResponse.length > 0 ? assistantResponse : "I had trouble generating a reply. Could you try again?",
        },
      ]);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to reach Grok.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && canSend) {
      event.preventDefault();
      const form = event.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="badge">Grok + Next.js</div>
        <div>
          <h1>Your Grok Playground</h1>
          <p>{systemSummary}</p>
        </div>
      </header>

      <div className="chat-card">
        <div ref={viewportRef} className="chat-viewport" aria-live="polite">
          {messages.map((message) => (
            <article key={message.id} className={`chat-line chat-line-${message.role}`}>
              <span className="chat-role">{message.role === "user" ? "You" : "Grok"}</span>
              <p>{message.content}</p>
            </article>
          ))}
        </div>

        <form className="chat-input" onSubmit={handleSubmit}>
          <div className="composer">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              aria-label="Ask Grok"
              disabled={isInputDisabled}
              rows={3}
            />
            <div className="composer-actions">
              <button type="submit" disabled={!canSend}>
                {isLoading ? "Thinking..." : "Send"}
              </button>
            </div>
          </div>

          <div className="controls">
            <label>
              <span>Temperature</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={(event) => setTemperature(Number(event.target.value))}
                disabled={isLoading}
              />
              <span className="value">{temperature.toFixed(1)}</span>
            </label>
          </div>
        </form>

        {error && <p className="error">{error}</p>}
      </div>

      <footer className="page-footer">
        <p>
          Configure your Grok API key with the <code>GROK_API_KEY</code> environment variable.{" "}
          The optional <code>GROK_MODEL</code> and <code>GROK_SYSTEM_PROMPT</code> variables let you customize
          behaviour.
        </p>
      </footer>
    </div>
  );
}
