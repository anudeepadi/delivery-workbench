# AKB1 Command Center

A delivery-planning workspace for KPI calculations, risk assessment, sprint capacity, estimates, and AI-assisted analysis.

AKB1 brings a set of related planning tools into one keyboard-accessible interface. It combines a React client with an Express server, local SQLite persistence, and optional streaming Gemini chat. The project demonstrates a compact full-stack application that can run as a single service.

[Run locally](#run-locally) · [Architecture](#architecture) · [Code guide](#code-guide)

## Capabilities

| Area | Included tools |
| --- | --- |
| Delivery planning | Sprint capacity, estimation, pricing, decision comparison |
| Reporting | KPI calculators, risk register, status-report drafts |
| AI assistance | Streaming chat with saved sessions and a delivery-oriented system prompt |
| Prompt tooling | Prompt templates, a structured prompt builder, and model guidance |
| Workspace | Command palette, responsive navigation, persisted tool drafts |

Calculators and reports operate on entered values and seeded examples. They are not automatic integrations with a company's delivery systems. Without a Gemini key, chat uses a demonstration response.

## Architecture

```mermaid
flowchart LR
    User["Browser"] --> UI["React, Vite and TanStack Query"]
    UI -->|HTTP and SSE| API["Express application"]
    API --> Store["Storage layer: node:sqlite"]
    Store --> DB[("SQLite file")]
    API -->|configured chat requests| Gemini["Gemini API"]
    Gemini -->|streamed response| API
    API -->|no API key| Demo["Demo response"]
    API --> Static["Built client assets"]
```

Persistence uses Node's built-in `node:sqlite` directly. Drizzle-related files remain in the repository, but the running storage layer is [server/storage.ts](server/storage.ts). Express serves the API and the built frontend in production; Vite is attached during development.

## Run locally

Requires **Node.js 25.6.0 or newer**, as specified by the package, and npm.

```bash
git clone https://github.com/anudeepadi/AKB1-Command-Center.git
cd AKB1-Command-Center
npm ci
cp .env.example .env
npm run dev
```

Open [localhost:5000](http://localhost:5000). SQLite tables and seed data are initialized by the storage layer. No external database service is required.

| Variable | Default / purpose |
| --- | --- |
| `PORT` | `5000` |
| `HOST` | Loopback in development; all interfaces in production |
| `SQLITE_DB_PATH` | `data/akb1.sqlite` |
| `GEMINI_API_KEY` | Optional; enables provider-backed chat |
| `GEMINI_MODEL` | `gemini-2.5-flash`, subject to provider availability |

The server loads `.env` at startup. Chat requests send conversation context to Gemini when configured; saved history remains in the application's database.

## Build and check

```bash
npm run check
npm run build
npm start
```

`GET /api/health` is the health endpoint. There is no test command declared in the package; type checking and building are the available baseline checks.

For a container deployment, use the included [Dockerfile](Dockerfile) and persist the SQLite directory on a volume. A disposable container filesystem will not preserve chat history or drafts across replacements.

## Code guide

| Path | Responsibility |
| --- | --- |
| [client/src/components/tabs/](client/src/components/tabs/) | Planning and reporting modules |
| [client/src/hooks/use-tool-draft.ts](client/src/hooks/use-tool-draft.ts) | Draft persistence from the UI |
| [server/routes.ts](server/routes.ts) | Bootstrap, sessions, drafts, and streaming chat |
| [server/storage.ts](server/storage.ts) | SQLite schema, seeds, and data access |
| [shared/contracts.ts](shared/contracts.ts) | Client/server domain contracts |
| [script/build.ts](script/build.ts) | Frontend and server build |

## Scope and contributions

This is a portfolio application with a shared workspace, not a tenant-isolated enterprise product. The current routes do not provide per-user authentication and authorization. Keep personal experimentation local; hosted multi-user use needs an access-control design.

Useful contributions include calculator examples, input validation, accessibility improvements, and tests for persistence and streaming. Describe the affected module and include steps to reproduce any behavior change.

## License

[package.json](package.json) declares MIT, but a standalone license file is not currently tracked. Clarify repository-wide licensing before redistributing a release.
