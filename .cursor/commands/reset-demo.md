# Reset Demo

Reset the repository to a clean demo state by removing implemented features (dark/light mode, stock charts) and clearing plan files.

## ⚠️ CRITICAL: Protect Commands Folder

**NEVER delete, modify, or overwrite files in `.cursor/commands/`**

Before making ANY changes, verify the commands folder exists and list its contents:
```bash
ls -la .cursor/commands/
```

Store the count of command files to verify later. These files must survive the reset:
- `inject-debug-bug.md`
- `reset-demo.md`
- `start-demo.md`

**Skills folder:** Do not delete or modify `.cursor/skills/` (e.g. `code-review`, `create-implementation-checklist`, `do-ticket`, `validate-implementation`, `fork-plan`, `fullstack-ticket-workflow`).

**Agents folder:** Do not delete or modify `.cursor/agents/` (e.g. `feature-implementer`, `test-engineer`, `code-reviewer`, `api-security-auditor`).

**Rules folder:** Do not delete `.cursor/rules/` (including `nested-skills-unattended.mdc`, `backend-rest-api.mdc`, `frontend-format-currency.mdc`).

**Demo harness:** Do not delete `DEMO_TRIMBLE.md` or `demo/tickets/`.

## Task

1. **Clear all plan files**:
   - Delete ONLY files in `.cursor/plans/` directory
   - Use explicit path - never use wildcards that could match commands:
   ```bash
   rm -f .cursor/plans/*.plan.md
   ```
   - Do NOT run `rm` on `.cursor/` directly
   - Do NOT use recursive delete flags (-r, -rf) on .cursor/

2. **Remove dark/light mode toggle** (if it exists):
   - Check if `ThemeContext.jsx` or `ThemeProvider` exists in `frontend/context/`
   - If found, delete the theme context file
   - Remove theme toggle button from `Header.jsx` or `Layout.jsx`
   - Remove `useTheme` imports and usage from components
   - Reset any CSS/Tailwind dark mode classes to use only dark theme
   - Ensure `Layout.jsx` uses static `bg-gray-900` (dark theme only)
   - If no theme toggle exists, skip this step

3. **Remove stock price charts from StockDetail page**:
   - In `frontend/pages/StockDetail.jsx`:
     - Remove `StockChart` import if present
     - Remove `<StockChart />` component usage if present
     - Ensure the page shows "Price Summary" section without chart
   - Keep `StockChart.jsx` file intact (for demo to add later)

4. **Remove mini sparklines from stock cards**:
   - In `frontend/components/molecules/StockCard.jsx`:
     - Set `showChart` default to `false` OR remove `MiniSparkline` rendering
   - Keep `MiniSparkline.jsx` file intact (for demo to add later)

5. **Reset any theme-related CSS**:
   - Check `frontend/index.css` and `tailwind.config.js` for dark mode configuration
   - Ensure app defaults to dark theme without toggle capability

6. **Clean up any unused imports**:
   - After removing features, clean up any orphaned imports in modified files

7. **Kill any running dev servers**:
   - Kill processes on ports 3000-3009 to ensure clean state:
   ```bash
   lsof -ti:3000,3001,3002,3003,3004,3005,3006,3007,3008,3009 | xargs kill -9 2>/dev/null || true
   ```

8. **Verify commands folder is intact**:
   - List contents of `.cursor/commands/` and confirm all 3 command files still exist
   - If any are missing, STOP and alert the user immediately

## Important Notes

- **🚫 NEVER delete `.cursor/commands/`** - this folder contains these instructions!
- **Preserve component files**: Do NOT delete `StockChart.jsx` or `MiniSparkline.jsx` - these will be added during demo
- **Preserve backend**: Do not modify backend endpoints - they should remain functional
- **Git status**: After changes, do NOT commit automatically - leave changes for review

## Verification

After running, verify:
- [ ] `.cursor/commands/` has all 3 command files (list them to confirm)
- [ ] `.cursor/skills/` is unchanged
- [ ] `.cursor/plans/` is empty (no .plan.md files)
- [ ] No theme toggle visible in UI
- [ ] StockDetail page shows price summary without chart
- [ ] StockCard components don't show sparklines
- [ ] Dev servers are stopped (ports 3000, 5173 are free)

## Next Steps

Run `/start-demo` to create a fresh demo branch and start the dev servers.

## Output

Provide a summary of:
- Confirmation that all 3 commands still exist in `.cursor/commands/` and skills folder is intact
- Number of plan files deleted
- Components modified
- Features removed
- Any errors encountered
