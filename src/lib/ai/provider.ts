import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { intentNote, SYSTEM_PROMPT } from "./prompt";
import type { ChatMessage, Intent } from "./types";

/**
 * Provider abstraction. Sukoon talks to an LLM only through this interface,
 * so a different model or vendor can be swapped in without touching the UI.
 */
export interface ReflectionProvider {
  readonly name: string;
  /** `opener` is the question the app showed before the person's first message. */
  reply(messages: ChatMessage[], intent: Intent, opener?: string): Promise<string>;
}

export class ProviderError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

class ClaudeProvider implements ReflectionProvider {
  readonly name = "claude";
  private client: Anthropic;
  private model: string;
  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 });
    this.model = model;
  }

  async reply(messages: ChatMessage[], intent: Intent, opener?: string): Promise<string> {
    const context = intentNote(intent) + (opener ? ` The app opened the conversation by asking: "${opener}"` : "");
    try {
      const res = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: 16000,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }, { type: "text", text: context }],
        // Short conversational replies: low effort keeps latency and cost down.
        output_config: { effort: "low" },
        // If a safety classifier declines, let the API retry on a suitable fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      if (res.stop_reason === "refusal") {
        return "I’m not able to help with that here. If something difficult is going on, please reach out to someone you trust or a qualified professional.";
      }
      const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
      if (!text) throw new ProviderError("The companion returned an empty reply.");
      return text;
    } catch (e) {
      if (e instanceof ProviderError) throw e;
      if (e instanceof Anthropic.AuthenticationError) throw new ProviderError("The AI service is misconfigured (invalid API key).", 503);
      if (e instanceof Anthropic.RateLimitError) throw new ProviderError("The companion is busy right now. Please try again in a minute.", 429);
      if (e instanceof Anthropic.BadRequestError) throw new ProviderError("The companion couldn’t process that message.", 400);
      if (e instanceof Anthropic.APIError) throw new ProviderError("The AI service is temporarily unavailable.", 503);
      throw new ProviderError("Could not reach the AI service.", 503);
    }
  }
}

export function getProvider(): ReflectionProvider | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new ClaudeProvider(key, process.env.ANTHROPIC_MODEL || "claude-opus-5-5");
}
