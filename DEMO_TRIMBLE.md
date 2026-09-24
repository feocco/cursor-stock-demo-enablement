# Trimble enablement — Topic 1: nested skills

This fork is the **skills-only** harness for Joe Feocco’s Trimble enablement session on nested skills. Nate Lauf’s stock-trading demo stays intact; this file is the live-demo script, not a product rewrite.

**Scope of this repo:** `.cursor/skills`, `.cursor/agents`, and the rules that let a cloud agent run the pipeline without pausing on reversible steps. Do **not** pitch Cursor Projects or pstack from this checkout — those are other topics.

App runbook (unchanged): [README.md](./README.md). Backend extras: [BACKEND_SETUP.md](./BACKEND_SETUP.md).

---

## 1. Skill inventory (exact names + invoke paths)

Skills live at `.cursor/skills/<skill-name>/SKILL.md`. Cursor loads them by folder name. In Agent chat you can:

- type `/<skill-name>` (slash-skill), or
- say `Apply the <skill-name> skill` / `Use <skill-name>`, or
- attach `@.cursor/skills/<skill-name>/SKILL.md`.

Custom subagents live at `.cursor/agents/<agent-name>.md`. The parent agent launches them with the Task tool and `subagent_type: <agent-name>`.

### Orchestrator (parent Agent)

| Skill name | Path | How it is invoked |
|---|---|---|
| `fullstack-ticket-workflow` | `.cursor/skills/fullstack-ticket-workflow/SKILL.md` | **Primary Topic 1 skill.** `/fullstack-ticket-workflow` or “run the fullstack ticket workflow on this ticket”. Orchestrates the pipeline below. |
| `do-ticket` | `.cursor/skills/do-ticket/SKILL.md` | Nested by the orchestrator (step 1). Also `/do-ticket`. Pasted ticket first; Jira/Linear MCP optional. |
| `create-implementation-checklist` | `.cursor/skills/create-implementation-checklist/SKILL.md` | Nested by the orchestrator (step 2). Also `/create-implementation-checklist`. |
| `validate-implementation` | `.cursor/skills/validate-implementation/SKILL.md` | Nested by the orchestrator after the review pass. Also `/validate-implementation`. |
| `fork-plan` | `.cursor/skills/fork-plan/SKILL.md` | **Optional / off-script.** Split a plan into backend + frontend. Do **not** use for TRIMBLE-1. |

### Implementer (one vertical-slice subagent)

| Name | Kind | Path | How it is invoked |
|---|---|---|---|
| `feature-implementer` | Custom subagent | `.cursor/agents/feature-implementer.md` | Orchestrator launches **one** Task with `subagent_type: feature-implementer`. |
| `scaffold-api-endpoint` | Skill | `.cursor/skills/scaffold-api-endpoint/SKILL.md` | Applied **inside** `feature-implementer` when adding `backend/` routes. |
| `scaffold-ui-component` | Skill | `.cursor/skills/scaffold-ui-component/SKILL.md` | Applied **inside** `feature-implementer` when adding `frontend/components/`. |

### Parallel review pass (three subagents, one tool call)

| Name | Kind | Path | How it is invoked |
|---|---|---|---|
| `code-reviewer` | Custom subagent | `.cursor/agents/code-reviewer.md` | Task `subagent_type: code-reviewer` after implementer returns. |
| `code-review` | Skill | `.cursor/skills/code-review/SKILL.md` | Applied **inside** `code-reviewer`. |
| `test-engineer` | Custom subagent | `.cursor/agents/test-engineer.md` | Task `subagent_type: test-engineer` in the **same** parallel call. |
| `api-security-auditor` | Custom subagent | `.cursor/agents/api-security-auditor.md` | Task `subagent_type: api-security-auditor` in the **same** parallel call. |

### Supporting (not the Topic 1 story)

| Name | Path | Notes |
|---|---|---|
| `create-pr` | `.cursor/skills/create-pr/SKILL.md` | PR helper. Not required to show nesting. |
| `/start-demo` | `.cursor/commands/start-demo.md` | Nate’s clean-branch + servers command. |
| `/reset-demo` | `.cursor/commands/reset-demo.md` | Nate’s reset. Preserves skills/agents. |
| `/inject-debug-bug` | `.cursor/commands/inject-debug-bug.md` | Nate’s debug-mode demo. Off-script for Topic 1. |

### Pipeline Joe should narrate

```
fullstack-ticket-workflow          ← parent Agent (orchestrator)
 ├─ do-ticket
 ├─ create-implementation-checklist
 ├─ write .cursor/plans/trimble-1.plan.md
 ├─ feature-implementer            ← one nested implementer
 │   ├─ scaffold-api-endpoint
 │   └─ scaffold-ui-component
 ├─ [parallel]
 │   ├─ code-reviewer  (+ code-review skill)
 │   ├─ test-engineer
 │   └─ api-security-auditor
 └─ validate-implementation
```

Project rules the pipeline already honors:

- `.cursor/rules/backend-rest-api.mdc` — `/api/v1/...`, `{ success, data }`, status codes.
- `.cursor/rules/frontend-format-currency.mdc` — money via `formatCurrency`.
- `.cursor/rules/nested-skills-unattended.mdc` — **this fork:** do not pause on reversible steps (plan write, implementer, parallel reviewers, tests).

---

## 2. Ready-to-paste demo ticket (TRIMBLE-1)

Copy everything in the block below into Agent chat (or attach `@demo/tickets/TRIMBLE-1.md`).

```md
Title: TRIMBLE-1 — Watchlist movers endpoint + thin dashboard panel
Status / Priority: Ready / P1 (Trimble Topic 1 nested-skills demo)
Description:
Traders can see today's biggest gainer and loser on their watchlist without
opening every quote. Add one authenticated read endpoint and a thin dashboard
panel. Do not rebuild Watchlist Highlights, Watchlist News, or client-side
price alerts.

Existing seams to reuse (do not invent a parallel stack):
- Auth + limiter already wrap `backend/routes/watchlistRoutes.js`
- Ownership via `watchlistService.getWatchlistById(id, userId)`
- Quotes via `stockService.getStockQuote(symbol)` (`price`, `change`, `changePercent`)
- Frontend client: `frontend/utils/api.js`
- Dashboard mount: `frontend/pages/Dashboard.jsx` (below Watchlist Highlights,
  above Watchlist News)
- Currency: `formatCurrency` from `frontend/utils/calculations.js`

Acceptance Criteria:
1. GET /api/v1/watchlists/:id/movers
   - Auth required (existing `authenticate` + `apiLimiter` on the watchlist router).
   - 200 + `{ success: true, data: { movers, asOf } }` when the caller owns the list.
   - `movers` shape:
     {
       "gainers": [{ "symbol", "price", "change", "changePercent" }],
       "losers":  [{ "symbol", "price", "change", "changePercent" }],
       "unchanged": [{ "symbol", "price", "change", "changePercent" }]
     }
   - `gainers` sorted by `changePercent` desc; `losers` by `changePercent` asc.
   - Cap each of gainers/losers at 3 items. Omit a symbol that fails to quote;
     do not fail the whole request.
   - 400/422 on invalid UUID; 401 without auth; 403 if not owner; 404 if missing.
   - Optional query `limit` (1–3, default 3) validated in
     `backend/validators/watchlistValidators.js`.
2. Thin UI: new organism `frontend/components/organisms/WatchlistMovers.jsx`
   - Visible heading exactly: `Watchlist Movers`
   - Uses a new helper `api.getWatchlistMovers(watchlistId, { limit })` in
     `frontend/utils/api.js` (no raw fetch in the component).
   - Loading, error, and empty states:
     - empty watchlist / no quotes: `Add stocks to your watchlist to see today's movers`
     - error: `Unable to load watchlist movers`
   - Render up to 3 gainers and 3 losers. Prices and change amounts use
     `formatCurrency`. Percent via `formatPercentage`.
   - Mount on Dashboard between Watchlist Highlights and Watchlist News.
   - Do not add a new route or page.
3. Tests: Jest + Supertest coverage for success, 401, 403/404, and bad id
   (follow `tests/watchlist-news.test.js`).
4. Keep existing watchlist CRUD, news, highlights, and price-alert UI working.

Comments:
- Topic 1 demo ticket. Apply fullstack-ticket-workflow unattended (see
  .cursor/rules/nested-skills-unattended.mdc). Single feature-implementer
  vertical slice, then parallel code-reviewer + test-engineer +
  api-security-auditor. Do not fork-plan. Do not use best-of-N.
```

Same ticket as a file you can @-mention: [`demo/tickets/TRIMBLE-1.md`](./demo/tickets/TRIMBLE-1.md).

---

## 3. Ready-to-paste orchestrator prompt

Paste this **above** the ticket (or as the only message if you @-attached the ticket file):

```md
Apply the fullstack-ticket-workflow skill to the TRIMBLE-1 ticket below.

This is the Trimble Topic 1 nested-skills demo. Execute unattended:
- Write the plan to `.cursor/plans/trimble-1.plan.md`.
- Do not ask “Proceed with implementation?”
- After the plan exists, launch one `feature-implementer` subagent.
- When it returns, launch `code-reviewer`, `test-engineer`, and
  `api-security-auditor` in a single parallel tool call.
- Apply `validate-implementation` before you sign off.
- Stay on a feature branch. Do not use fork-plan, best-of-N, or layered
  backend/frontend split.

Ticket:
```

Then paste the TRIMBLE-1 block from section 2.

Shorter variant if the ticket file is attached:

```md
Apply fullstack-ticket-workflow to @demo/tickets/TRIMBLE-1.md and execute unattended per .cursor/rules/nested-skills-unattended.mdc.
```

---

## 4. Ten-minute click script (live)

Assumes Cursor Agent (or a Cloud Agent on this repo) and the app startable per README. Times are talk track, not guarantees of model latency.

| Min | What Joe does | What to point at (expected cues) |
|---|---|---|
| 0:00 | Open this repo. In the file tree expand `.cursor/skills` and `.cursor/agents`. | Folders named `fullstack-ticket-workflow`, `do-ticket`, `feature-implementer`, `code-reviewer`, `test-engineer`, `api-security-auditor`. Say: “skills are markdown the parent agent applies; agents are nested workers.” |
| 0:45 | Optional: `/start-demo` **or** follow README (`npm run server:dev` + `npm run dev`). | Backend `http://localhost:3000/health`, frontend `http://localhost:5173`. Dashboard already shows **Watchlist Highlights** and **Watchlist News**. There is **no** “Watchlist Movers” heading yet. |
| 1:15 | New Agent chat. Paste the orchestrator prompt + TRIMBLE-1 ticket (section 3). Send. | Agent applies **`fullstack-ticket-workflow`**. You should see it resolve the pasted ticket via **`do-ticket`**, then emit a checklist via **`create-implementation-checklist`**. |
| 2:00 | Do not click “approve” / do not type “proceed”. | Plan file appears: `.cursor/plans/trimble-1.plan.md` with an **API Contract** for `GET /api/v1/watchlists/:id/movers`. The unattended rule skips the old “Proceed with implementation?” pause. |
| 2:30 | When the implementer starts, click its subagent card. | One nested **`feature-implementer`**. Inside it, look for `scaffold-api-endpoint` / `scaffold-ui-component` mentions. Files you expect: `watchlistRoutes.js`, `watchlistController.js`, `watchlistService.js`, `watchlistValidators.js`, `frontend/utils/api.js`, `WatchlistMovers.jsx`, `Dashboard.jsx`, `tests/watchlist-movers.test.js` (or similar). |
| 5:30 | After implementer reports back, wait for the review wave. | **Three** sibling subagent cards in one turn: **`code-reviewer`**, **`test-engineer`**, **`api-security-auditor`**. That is the nesting punchline. |
| 7:30 | Refresh `http://localhost:5173`. Add AAPL (and optionally TSLA) via search → stock page → Add to Watchlist if the list is empty. | Dashboard cues: heading **Watchlist Movers**; gainer/loser rows with `$X,XXX.XX` (formatCurrency); empty copy **Add stocks to your watchlist to see today's movers** if the list is empty; **Unable to load watchlist movers** if the API errors. Highlights + News still present. |
| 9:00 | Optional curl (auth token from `POST /api/v1/auth/default`): `GET /api/v1/watchlists/:id/movers`. | `{ "success": true, "data": { "movers": { "gainers", "losers", "unchanged" }, "asOf": "..." } }`. |
| 9:30 | Close: one skill orchestrated four roles; reviewers ran in parallel; this checkout is skills-only. | Point back at `.cursor/skills/fullstack-ticket-workflow/SKILL.md` — the pipeline is literally in the file. |

### If something stalls

- Agent asks “Proceed with implementation?” → reply `Yes, execute unattended` (the rule should have skipped this; treat as a miss).
- No subagent cards → confirm you are in **Agent** mode, not Ask, and that `.cursor/agents/*.md` is present.
- Dashboard unchanged → confirm both servers are up and you hard-refreshed; the new heading is **Watchlist Movers**.
- App broken → `git checkout -- frontend backend` on the demo-run branch and restart; this harness PR does not change product code.

---

## 5. What this demo is / is not

**Is:** a brownfield repo where a parent skill composes other skills and launches role-based subagents. The ticket is sized so the file list and UI heading are obvious on a projector.

**Is not:** a Cursor Projects walkthrough, a pstack walkthrough, or a claim that Trimble must adopt this exact pipeline. Nate’s `/start-demo`, `/reset-demo`, and `/inject-debug-bug` commands still work for his original session.
