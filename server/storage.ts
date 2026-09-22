import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { DatabaseSync } from "node:sqlite";
import type {
  BootstrapData,
  ChatMessage,
  ChatSessionSummary,
  CreateChatSessionInput,
  DashboardHighlight,
  DashboardStat,
  InsertChatMessage,
  ModuleAvailability,
  ModuleId,
  NavigationItem,
  NavigationSection,
  RoadmapItem,
  ToolDraftRecord,
  Tone,
  WorkspaceIdentity,
} from "@shared/contracts";

interface ModuleSeedRow {
  id: ModuleId;
  sectionId: string;
  sectionLabel: string;
  sectionOrder: number;
  itemOrder: number;
  label: string;
  icon: string;
  description: string;
  accent: Tone;
  availability: ModuleAvailability;
}

interface ModuleRow extends ModuleSeedRow {}

interface AppStateRow {
  value: string;
}

interface DraftRow {
  tool_id: string;
  payload: string;
  updated_at: string;
}

interface SessionRow {
  id: string;
  title: string;
  source: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface MessageRow {
  id: number;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

const DB_PATH = resolve(process.cwd(), process.env.SQLITE_DB_PATH ?? "data/akb1.sqlite");

const MODULES: ModuleSeedRow[] = [
  {
    id: "brief",
    sectionId: "overview",
    sectionLabel: "Overview",
    sectionOrder: 1,
    itemOrder: 1,
    label: "Brief",
    icon: "⚡",
    description: "Workspace summary, quick actions, and system posture.",
    accent: "brand",
    availability: "ready",
  },
  {
    id: "claude",
    sectionId: "ai",
    sectionLabel: "AI",
    sectionOrder: 2,
    itemOrder: 1,
    label: "Gemini Workspace",
    icon: "◆",
    description: "Gemini chat workspace with persisted local session history.",
    accent: "brand",
    availability: "ready",
  },
  {
    id: "prompt",
    sectionId: "ai",
    sectionLabel: "AI",
    sectionOrder: 2,
    itemOrder: 2,
    label: "Prompt Lab",
    icon: "🔮",
    description: "Prompt patterns and analyzer scoring for delivery prompts.",
    accent: "warning",
    availability: "ready",
  },
  {
    id: "builder",
    sectionId: "ai",
    sectionLabel: "AI",
    sectionOrder: 2,
    itemOrder: 3,
    label: "Prompt Builder",
    icon: "💡",
    description: "Assemble structured prompts from role, task, format, and constraints.",
    accent: "success",
    availability: "ready",
  },
  {
    id: "arsenal",
    sectionId: "ai",
    sectionLabel: "AI",
    sectionOrder: 2,
    itemOrder: 4,
    label: "Gemini Stack",
    icon: "🤖",
    description: "Gemini runtime profiles and local platform routing guide.",
    accent: "muted",
    availability: "ready",
  },
  {
    id: "kpi",
    sectionId: "analytics",
    sectionLabel: "Analytics",
    sectionOrder: 3,
    itemOrder: 1,
    label: "KPI Engine",
    icon: "📊",
    description: "Interactive delivery, quality, and finance KPI calculators.",
    accent: "success",
    availability: "ready",
  },
  {
    id: "decision",
    sectionId: "analytics",
    sectionLabel: "Analytics",
    sectionOrder: 3,
    itemOrder: 2,
    label: "Decision Matrix",
    icon: "⚖",
    description: "Option framing and trade-off guidance for delivery decisions.",
    accent: "brand",
    availability: "ready",
  },
  {
    id: "risk",
    sectionId: "analytics",
    sectionLabel: "Analytics",
    sectionOrder: 3,
    itemOrder: 3,
    label: "Risk Matrix",
    icon: "⚠",
    description: "Persisted 5x5 risk register and heatmap workflow.",
    accent: "danger",
    availability: "ready",
  },
  {
    id: "sprint",
    sectionId: "delivery",
    sectionLabel: "Delivery",
    sectionOrder: 4,
    itemOrder: 1,
    label: "Sprint Planner",
    icon: "📅",
    description: "PI capacity planning and sprint distribution modeling.",
    accent: "success",
    availability: "ready",
  },
  {
    id: "estimate",
    sectionId: "delivery",
    sectionLabel: "Delivery",
    sectionOrder: 4,
    itemOrder: 2,
    label: "Estimation",
    icon: "🧮",
    description: "PERT, T-shirt sizing, and forecast calculations.",
    accent: "warning",
    availability: "ready",
  },
  {
    id: "pricing",
    sectionId: "commercial",
    sectionLabel: "Commercial",
    sectionOrder: 5,
    itemOrder: 1,
    label: "Pricing",
    icon: "💰",
    description: "Bill rate, team cost, and commercial model calculators.",
    accent: "warning",
    availability: "ready",
  },
  {
    id: "status",
    sectionId: "commercial",
    sectionLabel: "Commercial",
    sectionOrder: 5,
    itemOrder: 2,
    label: "Status Report",
    icon: "📋",
    description: "Executive-ready status reporting and decision summaries.",
    accent: "muted",
    availability: "ready",
  },
];

const DEFAULT_IDENTITY: WorkspaceIdentity = {
  name: "Local Operator",
  email: "gemini-local@akb1.dev",
  provider: "Optional Gemini",
  status: "Local workspace access enabled",
  workspace: "Delivery Workbench",
  environment: "SQLite workspace",
};

const DEFAULT_HIGHLIGHTS: DashboardHighlight[] = [
  {
    title: "Consistent dashboard shell",
    body: "Unify header, sidebar, content surface, and assistant patterns so every screen feels like one product.",
    detail: "This is the first-order UI/UX fix and drives the new workbench layout.",
    tone: "brand",
  },
  {
    title: "Backend-driven navigation",
    body: "Load module metadata, dashboard stats, and workspace framing from the backend instead of static arrays in the client.",
    detail: "The shell now has a contract that can later move to Supabase without rewiring the UI.",
    tone: "success",
  },
  {
    title: "SQLite persistence",
    body: "Persist chat sessions, message history, and workspace drafts locally so the interface survives refreshes.",
    detail: "This replaces the previous in-memory state and gives you a migration runway.",
    tone: "warning",
  },
  {
    title: "Migration runway",
    body: "Keep Supabase as the later migration path while using a clean Gemini plus SQLite contract today.",
    detail: "Gemini is the only live model provider right now, and auth stays local until external auth is added.",
    tone: "muted",
  },
];

const DEFAULT_ROADMAP: RoadmapItem[] = [
  {
    title: "Gemini-only runtime",
    detail: "The assistant is wired to Gemini with a single API key contract and local SQLite persistence.",
    status: "ready",
  },
  {
    title: "Local SQLite persistence",
    detail: "Chat sessions, drafts, and dashboard metadata are stored in a local SQL database.",
    status: "ready",
  },
  {
    title: "External auth",
    detail: "Add Supabase or another provider once the local runtime and Gemini workflows are stable.",
    status: "next",
  },
  {
    title: "Supabase migration",
    detail: "Move auth, storage, and realtime sync to Supabase once the local contracts are validated.",
    status: "planned",
  },
];

function nowIso() {
  return new Date().toISOString();
}

function titleFromMessage(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (!normalized) return "New conversation";
  return normalized.length > 52 ? `${normalized.slice(0, 49)}...` : normalized;
}

function previewText(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Ask Gemini anything - your full conversation history is stored locally.";
  }
  return normalized.length > 100 ? `${normalized.slice(0, 97)}...` : normalized;
}

function hasLegacyProviderCopy(value: unknown) {
  if (value == null) return false;
  return /(Codex OAuth|Anthropic|Claude AI|Claude panel|Claude workspace)/i.test(
    JSON.stringify(value),
  );
}

export interface IStorage {
  getBootstrap(): Promise<BootstrapData>;
  listChatSessions(limit?: number): Promise<ChatSessionSummary[]>;
  createChatSession(input?: CreateChatSessionInput): Promise<ChatSessionSummary>;
  ensureChatSession(sessionId: string, input?: CreateChatSessionInput): Promise<ChatSessionSummary>;
  getMessages(sessionId: string): Promise<ChatMessage[]>;
  addMessage(msg: InsertChatMessage): Promise<ChatMessage>;
  clearSession(sessionId: string): Promise<void>;
  getToolDraft<T>(toolId: string): Promise<ToolDraftRecord<T>>;
  saveToolDraft<T>(toolId: string, payload: T): Promise<ToolDraftRecord<T>>;
}

export class SqliteStorage implements IStorage {
  private db: DatabaseSync;

  constructor() {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    this.db = new DatabaseSync(DB_PATH);
    this.init();
    this.seed();
  }

  private init() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        section_id TEXT NOT NULL,
        section_label TEXT NOT NULL,
        section_order INTEGER NOT NULL,
        item_order INTEGER NOT NULL,
        label TEXT NOT NULL,
        icon TEXT NOT NULL,
        description TEXT NOT NULL,
        accent TEXT NOT NULL,
        availability TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tool_drafts (
        tool_id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, id);
    `);
  }

  private seed() {
    const upsertModule = this.db.prepare(`
      INSERT INTO modules (
        id, section_id, section_label, section_order, item_order, label, icon, description, accent, availability
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        section_id = excluded.section_id,
        section_label = excluded.section_label,
        section_order = excluded.section_order,
        item_order = excluded.item_order,
        label = excluded.label,
        icon = excluded.icon,
        description = excluded.description,
        accent = excluded.accent,
        availability = excluded.availability
    `);

    for (const module of MODULES) {
      upsertModule.run(
        module.id,
        module.sectionId,
        module.sectionLabel,
        module.sectionOrder,
        module.itemOrder,
        module.label,
        module.icon,
        module.description,
        module.accent,
        module.availability,
      );
    }

    this.syncState("identity", DEFAULT_IDENTITY, hasLegacyProviderCopy);
    this.syncState("dashboard.highlights", DEFAULT_HIGHLIGHTS, hasLegacyProviderCopy);
    this.syncState("dashboard.roadmap", DEFAULT_ROADMAP, hasLegacyProviderCopy);
  }

  private syncState<T>(
    key: string,
    fallback: T,
    shouldReplace: (current: T | null) => boolean = () => false,
  ) {
    const row = this.db.prepare("SELECT value FROM app_state WHERE key = ?").get<AppStateRow>(key);
    if (!row?.value) {
      this.db
        .prepare("INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?)")
        .run(key, JSON.stringify(fallback), nowIso());
      return;
    }

    let parsed: T | null = null;
    try {
      parsed = JSON.parse(row.value) as T;
    } catch {
      parsed = null;
    }

    if (shouldReplace(parsed)) {
      this.db
        .prepare("UPDATE app_state SET value = ?, updated_at = ? WHERE key = ?")
        .run(JSON.stringify(fallback), nowIso(), key);
    }
  }

  private getState<T>(key: string, fallback: T): T {
    const row = this.db.prepare("SELECT value FROM app_state WHERE key = ?").get<AppStateRow>(key);
    if (!row?.value) return fallback;

    try {
      return JSON.parse(row.value) as T;
    } catch {
      return fallback;
    }
  }

  private toSections(rows: ModuleRow[]): NavigationSection[] {
    const sections = new Map<string, NavigationSection>();

    for (const row of rows) {
      const existing = sections.get(row.sectionId) ?? {
        id: row.sectionId,
        label: row.sectionLabel,
        items: [],
      };

      const item: NavigationItem = {
        id: row.id,
        label: row.label,
        icon: row.icon,
        description: row.description,
        section: row.sectionLabel,
        accent: row.accent,
        availability: row.availability,
      };

      existing.items.push(item);
      sections.set(row.sectionId, existing);
    }

    return Array.from(sections.values());
  }

  async getBootstrap(): Promise<BootstrapData> {
    const modules = this.db.prepare(`
      SELECT
        id,
        section_id AS sectionId,
        section_label AS sectionLabel,
        section_order AS sectionOrder,
        item_order AS itemOrder,
        label,
        icon,
        description,
        accent,
        availability
      FROM modules
      ORDER BY section_order, item_order
    `).all<ModuleRow>();

    const draftCountRow = this.db
      .prepare("SELECT COUNT(*) AS count FROM tool_drafts")
      .get<{ count: number }>();
    const messageCountRow = this.db
      .prepare("SELECT COUNT(*) AS count FROM chat_messages")
      .get<{ count: number }>();
    const sessionCountRow = this.db
      .prepare("SELECT COUNT(*) AS count FROM chat_sessions")
      .get<{ count: number }>();

    const stats: DashboardStat[] = [
      {
        label: "Modules",
        value: String(modules.length),
        detail: "Backend-driven navigation",
        tone: "brand",
      },
      {
        label: "Drafts",
        value: String(draftCountRow?.count ?? 0),
        detail: "Persisted in local SQLite",
        tone: "success",
      },
      {
        label: "Sessions",
        value: String(sessionCountRow?.count ?? 0),
        detail: "Gemini conversations retained",
        tone: "warning",
      },
      {
        label: "Messages",
        value: String(messageCountRow?.count ?? 0),
        detail: "Dynamic history from the backend",
        tone: "muted",
      },
    ];

    return {
      generatedAt: nowIso(),
      identity: this.getState("identity", DEFAULT_IDENTITY),
      sections: this.toSections(modules),
      stats,
      highlights: this.getState("dashboard.highlights", DEFAULT_HIGHLIGHTS),
      roadmap: this.getState("dashboard.roadmap", DEFAULT_ROADMAP),
      recentSessions: await this.listChatSessions(6),
    };
  }

  async listChatSessions(limit = 8): Promise<ChatSessionSummary[]> {
    const rows = this.db.prepare(`
      SELECT
        s.id,
        s.title,
        s.source,
        COALESCE((
          SELECT content
          FROM chat_messages cm
          WHERE cm.session_id = s.id
          ORDER BY cm.id DESC
          LIMIT 1
        ), '') AS preview,
        COUNT(m.id) AS messageCount,
        s.created_at AS createdAt,
        s.updated_at AS updatedAt
      FROM chat_sessions s
      LEFT JOIN chat_messages m ON m.session_id = s.id
      GROUP BY s.id, s.title, s.source, s.created_at, s.updated_at
      ORDER BY s.updated_at DESC
      LIMIT ?
    `).all<SessionRow>(limit);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      source: row.source,
      preview: previewText(row.preview),
      messageCount: Number(row.messageCount),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async createChatSession(input: CreateChatSessionInput = {}): Promise<ChatSessionSummary> {
    const id = `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = nowIso();
    const title = input.title?.trim() || "New conversation";
    const source = input.source?.trim() || "Gemini panel";

    this.db
      .prepare(`
        INSERT INTO chat_sessions (id, title, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(id, title, source, timestamp, timestamp);

    return {
      id,
      title,
      source,
      preview: "Ask Gemini anything - your full conversation history is stored locally.",
      messageCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  async ensureChatSession(
    sessionId: string,
    input: CreateChatSessionInput = {},
  ): Promise<ChatSessionSummary> {
    const existing = this.db
      .prepare(`
        SELECT
          id,
          title,
          source,
          '' AS preview,
          0 AS messageCount,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM chat_sessions
        WHERE id = ?
      `)
      .get<SessionRow>(sessionId);

    if (existing) {
      return {
        id: existing.id,
        title: existing.title,
        source: existing.source,
        preview: previewText(existing.preview),
        messageCount: Number(existing.messageCount),
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
      };
    }

    const timestamp = nowIso();
    const title = input.title?.trim() || "New conversation";
    const source = input.source?.trim() || "Gemini panel";

    this.db
      .prepare(`
        INSERT INTO chat_sessions (id, title, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(sessionId, title, source, timestamp, timestamp);

    return {
      id: sessionId,
      title,
      source,
      preview: "Ask Gemini anything - your full conversation history is stored locally.",
      messageCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const rows = this.db.prepare(`
      SELECT
        id,
        session_id AS sessionId,
        role,
        content,
        created_at AS createdAt
      FROM chat_messages
      WHERE session_id = ?
      ORDER BY id
    `).all<MessageRow>(sessionId);

    return rows.map((row) => ({
      id: row.id,
      sessionId: row.sessionId,
      role: row.role,
      content: row.content,
      createdAt: row.createdAt,
    }));
  }

  async addMessage(msg: InsertChatMessage): Promise<ChatMessage> {
    await this.ensureChatSession(msg.sessionId);

    const timestamp = nowIso();
    const insert = this.db
      .prepare(`
        INSERT INTO chat_messages (session_id, role, content, created_at)
        VALUES (?, ?, ?, ?)
      `)
      .run(msg.sessionId, msg.role, msg.content, timestamp);

    this.db
      .prepare("UPDATE chat_sessions SET updated_at = ? WHERE id = ?")
      .run(timestamp, msg.sessionId);

    if (msg.role === "user") {
      this.db
        .prepare(`
          UPDATE chat_sessions
          SET title = CASE
            WHEN title = 'New conversation' THEN ?
            ELSE title
          END
          WHERE id = ?
        `)
        .run(titleFromMessage(msg.content), msg.sessionId);
    }

    return {
      id: Number(insert.lastInsertRowid),
      sessionId: msg.sessionId,
      role: msg.role,
      content: msg.content,
      createdAt: timestamp,
    };
  }

  async clearSession(sessionId: string): Promise<void> {
    this.db.prepare("DELETE FROM chat_messages WHERE session_id = ?").run(sessionId);
    this.db
      .prepare("UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?")
      .run("New conversation", nowIso(), sessionId);
  }

  async getToolDraft<T>(toolId: string): Promise<ToolDraftRecord<T>> {
    const row = this.db
      .prepare(`
        SELECT tool_id, payload, updated_at
        FROM tool_drafts
        WHERE tool_id = ?
      `)
      .get<DraftRow>(toolId);

    if (!row) {
      return { toolId, payload: null, updatedAt: null };
    }

    try {
      return {
        toolId: row.tool_id,
        payload: JSON.parse(row.payload) as T,
        updatedAt: row.updated_at,
      };
    } catch {
      return { toolId, payload: null, updatedAt: row.updated_at };
    }
  }

  async saveToolDraft<T>(toolId: string, payload: T): Promise<ToolDraftRecord<T>> {
    const updatedAt = nowIso();

    this.db
      .prepare(`
        INSERT INTO tool_drafts (tool_id, payload, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(tool_id) DO UPDATE SET
          payload = excluded.payload,
          updated_at = excluded.updated_at
      `)
      .run(toolId, JSON.stringify(payload), updatedAt);

    return { toolId, payload, updatedAt };
  }
}

export const storage = new SqliteStorage();
