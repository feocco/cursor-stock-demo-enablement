---
name: Persist price alerts
overview: Store each signed-in user's price alerts on the server and make the stock detail page read and write that list, while the existing 30-second client check keeps firing alerts.
todos:
  - id: schema
    content: Add a user-scoped PriceAlert model and migration
    status: pending
  - id: api
    content: Add authenticated create, list, delete, and mark-triggered alert routes
    status: pending
  - id: ui
    content: Point price alert utils, the hook, and the stock detail page at the server list
    status: pending
  - id: tests
    content: Cover create, list, and cross-user isolation
    status: pending
isProject: false
---

# SSIM-9 — Persist price alerts for the signed-in user

## Ticket

- Key: SSIM-9
- Type: Story
- Status: To Do
- Labels: feature
- Assignee: none
- Summary: Persist price alerts for the signed-in user
- Comments: none

Price alerts live only in `localStorage` (`frontend/utils/priceAlerts.js`, key `stockAlerts`). They are checked every 30 seconds while the tab is open (`frontend/hooks/usePriceAlerts.js`). A new browser, or a closed tab, has no alerts and will not fire them.

This is the storage and trigger path. The notifications page that lists fired alerts is a separate story and stays unimplemented.

## Acceptance criteria

- Create, list, and delete alerts through authenticated `/api/v1` routes, scoped to the current user.
- Alerts survive a reload in a second browser for the same user.
- The stock detail page reads and writes the server list.
- Tests cover create, list, and a user who cannot read another user's alerts.

## Implementation checklist

### Prerequisites

- [ ] Branch from `main` at `d29537a786fa1d28c3a4c8aa5e499a7e83e18a11`
- [ ] Do not add a notifications page
- [ ] Mirror watchlist layering: validator, service, controller, route, `backend/app.js`

### Backend implementation

#### API and routes

- [ ] `POST /api/v1/alerts` — create
- [ ] `GET /api/v1/alerts` — list the current user's alerts
- [ ] `DELETE /api/v1/alerts/:id` — delete
- [ ] `PATCH /api/v1/alerts/:id` — mark triggered (assumption below)
- [ ] Register the router in `backend/app.js`
- [ ] `authenticate` and `apiLimiter` on the router, matching `backend/routes/watchlistRoutes.js`

#### Services and controllers

- [ ] `backend/services/priceAlertService.js` — create, list by `userId`, delete with ownership, mark triggered with ownership
- [ ] `backend/controllers/priceAlertController.js` — thin handlers, `{ success: true, data }`
- [ ] `backend/validators/priceAlertValidators.js` — express-validator chains plus `handleValidationErrors`

#### Database

- [ ] `PriceAlert` on `User` in `prisma/schema.prisma`
- [ ] Prisma migration for `price_alerts`
- [ ] No seed changes

#### Files to modify (backend)

- `prisma/schema.prisma` — `PriceAlert` model and `User.priceAlerts`
- `prisma/migrations/<timestamp>_add_price_alerts/migration.sql` — table and index
- `backend/validators/priceAlertValidators.js` — new
- `backend/services/priceAlertService.js` — new
- `backend/controllers/priceAlertController.js` — new
- `backend/routes/priceAlertRoutes.js` — new
- `backend/app.js` — mount `/api/v1/alerts`

### Frontend implementation

#### Components

- [ ] `PriceAlertForm` creates through the server helper and surfaces a request error
- [ ] `PriceAlertsList` deletes through the server helper
- [ ] Keep existing molecules; do not add a notifications page

#### State and hooks

- [ ] `usePriceAlerts` loads the server list and still checks every 30 seconds
- [ ] On trigger, persist `triggered` so a later reload does not fire the same alert again

#### Pages and navigation

- [ ] `frontend/pages/StockDetail.jsx` reads and writes the server list for the current symbol
- [ ] Show loading and error states on the price alerts section

#### Files to modify (frontend)

- `frontend/utils/api.js` — `getPriceAlerts`, `createPriceAlert`, `deletePriceAlert`, `markPriceAlertTriggered`
- `frontend/utils/priceAlerts.js` — stop using `localStorage` key `stockAlerts`
- `frontend/hooks/usePriceAlerts.js` — load and refresh from the server
- `frontend/components/molecules/PriceAlertForm.jsx` — async create
- `frontend/components/molecules/PriceAlertsList.jsx` — async delete
- `frontend/pages/StockDetail.jsx` — server-backed symbol list

### Testing

#### Backend tests

- [ ] `tests/price-alerts-api.test.js` — create (201), list (200), other user list omits the alert, other user delete is 403, missing token is 401, invalid body is 400

#### Frontend tests

- [ ] No frontend test runner is configured (`tests/` is Jest + Supertest only). Do not add a new test framework.

#### Manual verification

- [ ] Not part of this rehearsal. Do not start the dev server for a click-through.

### Edge cases

- Missing or invalid token returns 401
- Another user's id returns 403 and does not delete or mark the row
- Unknown id returns 404
- Invalid symbol, condition, or non-positive target price returns 400
- Empty list renders the existing empty copy
- A failed create or delete shows an error and leaves the previous list in place
- Existing `localStorage` `stockAlerts` values are not migrated
- Triggered alerts stay out of the active symbol list

### Definition of done

- [ ] Acceptance criteria met
- [ ] Tests passing for the new API behavior
- [ ] No new lint issues in touched files
- [ ] API follows REST conventions in `.cursor/rules/backend-rest-api.mdc`
- [ ] Currency display uses `formatCurrency` where the UI shows a price

## API contract

All routes require `Authorization: Bearer <token>`. Success bodies use `{ success: true, data }`. Errors use the shared handler: `{ success: false, error }`.

Alert JSON (no `userId`):

```json
{
  "id": "uuid",
  "symbol": "AAPL",
  "condition": "ABOVE",
  "targetPrice": 200.5,
  "triggered": false,
  "triggeredAt": null,
  "createdAt": "2026-09-29T00:00:00.000Z"
}
```

| Method | Path | Body / params | Success | Errors |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/alerts` | `{ symbol, condition, targetPrice }` | 201 `{ success, data: { alert } }` | 400 invalid input, 401 |
| GET | `/api/v1/alerts` | none | 200 `{ success, data: { alerts } }` | 401 |
| DELETE | `/api/v1/alerts/:id` | path `id` uuid | 200 `{ success, message }` | 400, 401, 403, 404 |
| PATCH | `/api/v1/alerts/:id` | `{ triggered: true }` | 200 `{ success, data: { alert } }` | 400, 401, 403, 404 |

`condition` is `ABOVE` or `BELOW`. `symbol` is 1–10 chars, letters, numbers, and dots, stored uppercased. `targetPrice` is a finite number greater than 0. List returns only rows for `req.user.id`, newest first. Delete and patch of another user's row return 403. A missing row returns 404.

### Assumption

The ticket names create, list, and delete. The current client also writes `triggered` when the 30-second check fires. `PATCH /api/v1/alerts/:id` persists that flag so a second browser reload does not fire the same alert again. It is not an extra acceptance criterion.

## Backend tasks

1. Add `PriceAlert` with `userId`, `symbol`, `condition`, `targetPrice` (Float), `triggered` (default false), `triggeredAt` (optional), `createdAt`, cascade delete from `User`, and `@@index([userId])`. Map to `price_alerts`.
2. Add a migration. Tests apply migrations with `prisma migrate deploy` in `tests/setup/globalSetup.js`.
3. Service uses Prisma and `NotFoundError` / `ForbiddenError` / `ValidationError` the same way `watchlistService.js` does.
4. Do not log tokens or alert ownership internals beyond the existing auth logger.

## Frontend tasks

1. Add named helpers on `api` in `frontend/utils/api.js`. They go through `apiRequest` and throw on non-2xx.
2. Replace `localStorage` in `frontend/utils/priceAlerts.js` with those helpers. Keep `AlertCondition`, the 30-second check, and browser notification permission.
3. `usePriceAlerts` loads alerts on mount, refreshes after a trigger write, and still checks every 30 seconds against the quotes it is given.
4. Stock detail filters the loaded list to the current symbol and active (`triggered === false`) alerts. Create and delete call the server, then refresh.
5. Prices shown in the form and list keep `formatCurrency`. Do not add a notifications center.

## Test plan

`tests/price-alerts-api.test.js` with Supertest, two registered users, and the helpers in `tests/helpers/testConfig.js`:

- POST creates an alert for the caller and returns 201 plus the alert shape
- GET returns that alert for the owner
- GET for a second user does not include the first user's alert
- DELETE by the second user returns 403 and the owner's GET still includes the alert
- POST without a token returns 401
- POST with a bad condition or non-positive price returns 400

## Out of scope

- A page that lists fired alerts
- Migrating old `localStorage` alerts
- Changing trade, portfolio, or watchlist behavior

## Proposed pipeline

1. Implement: `feature-implementer`
2. Review in parallel: `code-reviewer`, `test-engineer`, `api-security-auditor`
3. Validate: `validate-implementation`

## Risks

- Making create/delete async changes every current caller of `priceAlerts.js`. Update all of them in this slice.
- SQLite test database is rebuilt from migrations. A schema change without a migration will fail `npm test`.
