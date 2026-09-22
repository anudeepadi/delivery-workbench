import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChatMessage, ChatSessionSummary } from "@shared/contracts";
import type { ShowToast } from "@/lib/toast";

interface Props {
  mode?: "panel" | "page";
  onClose?: () => void;
  closeLabel?: string;
  onResize?: () => void;
  resizeLabel?: string;
  showToast: ShowToast;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMd(text: string): string {
  return escapeHtml(text)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

const QUICK_PROMPTS = [
  "Analyze my delivery margin and give 3 improvement actions.",
  "Generate a risk assessment for a $10M program.",
  "Create a PI Planning readout template.",
  "Write a RED project executive status report.",
  "Compare T&M vs Fixed Price for a 500-day engagement.",
  "Build a 3-layer AI transformation roadmap.",
];

const EMPTY_STATE = {
  title: "Ready when you are",
  description:
    "Ask Gemini anything - your full conversation history is stored locally.",
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
}

export default function ClaudePanel({
  mode = "panel",
  onClose,
  closeLabel = "Close",
  onResize,
  resizeLabel = "Standard",
  showToast,
}: Props) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoCreateRef = useRef(false);
  const qc = useQueryClient();

  const { data: sessions = [] } = useQuery<ChatSessionSummary[]>({
    queryKey: ["/api/chat/sessions"],
    queryFn: () => fetchJson("/api/chat/sessions"),
    retry: false,
  });

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const source = mode === "page" ? "Gemini workspace" : "Gemini panel";

  const createSession = async (source: string) => {
    const res = await fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source }),
    });

    if (!res.ok) {
      const detail = (await res.text()).trim();
      throw new Error(detail || `Failed to create session: ${res.status}`);
    }

    const session = (await res.json()) as ChatSessionSummary;
    setActiveSessionId(session.id);
    await qc.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
    await qc.invalidateQueries({ queryKey: ["/api/bootstrap"] });
    return session;
  };

  const showCreateSessionError = (error: Error, retry: () => void) => {
    showToast({
      title: "Failed to create workspace site",
      description: error.message,
      tone: "error",
      action: {
        label: "Retry",
        onClick: retry,
      },
    });
  };

  const retryCreateSession = () => {
    autoCreateRef.current = true;
    void createSession(source).catch((error: Error) => {
      autoCreateRef.current = false;
      showCreateSessionError(error, retryCreateSession);
    });
  };

  const createSessionMutation = useMutation({
    mutationFn: () => createSession(source),
    onError: (error: Error) => {
      autoCreateRef.current = false;
      showCreateSessionError(error, retryCreateSession);
    },
  });

  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }

    if (sessions.length === 0 && !autoCreateRef.current) {
      retryCreateSession();
    }
  }, [activeSessionId, sessions, source]);

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    enabled: Boolean(activeSession?.id),
    queryKey: ["/api/messages", activeSession?.id],
    queryFn: () => fetchJson(`/api/messages/${activeSession?.id}`),
    retry: false,
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession?.id) return null;

      const res = await fetch(`/api/messages/${activeSession.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`Failed to clear session: ${res.status}`);
      }

      return res.json();
    },
    onSuccess: async () => {
      if (activeSession?.id) {
        await qc.invalidateQueries({
          queryKey: ["/api/messages", activeSession.id],
        });
      }
      await qc.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      await qc.invalidateQueries({ queryKey: ["/api/bootstrap"] });
      showToast("Conversation cleared");
    },
    onError: (error: Error) => showToast(error.message),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const ensureSessionId = async () => {
    if (activeSession?.id) return activeSession.id;
    const session = await createSession(source);
    return session.id;
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || streaming) return;

    setInput("");
    setStreaming(true);
    setStreamText("");

    try {
      const sessionId = await ensureSessionId();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId }),
      });

      if (!res.ok) {
        throw new Error(`Chat request failed: ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response stream returned");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));
            if (data.delta) {
              full += data.delta;
              setStreamText(full);
            }

            if (data.done) {
              await qc.invalidateQueries({
                queryKey: ["/api/messages", sessionId],
              });
              await qc.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
              await qc.invalidateQueries({ queryKey: ["/api/bootstrap"] });
              setStreamText("");
            }
          } catch {
            // Ignore malformed SSE fragments.
          }
        }
      }
    } catch (error: any) {
      showToast(`Error: ${error.message}`);
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className={`claude-panel ${mode === "page" ? "is-page" : ""}`}>
      <div className="assistant-rail">
        <div className="assistant-rail-header">
          <div>
            <div className="assistant-rail-title">Sessions</div>
            <div className="assistant-rail-subtitle">
              Stored in local SQLite
            </div>
          </div>
          <button
            className="ak-btn-secondary"
            onClick={() => createSessionMutation.mutate()}
          >
            New
          </button>
        </div>

        <div className="assistant-session-list">
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`assistant-session-item ${session.id === activeSession?.id ? "active" : ""}`}
              onClick={() => setActiveSessionId(session.id)}
            >
              <span className="assistant-session-title">{session.title}</span>
              <span className="assistant-session-preview">
                {session.preview}
              </span>
            </button>
          ))}
        </div>

        <div className="assistant-rail-footer">
          <span className="assistant-footnote">Gemini + SQLite workspace</span>
        </div>
      </div>

      <div className="assistant-body">
        <div className="assistant-header">
          <div>
            <div className="assistant-title">Gemini Workspace</div>
            <div className="assistant-subtitle">
              {streaming
                ? "Streaming from Gemini..."
                : activeSession?.title || "Persisted local conversation"}
            </div>
          </div>

          <div className="assistant-header-actions">
            {onResize && (
              <button
                className="ak-btn-secondary"
                onClick={onResize}
                data-testid="button-resize-claude"
              >
                Size: {resizeLabel}
              </button>
            )}
            <button
              className="ak-btn-secondary"
              onClick={() => clearMutation.mutate()}
              data-testid="button-clear-chat"
            >
              Clear
            </button>
            {onClose && (
              <button
                className="ak-btn-secondary"
                onClick={onClose}
                data-testid="button-close-claude"
              >
                {closeLabel}
              </button>
            )}
          </div>
        </div>

        <div className="assistant-thread">
          {messages.length === 0 && !streaming && (
            <div className="assistant-empty">
              <div className="assistant-empty-icon">◆</div>
              <div className="assistant-empty-title">{EMPTY_STATE.title}</div>
              <p>{EMPTY_STATE.description}</p>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className={
                msg.role === "user" ? "claude-msg-user" : "claude-msg-ai"
              }
              data-testid={`msg-${msg.role}-${msg.id}`}
            >
              {msg.role === "user" ? (
                <span>{msg.content}</span>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }}
                />
              )}
            </motion.div>
          ))}

          {streaming && streamText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="claude-msg-ai"
            >
              <div dangerouslySetInnerHTML={{ __html: renderMd(streamText) }} />
              <span
                className="cursor-blink"
                style={{ color: "var(--blue)", marginLeft: 2 }}
              >
                ▋
              </span>
            </motion.div>
          )}

          {streaming && !streamText && (
            <div
              className="claude-msg-ai"
              style={{
                color: "var(--sub)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ display: "flex", gap: 3 }}>
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "var(--purple)",
                      opacity: 0.7,
                      animation: "pulse-dot 1.2s ease-in-out infinite",
                      animationDelay: `${index * 0.2}s`,
                      display: "inline-block",
                    }}
                  />
                ))}
              </span>
              Thinking...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="assistant-composer">
          <AnimatePresence>
            {messages.length === 0 && !streaming && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="assistant-prompts"
              >
                <div className="assistant-prompts-label">Quick prompts</div>
                <div className="assistant-prompt-grid">
                  {QUICK_PROMPTS.map((prompt, index) => (
                    <button
                      key={prompt}
                      className="chip"
                      onClick={() => void sendMessage(prompt)}
                      data-testid={`quick-prompt-${index}`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="assistant-input-row">
            <textarea
              ref={textareaRef}
              className="ak-ta assistant-textarea"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Gemini... (↵ send, ⇧↵ newline)"
              rows={2}
              disabled={streaming}
              data-testid="input-claude-message"
            />
            <motion.button
              className="ak-btn-primary assistant-send-btn"
              onClick={() => void sendMessage()}
              disabled={streaming || !input.trim()}
              style={{
                opacity: streaming || !input.trim() ? 0.45 : 1,
              }}
              whileTap={{ scale: 0.96 }}
              data-testid="button-send-claude"
            >
              {streaming ? "…" : "↑"}
            </motion.button>
          </div>

          <div className="assistant-composer-meta">
            ↵ Send · ⇧↵ Newline · Local SQLite history · Gemini optional
          </div>
        </div>
      </div>
    </div>
  );
}
