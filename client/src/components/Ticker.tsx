import { useState, useEffect } from "react";

const TICKER_ITEMS = [
  { label: "Workbench v2.0", val: "ACTIVE", col: "var(--green)" },
  { label: "Delivery Margin Target", val: "≥28%", col: "var(--gold)" },
  { label: "PI Predictability Target", val: "≥80%", col: "var(--blue)" },
  { label: "Utilization Target", val: "≥80%", col: "var(--cyan)" },
  { label: "SLA Compliance Target", val: "≥98%", col: "var(--green)" },
  { label: "Change Failure Rate Target", val: "≤5% (DORA Elite)", col: "var(--purple)" },
  { label: "Revenue/FTE Benchmark", val: "≥$150K/yr", col: "var(--gold)" },
  { label: "MTTR Target", val: "≤P1 SLA", col: "var(--blue)" },
  { label: "Team Attrition Target", val: "≤15% annualised", col: "var(--cyan)" },
  { label: "Pyramid Leverage Target", val: "≥3:1", col: "var(--green)" },
  { label: "CPI Target", val: "≥1.0", col: "var(--gold)" },
  { label: "Sprint Velocity Stability", val: "±15% variance", col: "var(--blue)" },
  { label: "Gemini API", val: "READY", col: "var(--purple)" },
  { label: "Delivery Workbench", val: "PLANNING PROTOTYPE", col: "var(--cyan)" },
];

export default function Ticker() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const itemsHtml = TICKER_ITEMS.map((item, i) => (
    <span key={i} style={{ marginRight: "40px" }}>
      <span style={{ color: "var(--sub)", fontSize: "10px", marginRight: "6px" }}>{item.label}</span>
      <span style={{ color: item.col, fontWeight: 700, fontSize: "11px" }}>{item.val}</span>
      <span style={{ color: "var(--border-c)", margin: "0 12px" }}>│</span>
    </span>
  ));

  return (
    <div style={{
      background: "#0a0e14",
      borderBottom: "1px solid var(--border-c)",
      display: "flex",
      alignItems: "center",
      height: "28px",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {/* Live clock */}
      <div style={{
        flexShrink: 0,
        padding: "0 14px",
        borderRight: "1px solid var(--border-c)",
        display: "flex",
        gap: "8px",
        alignItems: "center",
        background: "#0a0e14",
        zIndex: 1,
      }}>
        <span style={{ color: "var(--green)", fontFamily: "monospace", fontSize: "11px", fontWeight: 700, letterSpacing: "1px" }}>
          {timeStr}
        </span>
        <span style={{ color: "var(--sub)", fontSize: "10px" }}>{dateStr}</span>
      </div>
      {/* Scrolling ticker */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div className="ticker-content" style={{ paddingLeft: "20px" }}>
          {itemsHtml}
          {itemsHtml}
        </div>
      </div>
      {/* Right side */}
      <div style={{
        flexShrink: 0, padding: "0 12px",
        borderLeft: "1px solid var(--border-c)",
        display: "flex", alignItems: "center", gap: "6px",
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
        <span style={{ color: "var(--sub)", fontSize: "10px" }}>IST</span>
      </div>
    </div>
  );
}
