---
name: fullstack-ticket-workflow
description: "Orchestrates a full-stack ticket workflow for the stock demo (pasted ticket supported; Jira/Linear optional): fetch ticket context, create an implementation checklist and unified plan, then run a single-ticket pipeline of one fullstack implementer followed by a parallel review/test/security pass. Use when the user wants to plan and execute a ticket end-to-end."
---

# Fullstack Ticket Workflow

Use this skill to turn a ticket into an end-to-end implementation using role-based subagents. The default is a **single-ticket pipeline**: one agent implements the feature as a vertical slice, then specialist agents review, test, and security-audit the result in parallel. The ticket can come from pasted content or, when available, the Jira (Atlassian) or Linear MCP.

This is a planning workflow first: do not modify product code or launch implementation subagents until the user approves the plan.

## Workflow

1. **Fetch ticket context**
   - Accept the ticket from pasted content, or parse a Jira issue key/URL or Linear ID/URL from the user message.
   - If no ticket content or reference is provided, ask for one before continuing (a pasted ticket is fine).
   - Apply the `do-ticket` workflow: resolve the ticket source (pasted content first, then Jira/Linear MCP when available) and gather details, description, comments, acceptance criteria, labels, assignee, priority, and related issues.

2. **Create an implementation checklist**
   - Apply `create-implementation-checklist`.
   - Analyze the repo before drafting the checklist.
   - Include prerequisites, backend work, frontend work, testing, edge cases, and definition of done.

3. **Create a unified plan**
   - Save the plan to `.cursor/plans/<ticket-lowercase>.plan.md`.
   - Include ticket summary, acceptance criteria, the API contract (if the feature spans API and UI), backend tasks, frontend tasks, test plan, and edge cases.
   - Include YAML frontmatter: `name`, `overview`, `todos`, and `isProject`.
   - Define the shared API contract explicitly — method, path, query/body params, response JSON, error states — so the single implementer builds the backend and frontend against one seam. If the contract is ambiguous, draft a proposed contract and call it out as an assumption.

4. **Pause before execution**
   - Do not launch subagents automatically.
   - Present the ticket summary, plan path, task count, the API contract, the proposed pipeline, and any risks.
   - Ask: `Proceed with implementation?`

5. **Execute the pipeline** (only after approval)
   - **Implement**: launch one `feature-implementer` subagent to build the whole vertical slice (backend + frontend) from the plan.
   - **Review pass**: once implementation reports back, launch these in a single parallel tool call, since they are read-only/non-conflicting:
     - `code-reviewer` — quality, API design, contract match, project rules.
     - `test-engineer` — add/extend Jest/Supertest and component tests.
     - `api-security-auditor` — focused security pass on any backend/API changes.
   - **Resolve**: feed findings back to `feature-implementer` (or fix directly) and re-run `test-engineer` if code changed.

6. **Validate**
   - Apply `validate-implementation` against the plan's acceptance criteria and project standards before sign-off.

## Optional parallelization patterns

Use these only when they genuinely fit — the single-ticket pipeline above is the default.

- **Cross-ticket fan-out** — when there are several independent tickets, launch one `feature-implementer` per ticket in parallel. Safe because each owns a different feature and touches different files. This is the realistic way to parallelize; it needs multiple tickets.
- **Best-of-N** — for a hard or ambiguous task, launch multiple `best-of-n-runner` attempts on the same plan in isolated worktrees, then pick the best result.
- **Layered backend/frontend fork** — only when the backend and frontend seam is genuinely clean and the contract is locked. Apply the `fork-plan` skill to split into `<ticket>-backend.plan.md` and `<ticket>-frontend.plan.md` and run two implementers. Do not use this as the default — most single tickets do not bisect cleanly.

## Execution Prompt Templates

Use these prompts only after the user approves execution.

### Implement (single fullstack agent)

```md
Execute `.cursor/plans/<ticket>.plan.md` as a vertical slice.

Use the `feature-implementer` agent conventions. Build the backend against the plan's API contract, then the frontend that consumes it. Apply the `scaffold-api-endpoint` and `scaffold-ui-component` skills where relevant. Report the API contract, files changed, how it's wired, and verification (lint/tests).
```

### Review pass (launch in parallel after implementation)

```md
Review the implementation of `.cursor/plans/<ticket>.plan.md`.

- code-reviewer: run the code-review checklist against the diff; return prioritized findings.
- test-engineer: add/extend tests for the new behavior; run them and report results.
- api-security-auditor: audit any backend/API changes; return findings by severity.
```

## Output Format

```md
## Ticket
<id> - <title>

## API Contract
<method/path and short response-shape summary, or "N/A">

## Plan Created
- `.cursor/plans/<ticket-lowercase>.plan.md` (<n> todos)

## Proposed Pipeline
1. Implement: `feature-implementer`
2. Review (parallel): `code-reviewer`, `test-engineer`, `api-security-auditor`
3. Validate: `validate-implementation`

## Optional
- <fan-out / best-of-N / layered fork, only if it fits, or "None">

## Risks / Assumptions
- <unclear contract, shared dependency, or "None">

## Approval Needed
Proceed with implementation?
```
