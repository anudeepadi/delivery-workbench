import type { ModuleId, NavigationSection, WorkspaceIdentity } from "@shared/contracts";

interface Props {
  sections: NavigationSection[];
  activeTab: ModuleId;
  setActiveTab: (tab: ModuleId) => void;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  identity?: WorkspaceIdentity;
}

export default function Sidebar({
  sections,
  activeTab,
  setActiveTab,
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  identity,
}: Props) {
  const moduleCount = sections.reduce(
    (total, section) => total + section.items.length,
    0,
  );

  return (
    <>
      <button
        className={`sidebar-backdrop ${mobileOpen ? "is-visible" : ""}`}
        onClick={onCloseMobile}
        aria-hidden={!mobileOpen}
        tabIndex={-1}
      />

      <aside
        className={[
          "workspace-sidebar",
          collapsed ? "is-collapsed" : "",
          mobileOpen ? "is-mobile-open" : "",
        ].join(" ")}
      >
        <div className="workspace-sidebar-header">
          <div className="workspace-sidebar-brand">
            <div className="topbar-mark">DW</div>
            {!collapsed && (
              <div>
                <div className="workspace-sidebar-title">Workbench</div>
                <div className="workspace-sidebar-subtitle">Unified module navigation</div>
              </div>
            )}
          </div>

          <button
            className="workspace-sidebar-toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <div className="workspace-sidebar-scroll">
          {sections.map((section) => (
            <div key={section.id} className="workspace-sidebar-section">
              {!collapsed && <div className="workspace-sidebar-label">{section.label}</div>}

              {section.items.map((item) => {
                const isActive = item.id === activeTab;

                return (
                  <button
                    key={item.id}
                    className={`workspace-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      onCloseMobile();
                    }}
                    title={collapsed ? item.label : undefined}
                    data-testid={`tab-${item.id}`}
                  >
                    <span className="workspace-nav-icon">{item.icon}</span>
                    {!collapsed && (
                      <span className="workspace-nav-content">
                        <span className="workspace-nav-label">{item.label}</span>
                        <span className="workspace-nav-desc">{item.description}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="workspace-sidebar-footer">
          {!collapsed && (
            <>
              <div className="workspace-footer-label">{identity?.provider || "Gemini API Key"}</div>
              <div className="workspace-footer-value">{identity?.environment || "SQLite + Gemini"}</div>
              <div className="workspace-footer-metrics">
                <span className="workspace-footer-metric">
                  <strong>{moduleCount}</strong> modules
                </span>
                <span className="workspace-footer-metric">
                  <strong>{sections.length}</strong> groups
                </span>
              </div>
            </>
          )}
          <span className="workspace-footer-pill">⌘K</span>
        </div>
      </aside>
    </>
  );
}
