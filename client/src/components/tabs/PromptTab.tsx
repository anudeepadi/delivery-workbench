import { useState } from "react";

interface Props {
  showToast: (msg: string) => void;
}

const CHEATS = [
  {
    name: "Role Assignment",
    desc: "Anchors context. LLM adopts domain heuristics, vocabulary and risk thresholds.",
    ex: "Act as a CTO of a $500M enterprise software firm reviewing a platform migration proposal. Your lens is margin impact and execution risk.",
  },
  {
    name: "Chain-of-Thought",
    desc: "Forces reasoning trace before conclusion. Reduces hallucination on multi-step tasks.",
    ex: "Think step by step. First analyse the architecture, then business impact, then identify top 3 risks before giving your recommendation.",
  },
  {
    name: "Output Constraint",
    desc: "Eliminates padding. Forces model to prioritise signal over format-filling.",
    ex: "Respond ONLY in this format: {Summary:[2 sentences], KPIs:[table], Recommendation:[1 sentence]}. No intro. No conclusion.",
  },
  {
    name: "Negative Constraints",
    desc: "Explicitly forbids default behaviours: verbose intros, hedging, bullets when prose needed.",
    ex: "Do NOT include an introduction. Do NOT use bullet points. Do NOT hedge with 'it depends.' Give a direct recommendation.",
  },
  {
    name: "Decomposition",
    desc: "Breaks complex tasks into ordered sub-tasks. Prevents shallow single-pass answers.",
    ex: "First map the current delivery architecture. Then identify margin leakage points. Then synthesise a prioritised action plan.",
  },
  {
    name: "Adversarial",
    desc: "Forces pre-mortem thinking. Generates failure modes before they materialise in execution.",
    ex: "What are the 5 most likely ways this PI plan fails? For each: root cause, early warning signal, and mitigation action.",
  },
  {
    name: "Metacognitive",
    desc: "Forces the model to surface its own assumptions — critical for high-stakes decisions.",
    ex: "List your top 5 assumptions before answering. Flag which are highest-risk if wrong. Then provide your analysis.",
  },
  {
    name: "Scope Bounding",
    desc: "Controls token spend. Essential for efficiency when output format is standardised.",
    ex: "Max 200 words. No preamble. Target audience: CIO. Deliver only actionable insights. Use a table where possible.",
  },
  {
    name: "JSON Anchoring",
    desc: "Guarantees machine-parseable output. Critical for agentic pipelines and multi-LLM workflows.",
    ex: '{"executive_summary":"","top_risks":[],"kpis":[{"name":"","formula":"","target":""}],"recommendation":""}',
  },
];

export default function PromptTab({ showToast }: Props) {
  const [promptText, setPromptText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [scores, setScores] = useState<
    { label: string; score: number; col: string }[]
  >([]);
  const [overall, setOverall] = useState(0);
  const [gaps, setGaps] = useState<string[]>([]);

  const copyCheat = (ex: string) => {
    try {
      navigator.clipboard.writeText(ex);
    } catch {}
    showToast("Copied pattern");
  };

  const analyze = () => {
    if (!promptText.trim()) {
      showToast("Enter a prompt first");
      return;
    }
    const txt = promptText;
    const wc = txt.split(/\s+/).length;
    const sc = [
      {
        label: "Role specified",
        score: /act as|you are|as a|persona|role:/i.test(txt) ? 100 : 15,
        col: "var(--blue)",
      },
      {
        label: "Format defined",
        score: /format|table|json|bullet|respond only|structure/i.test(txt)
          ? 100
          : 20,
        col: "var(--cyan)",
      },
      {
        label: "Chain-of-thought",
        score: /step by step|think|reason|first.*then/i.test(txt) ? 90 : 10,
        col: "var(--purple)",
      },
      {
        label: "Constraints set",
        score: /do not|don't|no intro|max \d+|only|no preamble/i.test(txt)
          ? 90
          : 15,
        col: "var(--gold)",
      },
      {
        label: "KPIs / metrics asked",
        score: /kpi|metric|formula|measure|%|target/i.test(txt) ? 85 : 10,
        col: "var(--green)",
      },
      {
        label: "Context completeness",
        score: Math.min(100, wc * 4),
        col: "var(--orange)",
      },
      {
        label: "Output goal clear",
        score: /recommend|provide|give|return|output/i.test(txt) ? 80 : 20,
        col: "var(--blue)",
      },
      {
        label: "Examples requested",
        score: /example|such as|e\.g\.|for instance/i.test(txt) ? 80 : 20,
        col: "var(--gold)",
      },
    ];
    const ov = Math.round(sc.reduce((a, s) => a + s.score, 0) / sc.length);
    const gs: string[] = [];
    if (sc[0].score < 50) gs.push('Add role: "Act as [expert role]"');
    if (sc[1].score < 50) gs.push("Define format: table / JSON / bullets");
    if (sc[2].score < 50) gs.push('Add reasoning: "think step by step"');
    if (sc[3].score < 50) gs.push('Add constraints: "Do NOT include intro"');
    if (sc[4].score < 50) gs.push("Specify KPIs/metrics in output");
    setScores(sc);
    setOverall(ov);
    setGaps(gs);
    setShowResult(true);
  };

  const ovCol =
    overall >= 75
      ? "var(--green)"
      : overall >= 50
        ? "var(--gold)"
        : "var(--red)";
  const grade =
    overall >= 80
      ? "Expert"
      : overall >= 60
        ? "Good"
        : overall >= 40
          ? "Basic"
          : "Weak";

  return (
    <div>
      <div className="tab-intro">
        <h2>🔮 Prompt Lab</h2>
        <p>9 cheat codes (click to copy) + live prompt analyzer.</p>
      </div>

      <div className="g3" style={{ marginBottom: "16px" }}>
        {CHEATS.map((c, i) => (
          <div
            key={i}
            className="ak-card"
            onClick={() => copyCheat(c.ex)}
            style={{ cursor: "pointer" }}
            data-testid={`cheat-${i}`}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--gold)",
                marginBottom: "4px",
              }}
            >
              {c.name}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--sub)",
                lineHeight: 1.5,
                marginBottom: "6px",
              }}
            >
              {c.desc}
            </div>
            <div
              style={{
                background: "var(--bg)",
                borderRadius: "3px",
                padding: "6px 8px",
                fontFamily: "monospace",
                fontSize: "10px",
                color: "var(--cyan)",
                lineHeight: 1.5,
                borderLeft: "2px solid var(--blue)",
              }}
            >
              {c.ex.slice(0, 120)}
              {c.ex.length > 120 ? "..." : ""}
            </div>
          </div>
        ))}
      </div>

      <div className="ak-card">
        <div className="ak-card-title">⚡ Live Prompt Analyzer</div>
        <textarea
          className="ak-ta"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Paste your prompt here to score it..."
          style={{ minHeight: "80px" }}
          data-testid="input-prompt-analyze"
        />
        <button
          className="ak-btn-primary"
          onClick={analyze}
          style={{ marginTop: "8px" }}
          data-testid="button-analyze-prompt"
        >
          Analyze Prompt →
        </button>
        {showResult && (
          <div style={{ marginTop: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              <div style={{ fontSize: "32px", fontWeight: 700, color: ovCol }}>
                {overall}%
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>
                  Prompt quality: <span style={{ color: ovCol }}>{grade}</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--sub)" }}>
                  {promptText.split(/\s+/).length} words · {promptText.length}{" "}
                  chars
                </div>
              </div>
            </div>
            {scores.map((s, i) => {
              const sc =
                s.score >= 70
                  ? "var(--green)"
                  : s.score >= 40
                    ? "var(--gold)"
                    : "var(--red)";
              return (
                <div key={i} className="sbar-wrap">
                  <div className="sbar-lbl">
                    <span>{s.label}</span>
                    <span style={{ color: sc }}>{s.score}%</span>
                  </div>
                  <div className="sbar-bg">
                    <div
                      className="sbar-fill"
                      style={{ width: s.score + "%", background: s.col }}
                    />
                  </div>
                </div>
              );
            })}
            {gaps.length > 0 && (
              <div className="ak-card" style={{ marginTop: "12px" }}>
                <div className="ak-card-title" style={{ color: "var(--gold)" }}>
                  ⚠ Gaps ({gaps.length})
                </div>
                {gaps.map((g, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "5px 0",
                      borderBottom: "1px solid var(--border-c)",
                      fontSize: "12px",
                      color: "var(--sub)",
                    }}
                  >
                    → {g}
                  </div>
                ))}
              </div>
            )}
            {gaps.length === 0 && (
              <div
                style={{
                  color: "var(--green)",
                  fontWeight: 600,
                  marginTop: "10px",
                }}
              >
                ✓ Strong prompt — no major gaps.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
