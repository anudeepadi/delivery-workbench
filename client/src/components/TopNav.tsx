import { motion } from "framer-motion";
import type { WorkspaceIdentity } from "@shared/contracts";

interface Props {
  page: "home" | "terminal";
  onNavigate: (page: "home" | "terminal") => void;
  identity?: WorkspaceIdentity;
  claudeOpen?: boolean;
  onToggleClaude?: () => void;
  onOpenCmd?: () => void;
  isMobile: boolean;
}

export default function TopNav({
  page,
  onNavigate,
  identity,
  claudeOpen,
  onToggleClaude,
  onOpenCmd,
  isMobile,
}: Props) {
  const subtitle =
    page === "home"
      ? "Plan work, compare tradeoffs, track risk"
      : "Delivery workbench";

  const primaryLabel =
    page === "home"
      ? isMobile
        ? "Open"
        : "Open Workbench"
      : isMobile
        ? "Dashboard"
        : "Back to Dashboard";

  return (
    <motion.header
      className="app-topbar"
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 260, delay: 0.05 }}
    >
      <div className="topbar-brand">
        <div className="topbar-mark">DW</div>
        <div>
          <div className="topbar-title">Delivery Workbench</div>
          <div className="topbar-subtitle">{subtitle}</div>
        </div>
      </div>

      <div className="topbar-center">
        <div className="topbar-nav">
          <button
            className={`topbar-nav-button ${page === "home" ? "active" : ""}`}
            onClick={() => onNavigate("home")}
            data-testid="nav-home"
          >
            Dashboard
          </button>
          <button
            className={`topbar-nav-button ${page === "terminal" ? "active" : ""}`}
            onClick={() => onNavigate("terminal")}
            data-testid="nav-terminal"
          >
            Workbench
          </button>
        </div>

      </div>

      <div className="topbar-actions">
        {identity && !isMobile && (
          <>
            <span className="topbar-chip">
              <span className="status-dot blue" />
              {identity.provider}
            </span>
            <span className="topbar-chip tone-muted">{identity.environment}</span>
          </>
        )}

        {page === "terminal" && onOpenCmd && (
          <button className="topbar-action" onClick={onOpenCmd} data-testid="nav-cmd">
            <span className="mono">⌘K</span>
            <span>{isMobile ? "Search" : "Command"}</span>
          </button>
        )}

        {page === "terminal" && onToggleClaude && (
          <button
            className={`topbar-action ${claudeOpen ? "is-active" : ""}`}
            onClick={onToggleClaude}
            data-testid="nav-claude-toggle"
          >
            <span>◆</span>
            <span>{isMobile ? "Chat" : claudeOpen ? "Assistant On" : "Assistant Off"}</span>
          </button>
        )}

        <button
          className="topbar-primary"
          onClick={() => onNavigate(page === "home" ? "terminal" : "home")}
          data-testid="nav-launch"
        >
          {primaryLabel}
        </button>
      </div>
    </motion.header>
  );
}
