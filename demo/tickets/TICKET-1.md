Title: ENABLEMENT-1 — Watchlist movers endpoint + thin dashboard panel
Status / Priority: Ready / P1 (Enablement Topic 1 nested-skills demo)
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
- Topic 1 demo ticket. Apply fullstack-ticket-workflow and pause at
  “Proceed with implementation?” until confirmed. Then one
  feature-implementer vertical slice, then parallel code-reviewer +
  test-engineer + api-security-auditor. Do not fork-plan. Do not use
  best-of-N. Do not skip the Proceed? gate.
