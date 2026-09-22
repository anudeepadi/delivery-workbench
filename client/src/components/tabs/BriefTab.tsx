import type { ModuleId } from "@shared/contracts";

interface Props {
  showToast: (msg: string) => void;
  setActiveTab: (tab: ModuleId) => void;
}

const STATS = [
  {
    label: "Profile Version",
    val: "v2.0",
    sub: "Delivery planning brief",
    col: "var(--blue)",
  },
  {
    label: "Thinking Layers",
    val: "5",
    sub: "Arch→Biz→Risk→KPI→Exec",
    col: "var(--cyan)",
  },
  {
    label: "Cheat Codes",
    val: "9",
    sub: "Active techniques",
    col: "var(--gold)",
  },
  {
    label: "KPI Modules",
    val: "9",
    sub: "Interactive calculators",
    col: "var(--green)",
  },
];

const QUICK_LINKS: {
  label: string;
  icon: string;
  tab: ModuleId;
  col: string;
}[] = [
  { label: "KPI Engine", icon: "📊", tab: "kpi", col: "var(--blue)" },
  { label: "Prompt Lab", icon: "🔮", tab: "prompt", col: "var(--purple)" },
  { label: "Risk Matrix", icon: "⚠", tab: "risk", col: "var(--red)" },
  { label: "Sprint Planner", icon: "📅", tab: "sprint", col: "var(--green)" },
  { label: "Estimation", icon: "🧮", tab: "estimate", col: "var(--cyan)" },
  { label: "Pricing Calc", icon: "💰", tab: "pricing", col: "var(--gold)" },
  { label: "Decision Matrix", icon: "⚖", tab: "decision", col: "var(--blue)" },
  { label: "Status Report", icon: "📋", tab: "status", col: "var(--orange)" },
];

function getQuickLaunchSpanClass(index: number, total: number) {
  const remainder = total % 4;
  const startOfLastRow = total - remainder;

  if (remainder === 1 && index === total - 1) {
    return "quick-btn--span-4";
  }

  if (remainder === 2 && index >= startOfLastRow) {
    return "quick-btn--span-2";
  }

  return "";
}

export default function BriefTab({ setActiveTab }: Props) {
  return (
    <div>
      <div className="tab-intro">
        <h2>⚡ Command Brief</h2>
        <p>
          Your delivery planning workspace — calibrated for executive
          delivery and technology strategy.
        </p>
      </div>

      {/* Stats */}
      <div className="g4" style={{ marginBottom: "16px" }}>
        {STATS.map((s, i) => (
          <div key={i} className="ak-card">
            <div
              style={{
                fontSize: "10px",
                color: "var(--sub)",
                textTransform: "uppercase",
                letterSpacing: ".6px",
                marginBottom: "5px",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: s.col,
                lineHeight: 1,
              }}
            >
              {s.val}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "var(--sub)",
                marginTop: "3px",
              }}
            >
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="ak-card" style={{ marginBottom: "14px" }}>
        <div className="ak-card-title">🚀 Quick Launch</div>
        <div className="quick-grid">
          {QUICK_LINKS.map((q, i) => (
            <button
              key={q.tab}
              className={`quick-btn ${getQuickLaunchSpanClass(i, QUICK_LINKS.length)}`}
              onClick={() => setActiveTab(q.tab)}
              data-testid={`quick-link-${q.tab}`}
            >
              <span className="quick-btn-icon">{q.icon}</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="g2">
        <div className="ak-card">
          <div className="ak-card-title">🧠 Thinking Model</div>
          <table className="ak-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Layer</th>
                <th>Focus</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "1",
                  "System Architecture",
                  "Structure, dependencies, design",
                  "var(--blue)",
                ],
                [
                  "2",
                  "Business & Ops Impact",
                  "Revenue, margin, risk",
                  "var(--cyan)",
                ],
                [
                  "3",
                  "Risk & Trade-offs",
                  "Options, constraints, mitigations",
                  "var(--gold)",
                ],
                [
                  "4",
                  "Metrics & KPIs",
                  "Formulas, targets, owners",
                  "var(--green)",
                ],
                [
                  "5",
                  "Execution Framework",
                  "Playbook, governance, actions",
                  "var(--purple)",
                ],
              ].map(([n, l, f, c]) => (
                <tr key={n}>
                  <td style={{ color: c as string, fontWeight: 700 }}>{n}</td>
                  <td style={{ fontWeight: 600 }}>{l}</td>
                  <td style={{ color: "var(--sub)", fontSize: "11px" }}>{f}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ak-card">
          <div className="ak-card-title">🎯 Active Response Modules</div>
          <table className="ak-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Rule</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Executive Summary",
                  "2–4 sentences, direct, no padding",
                  "var(--blue)",
                ],
                [
                  "Concept Explanation",
                  "Named enterprise example required",
                  "var(--text)",
                ],
                [
                  "Formula Rule",
                  "Formula + 2 worked examples always",
                  "var(--text)",
                ],
                [
                  "Decision Support",
                  "Conservative / Balanced / Strategic",
                  "var(--gold)",
                ],
                [
                  "Prompt Lab",
                  "10-metric matrix, every response",
                  "var(--purple)",
                ],
              ].map(([m, r, c]) => (
                <tr key={m}>
                  <td
                    style={{
                      color: c as string,
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    {m}
                  </td>
                  <td style={{ color: "var(--sub)", fontSize: "11px" }}>{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ak-card" style={{ marginTop: "14px" }}>
        <div className="ak-card-title">🏆 Expertise Stack</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[
            "Enterprise Program Delivery",
            "Agile@Scale · SAFe · Scrum@Scale",
            "Big Data & Analytics",
            "AI Transformation Strategy",
            "Delivery Operating Models",
            "Margin Optimization",
            "KPI-Driven Delivery",
            "Technology Architecture",
            "Governance & Risk",
            "Gemini Workflow Design",
            "Python · FastAPI · Docker",
            "AWS · GCP · Cloud Infrastructure",
            "AI Agent Systems",
            "Bloomberg Terminal Mode",
          ].map((s, i) => (
            <span
              key={i}
              className={`pill ${["pill-b", "pill-g", "pill-o", "pill-r", "pill-p"][i % 5]}`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
