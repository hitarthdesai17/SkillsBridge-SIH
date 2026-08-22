# Phase 5: Learning Notes & Insights

## Key Learnings

1. **Decoupling Visual Styling from Data Fixtures**:
   - The reference project intertwined UI components with mock data (`Aarav Sharma`). Decoupling these into universal reusable UI components (`GlassPanel`, `ProgressRing`, `Badges`, `AppShell`) enabled a seamless migration without polluting the real Supabase schema.

2. **Parallel Diagnostic Fetching on Dashboard**:
   - Fetching diagnostic results concurrently via `Promise.all` in `src/app/dashboard/page.tsx` maintained high responsiveness while rendering real-time readiness scores across all opportunities.

3. **Grounded Mathematical Integrity**:
   - Keeping the readiness score formula ($0.50 S_{\text{match}} + 0.30 E_{\text{proof}} + 0.20 X_{\text{align}}$) strictly on the server prevented any client-side mathematical divergence.
