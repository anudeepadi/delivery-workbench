# Standalone demo: design notes

This is a zero-dependency browser demo of the Delivery Workbench sprint-capacity idea. It runs separately from the full React/Express/SQLite application. There is no server, no account and no AI connection.

## What it has to show

Changing one planning input (a person on leave, a holiday, more meetings) changes a planning decision you can defend, and the arithmetic stays visible.

Formulas come from the full app's Sprint Planner (`client/src/components/tabs/SprintTab.tsx`):

- Available hours = people × days × hours per day × focus %. This is the app's `hrsPerSpr = team × weeks × 5 × 8 × capacity%`, with days and hours per day as explicit inputs.
- Recommended commitment = 90% of capacity (the app's "Recommended commit").
- Capacity utilization = committed ÷ available. The app's benchmark table puts the healthy band at 85–95% and treats anything above 95% as overcommitted.

These thresholds are planning heuristics taken from the app. They are not guarantees, and the demo says so.

## Three directions

### 1. Ledger sheet (chosen)

Shown as a ruled calculation sheet, the way a delivery lead checks capacity on paper. Each line shows the real numbers substituted into the formula. The available-hours total gets an accountant's double rule, and the decision sits directly under the line that produced it. A small "what moves the number" table prices common changes: one more person, one sprint day lost, ten focus points lost to meetings.

- Uses the product's existing Warm Earth tokens: linen `#EBEAE6`, surface `#F5F4F1`, charcoal `#312C29`, muted `#8A837D`.
- Figures use monospaced tabular numbers. Square corners, hairline rules, no shadows.
- Status colors are darkened versions of the app's green, gold and red so the text meets contrast requirements. Every status also has a text label, so color is never the only signal.

### 2. Load gauge

An instrument-panel dial for load %, with needle zones for under, healthy and over. Rejected because a gauge hides the multiplication that makes the number defensible, and a dark dashboard look doesn't match the product.

### 3. Planning board

Sticky-note cards for people and days, dragged onto a sprint lane. Rejected because it's slow to edit precisely, it's hard to make accessible with native controls, and it drifts toward a generic card kit.

## Layout and behavior

- One workbench view. On wide screens the inputs sit on the left and the ledger on the right, with the delivery draft below. On phones everything stacks in a single column.
- Native `<input type="number">` controls with labels, units, min/max and inline error text linked through `aria-describedby`.
- Results recalculate as you type. Only the decision line is announced (`role="status"`).
- Empty state: there are no inputs yet, so the page explains what to enter. Invalid state: every bad field is named and no result is shown.
- Draft: the name, goal and notes are saved to `localStorage` together with the current inputs. After saving, the demo reads the draft back to confirm it. JSON export always works. If storage is blocked, the Save and Delete buttons are disabled and the page explains why.
- Visible 2px focus outlines. `prefers-reduced-motion` removes the only transition.
