import React, { useState } from "react";
interface Props {
  showToast: (msg: string) => void;
}
const PB_ROLES = [
  {
    grp: "C-Suite",
    items: [
      "CTO of a $500M enterprise software firm",
      "CIO advising on a digital transformation roadmap",
      "Chief Data Officer building enterprise data strategy",
      "Chief AI Officer evaluating LLM adoption risk",
    ],
  },
  {
    grp: "Delivery Leadership",
    items: [
      "Senior Delivery PM running a 200-person offshore program",
      "PMO Director governing 15 concurrent programs",
      "Technical Program Manager owning a $100M cloud migration",
      "Offshore Delivery Lead managing India-based teams",
    ],
  },
  {
    grp: "Agile & Engineering",
    items: [
      "SAFe Release Train Engineer running a PI for 8 teams",
      "VP of Engineering owning platform modernisation",
      "DevOps / SRE Lead designing deployment and reliability framework",
    ],
  },
  {
    grp: "Commercial & Strategy",
    items: [
      "Pre-Sales SA writing a technical response to RFP",
      "Engagement Manager sizing effort for fixed-price contract",
      "AI Transformation Strategist building 3-year enterprise roadmap",
    ],
  },
];
const PB_TASKS = [
  {
    grp: "Analysis",
    items: [
      "Analyze and produce a prioritized recommendation for",
      "Evaluate build vs. buy vs. partner options for",
      "Run a pre-mortem: identify 5 failure modes and mitigations for",
    ],
  },
  {
    grp: "Planning",
    items: [
      "Write a PI Planning readout and team commitment summary for",
      "Create a delivery governance framework and RACI for",
      "Design a resource allocation and capacity model for",
    ],
  },
  {
    grp: "Stakeholder",
    items: [
      "Write an executive status update (RAG + key facts) for",
      "Draft a client escalation response with root cause and remediation for",
      "Build a business case and ROI model for",
    ],
  },
  {
    grp: "Strategy",
    items: [
      "Design a 3-year AI / digital transformation roadmap for",
      "Create a margin improvement plan with levers and KPI targets for",
      "Build a platform modernisation strategy and phased migration plan for",
    ],
  },
];
const PB_FORMATS = [
  "Executive summary + KPI table",
  "Structured framework with headers",
  "JSON output only",
  "Bullet points (≤5 per section)",
  "3-option decision matrix",
  "Step-by-step playbook",
];
const PB_CODES = [
  "Think step by step",
  "List your assumptions first",
  "Do NOT include intro or preamble",
  "Include 2 worked examples with real numbers",
  "Cite named enterprise example (company + year)",
  "Max 300 words total",
  "Connect every decision to a business outcome",
];
export default function BuilderTab({ showToast }: Props) {
  const [role, setRole] = useState<string | null>(null);
  const [tasks, setTasks] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [ctx, setCtx] = useState("");
  const toggleArr = (
    arr: string[],
    setArr: (a: string[]) => void,
    val: string,
  ) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };
  const buildPrompt = () => {
    const parts: string[] = [];
    if (role) parts.push(`Act as a ${role}.`);
    tasks.forEach((t) => parts.push(t + (ctx ? " " + ctx : ".")));
    codes.forEach((c) => {
      if (/assumption/i.test(c))
        parts.push("List your assumptions before answering.");
      else if (/step by step/i.test(c)) parts.push("Think step by step.");
      else if (/intro/i.test(c))
        parts.push("Do NOT include an introduction or preamble.");
      else if (/examples/i.test(c))
        parts.push("Include 2 worked examples with real enterprise numbers.");
      else if (/enterprise example/i.test(c))
        parts.push(
          "Anchor with 1 named enterprise example (company + year + outcome).",
        );
      else if (/300/i.test(c)) parts.push("Total response: ≤300 words.");
      else if (/business outcome/i.test(c))
        parts.push(
          "Connect every technical decision to a measurable business outcome.",
        );
    });
    if (formats.length)
      parts.push("Output format: " + formats.join(" + ") + ".");
    return parts.length ? parts.join(" ") : "Select components on the left.";
  };
  const prompt = buildPrompt();
  const score = Math.min(
    100,
    (role ? 25 : 0) +
      Math.min(tasks.length * 20, 40) +
      Math.min(formats.length * 15, 25) +
      Math.min(codes.length * 10, 25),
  );
  const tokens = Math.round(prompt.split(/\s+/).length * 1.3);
  const scol =
    score >= 75 ? "var(--green)" : score >= 50 ? "var(--gold)" : "var(--red)";
  const copyPrompt = () => {
    try {
      navigator.clipboard.writeText(prompt);
    } catch {}
    showToast("✓ Prompt copied");
  };
  return (
    <div>
      <div className="tab-intro">
        <h2>💡 Prompt Builder</h2>
        <p>
          Step-by-step delivery prompt constructor. Pick components → copy assembled
          prompt.
        </p>
      </div>
      <div className="g2">
        <div>
          {[
            { label: "1 — Role", items: PB_ROLES, type: "role" },
            { label: "2 — Task Type", items: PB_TASKS, type: "task" },
          ].map(({ label, items, type }) => (
            <div
              key={label}
              className="ak-card"
              style={{ marginBottom: "8px" }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "var(--blue)",
                    color: "#000",
                    fontSize: "9px",
                    fontWeight: 700,
                    marginRight: 6,
                    flexShrink: 0,
                  }}
                >
                  {label[0]}
                </span>
                {label.slice(4)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {(items as any[]).map((g: any) => (
                  <React.Fragment key={g.grp}>
                    <div
                      style={{
                        width: "100%",
                        fontSize: "9px",
                        color: "var(--sub)",
                        textTransform: "uppercase",
                        letterSpacing: ".6px",
                        fontWeight: 600,
                        margin: "5px 0 2px",
                        paddingTop: "4px",
                        borderTop: "1px solid var(--border-c)",
                      }}
                    >
                      {g.grp}
                    </div>
                    {g.items.map((item: string) => {
                      const isSel =
                        type === "role" ? role === item : tasks.includes(item);
                      return (
                        <button
                          key={item}
                          className={`chip${isSel ? (type === "role" ? " sel" : " sel-multi") : ""}`}
                          onClick={() => {
                            if (type === "role")
                              setRole(role === item ? null : item);
                            else toggleArr(tasks, setTasks, item);
                          }}
                          style={{ fontSize: "10px" }}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {[
            { label: "3 — Output Format", items: PB_FORMATS, type: "format" },
            { label: "4 — Cheat Codes", items: PB_CODES, type: "code" },
          ].map(({ label, items, type }) => (
            <div
              key={label}
              className="ak-card"
              style={{ marginBottom: "8px" }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "var(--blue)",
                    color: "#000",
                    fontSize: "9px",
                    fontWeight: 700,
                    marginRight: 6,
                    flexShrink: 0,
                  }}
                >
                  {label[0]}
                </span>
                {label.slice(4)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {(items as string[]).map((item) => {
                  const arr = type === "format" ? formats : codes;
                  const setArr = type === "format" ? setFormats : setCodes;
                  const isSel = arr.includes(item);
                  return (
                    <button
                      key={item}
                      className={`chip${isSel ? " sel-multi" : ""}`}
                      onClick={() => toggleArr(arr, setArr, item)}
                      style={{ fontSize: "10px" }}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="ak-card" style={{ marginBottom: "8px" }}>
            <div
              style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}
            >
              5 — Custom Context{" "}
              <span
                style={{
                  color: "var(--sub)",
                  fontSize: "10px",
                  fontWeight: 400,
                }}
              >
                (optional)
              </span>
            </div>
            <input
              className="ak-inp"
              value={ctx}
              onChange={(e) => setCtx(e.target.value)}
              placeholder="e.g. for a 500-person delivery org with $50M revenue..."
            />
          </div>
        </div>
        <div
          className="ak-card"
          style={{ margin: 0, display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <div className="ak-card-title" style={{ margin: 0 }}>
              📋 Assembled Prompt
            </div>
            <button className="ak-btn-secondary" onClick={copyPrompt}>
              Copy
            </button>
          </div>
          <div
            style={{
              flex: 1,
              background: "var(--bg)",
              border: "1px solid var(--blue)",
              borderRadius: "6px",
              padding: "11px 13px",
              fontFamily: "monospace",
              fontSize: "11px",
              color: "var(--cyan)",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              minHeight: "120px",
            }}
          >
            {prompt}
          </div>
          <div
            style={{ marginTop: "8px", fontSize: "10px", color: "var(--sub)" }}
          >
            ~{tokens} tokens · Prompt strength:{" "}
            <strong style={{ color: scol }}>{score}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
