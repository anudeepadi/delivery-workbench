import { useState } from "react";
interface Props {
  showToast: (msg: string) => void;
}
export default function DecisionTab({ showToast }: Props) {
  const [decInput, setDecInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [result, setResult] = useState(false);
  const ALL_TAGS = [
    "💰 Budget",
    "⏳ Timeline",
    "🏢 Enterprise",
    "🤖 AI/Tech",
    "👥 Team",
    "📊 Margin",
    "🔒 Risk",
    "☁ Cloud",
  ];
  const toggleTag = (t: string) =>
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  const gen = () => {
    if (!decInput.trim()) {
      showToast("Describe your decision first");
      return;
    }
    setResult(true);
  };
  const OPTS = [
    {
      title: "1 — Conservative: Proven Low-Risk Approach",
      badges: [
        ["Low Risk", "pill-g"],
        ["Low Complexity", "pill-g"],
        ["Incremental Impact", "pill-b"],
      ],
      body: "Adopt an established, proven solution with minimal custom build. Fast time-to-value (6–12 weeks). Predictable TCO. Select when speed and stability outweigh customisation. Typical for regulated industries or programmes with low change tolerance.",
      bg: "rgba(63,185,80,.06)",
      bc: "rgba(63,185,80,.3)",
    },
    {
      title: "2 — Balanced: Hybrid Build + Adopt",
      badges: [
        ["Medium Risk", "pill-b"],
        ["Medium Complexity", "pill-b"],
        ["Measurable Impact", "pill-o"],
      ],
      body: "Adopt vendor platform for commodity capabilities; build proprietary layers for competitive differentiation. 3–6 month delivery horizon. Best-practice for enterprise programmes with mature delivery teams.",
      bg: "rgba(88,166,255,.06)",
      bc: "rgba(88,166,255,.3)",
    },
    {
      title: "3 — Strategic: Full Custom / Platform Build",
      badges: [
        ["Moderate Risk", "pill-o"],
        ["High Complexity", "pill-r"],
        ["Transformational Impact", "pill-o"],
      ],
      body: "Build proprietary capability with full control over data, models, and IP. 12–18+ month horizon. Requires senior engineering capability. Justified at $500M+ enterprise scale with clear IP monetisation roadmap.",
      bg: "rgba(227,179,65,.06)",
      bc: "rgba(227,179,65,.3)",
    },
    {
      title: "⭐ Example recommendation: Option 2 — Hybrid Build + Adopt",
      badges: [["Example recommendation", "pill-p"]],
      body: "Balances speed-to-value against long-term control. Vendor platform de-risks infrastructure; in-house layers preserve IP and delivery differentiation. Aligns with Infosys Cobalt and TCS AI.Cloud models. Typical margin uplift: 3–5% through automation-driven cost efficiency within 18 months.",
      bg: "rgba(188,140,255,.08)",
      bc: "var(--purple)",
    },
  ];
  return (
    <div>
      <div className="tab-intro">
        <h2>⚖ Decision Matrix</h2>
        <p>3-option decision support: Conservative → Balanced → Strategic.</p>
      </div>
      <div className="ak-card" style={{ marginBottom: "14px" }}>
        <div className="ak-card-title">✏ Describe Your Decision</div>
        <textarea
          className="ak-ta"
          value={decInput}
          onChange={(e) => setDecInput(e.target.value)}
          placeholder="e.g. Whether to build an in-house AI platform vs adopt a vendor solution..."
          style={{ marginBottom: "10px" }}
          data-testid="input-decision"
        />
        <div style={{ marginBottom: "12px" }}>
          <div className="ak-card-title">Context Tags</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {ALL_TAGS.map((t) => (
              <button
                key={t}
                className={`chip${tags.includes(t) ? " sel" : ""}`}
                onClick={() => toggleTag(t)}
                style={{ fontSize: "11px" }}
                data-testid={`tag-${t}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <button
          className="ak-btn-primary"
          onClick={gen}
          data-testid="button-gen-decision"
        >
          Generate Decision Matrix →
        </button>
      </div>
      {result && (
        <div>
          <div className="ak-card" style={{ marginBottom: "12px" }}>
            <div className="ak-card-title">🎯 Decision Under Analysis</div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--sub)",
                fontStyle: "italic",
              }}
            >
              "{decInput}"
            </div>
            {tags.length > 0 && (
              <div
                style={{
                  marginTop: "6px",
                  display: "flex",
                  gap: "5px",
                  flexWrap: "wrap",
                }}
              >
                {tags.map((t) => (
                  <span key={t} className="pill pill-b">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          {OPTS.map((o, i) => (
            <div
              key={i}
              style={{
                background: o.bg,
                border: `1px solid ${o.bc}`,
                borderRadius: "6px",
                padding: "14px 16px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  flexWrap: "wrap",
                  gap: "5px",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700 }}>
                  {o.title}
                </div>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {o.badges.map(([label, cls]) => (
                    <span key={label} className={`pill ${cls}`}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--sub)",
                  lineHeight: 1.6,
                }}
              >
                {o.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
