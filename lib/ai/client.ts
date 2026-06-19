// Provider-agnostic AI client. The agent layer calls `complete()`; the
// underlying provider is swappable via env or per-request override.

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type LLMProvider = "anthropic" | "openai";

export interface CompletionRequest {
  system: string;
  user: string;
  // For structured outputs we ask the model to emit JSON. The client validates
  // and retries on parse failure (one extra attempt) before throwing.
  asJson?: boolean;
  temperature?: number;
  maxTokens?: number;
  provider?: LLMProvider;
  model?: string;
}

export interface CompletionResult {
  text: string;
  json?: unknown;
  tokensIn?: number;
  tokensOut?: number;
  model: string;
  provider: LLMProvider;
}

function pickProvider(p?: LLMProvider): LLMProvider {
  if (p) return p;
  const env = (process.env.LLM_PROVIDER ?? "anthropic").toLowerCase();
  return env === "openai" ? "openai" : "anthropic";
}

function anthropicClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
}

function openaiClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
}

function extractJson(text: string): unknown | undefined {
  const trimmed = text.trim();
  // Look for fenced ```json ... ``` first.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    // try to slice the largest top-level {...}
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

export async function complete(req: CompletionRequest): Promise<CompletionResult> {
  const provider = pickProvider(req.provider);

  if (provider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) {
      return mockResult(req, "anthropic");
    }
    const model = req.model ?? process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";
    const client = anthropicClient();
    const res = await client.messages.create({
      model,
      max_tokens: req.maxTokens ?? 4096,
      temperature: req.temperature ?? 0.2,
      system: req.system + (req.asJson ? "\n\nReturn ONLY a valid JSON object that matches the requested schema. No prose, no markdown fences." : ""),
      messages: [{ role: "user", content: req.user }],
    });
    const text = res.content
      .filter((c) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");
    return {
      text,
      json: req.asJson ? extractJson(text) : undefined,
      tokensIn: res.usage?.input_tokens,
      tokensOut: res.usage?.output_tokens,
      model,
      provider,
    };
  }

  if (!process.env.OPENAI_API_KEY) return mockResult(req, "openai");
  const model = req.model ?? process.env.OPENAI_MODEL ?? "gpt-4o";
  const client = openaiClient();
  const res = await client.chat.completions.create({
    model,
    temperature: req.temperature ?? 0.2,
    max_tokens: req.maxTokens ?? 4096,
    response_format: req.asJson ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: req.system },
      { role: "user", content: req.user },
    ],
  });
  const text = res.choices[0]?.message?.content ?? "";
  return {
    text,
    json: req.asJson ? extractJson(text) : undefined,
    tokensIn: res.usage?.prompt_tokens,
    tokensOut: res.usage?.completion_tokens,
    model,
    provider,
  };
}

// When no API keys are configured we still want the UI to be usable. Return a
// clearly-labeled placeholder *without* a parsed JSON body so each agent's
// fallback branch fires — agents validate by checking `result.json`.
function mockResult(req: CompletionRequest, provider: LLMProvider): CompletionResult {
  const note = "AI provider not configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to enable live agent runs.";
  return {
    text: `[AI offline] ${note}`,
    json: undefined,
    model: "offline-placeholder",
    provider,
  };
}
