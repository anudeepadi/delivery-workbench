import type { Express, Response } from "express";
import { Server } from "http";
import { storage } from "./storage";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const SYSTEM_PROMPT = `You are the assistant in Delivery Workbench, helping delivery and program managers reason about their plans.

You operate like a Gemini-powered delivery terminal: precise, data-driven, structured.

Your thinking model applies 5 layers to every response:
1. System Architecture — Structure, dependencies, design
2. Business & Ops Impact — Revenue, margin, risk  
3. Risk & Trade-offs — Options, constraints, mitigations
4. Metrics & KPIs — Formulas, targets, owners
5. Execution Framework — Playbook, governance, actions

Response rules:
- Executive summaries: 2-4 sentences, direct, no padding
- Formula rule: include formula + 2 worked examples when relevant
- Decision support: always offer Conservative / Balanced / Strategic options
- When asked about code: provide clean, production-ready examples
- Connect every technical decision to a measurable business outcome
- Use markdown formatting with headers, tables, and code blocks

You have deep expertise in: Enterprise Program Delivery, SAFe/Agile@Scale, Big Data & Analytics, AI Transformation Strategy, KPI-Driven Delivery, Technology Architecture, Gemini Workflow Design, Cloud Infrastructure (AWS/GCP), Python/FastAPI, Docker, AI Agent Systems.`;

function writeSse(res: Response, payload: unknown) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toGeminiContents(history: { role: "user" | "assistant"; content: string }[]) {
  return history.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function extractGeminiText(payload: any) {
  const texts =
    payload?.candidates?.flatMap((candidate: any) =>
      (candidate?.content?.parts ?? [])
        .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
        .filter(Boolean),
    ) ?? [];

  return texts.join("");
}

function parseSsePayload(rawEvent: string) {
  const data = rawEvent
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n")
    .trim();

  if (!data || data === "[DONE]") {
    return null;
  }

  return data;
}

async function streamGeminiResponse(
  history: { role: "user" | "assistant"; content: string }[],
  onDelta: (delta: string) => void,
) {
  const res = await fetch(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_MODEL)}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY || "",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: toGeminiContents(history),
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Gemini request failed with status ${res.status}`);
  }

  if (!res.body) {
    throw new Error("Gemini response stream was empty");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flushEvent = (rawEvent: string) => {
    const payload = parseSsePayload(rawEvent);
    if (!payload) {
      return;
    }

    const parsed = JSON.parse(payload);
    const text = extractGeminiText(parsed);
    if (text) {
      onDelta(text);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true }).replaceAll("\r\n", "\n");
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      flushEvent(event);
    }
  }

  if (buffer.trim()) {
    flushEvent(buffer);
  }
}

export async function registerRoutes(httpServer: Server, app: Express) {
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, provider: "gemini", model: GEMINI_MODEL });
  });

  app.get("/api/bootstrap", async (_req, res) => {
    const data = await storage.getBootstrap();
    res.json(data);
  });

  app.get("/api/chat/sessions", async (_req, res) => {
    const sessions = await storage.listChatSessions();
    res.json(sessions);
  });

  app.post("/api/chat/sessions", async (req, res) => {
    const session = await storage.createChatSession(req.body ?? {});
    res.status(201).json(session);
  });

  // Get messages
  app.get("/api/messages/:sessionId", async (req, res) => {
    await storage.ensureChatSession(req.params.sessionId);
    const msgs = await storage.getMessages(req.params.sessionId);
    res.json(msgs);
  });

  app.get("/api/tools/:toolId/draft", async (req, res) => {
    const draft = await storage.getToolDraft(req.params.toolId);
    res.json(draft);
  });

  app.put("/api/tools/:toolId/draft", async (req, res) => {
    const { payload } = req.body as { payload: unknown };
    const draft = await storage.saveToolDraft(req.params.toolId, payload ?? null);
    res.json(draft);
  });

  // Clear session
  app.delete("/api/messages/:sessionId", async (req, res) => {
    await storage.clearSession(req.params.sessionId);
    res.json({ ok: true });
  });

  // Stream chat (SSE)
  app.post("/api/chat", async (req, res) => {
    const { message, sessionId } = req.body as { message: string; sessionId: string };
    if (!message || !sessionId) {
      return res.status(400).json({ error: "message and sessionId required" });
    }

    await storage.ensureChatSession(sessionId, {
      source: "Gemini panel",
    });

    // Store user message
    await storage.addMessage({ role: "user", content: message, sessionId });

    // Get history for context
    const history = await storage.getMessages(sessionId);
    const msgs = history.slice(-20).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let fullResponse = "";

    try {
      if (!process.env.GEMINI_API_KEY) {
        // Demo mode — streaming mock response
        const demoLines = [
          "# Delivery Workbench — Demo Mode\n\n",
          `**Gemini API key not configured.** Live mode defaults to \`${GEMINI_MODEL}\`.\n\n`,
          "1. Set `GEMINI_API_KEY` in your environment\n",
          `2. Optionally set \`GEMINI_MODEL\` (default: \`${GEMINI_MODEL}\`)\n`,
          "3. Restart the server\n\n",
          "---\n\n",
          "**Your message received:** `" + message + "`\n\n",
          "In live mode, I'll provide:\n",
          "- Structured analysis across 5 thinking layers\n",
          "- KPI formulas with worked examples\n",
          "- Conservative / Balanced / Strategic decision options\n",
          "- Production-ready code and architecture guidance\n",
          "- Responses streamed into the local SQLite-backed workspace\n",
        ];

        for (const line of demoLines) {
          fullResponse += line;
          writeSse(res, { delta: line });
          await sleep(80);
        }
      } else {
        await streamGeminiResponse(msgs, (delta) => {
          fullResponse += delta;
          writeSse(res, { delta });
        });
      }
    } catch (err: any) {
      const errMsg = `\n\n**Error:** ${err.message || "Unknown error"}`;
      fullResponse += errMsg;
      writeSse(res, { delta: errMsg });
    }

    // Store assistant response
    if (fullResponse) {
      await storage.addMessage({ role: "assistant", content: fullResponse, sessionId });
    }

    writeSse(res, { done: true });
    res.end();
  });
}
