# GST Invoice Pro

## Current State

The InvoiceGenerator (`src/frontend/src/pages/InvoiceGenerator.tsx`) is a single-file, fully self-contained invoice editor. It already includes:
- Inline editable invoice fields (title, company, customer, dates, notes, terms)
- Dynamic row table with add/delete and auto-calculated totals
- GST toggle and manual adjustment
- Save/Load with localStorage (via `loadEntries`, `saveEntry`, `deleteEntry` helpers)
- Auto-save toggle in right sidebar
- PDF export via `html2canvas` + `jsPDF` (loaded from CDN in `index.html`)
- Print via portal clone + `window.print()`
- Dark/light mode, logo upload, reset

## Requested Changes (Diff)

### Add
- PNG export option (secondary, using html2canvas alone — download as PNG)
- Loading spinner visible during export (already exists but ensure it's displayed correctly)
- Success/error toast messages after save and export

### Modify
- **CRITICAL — Print styles in `index.html`**: Change the `@media print` rule to target `#inv-print-portal` and `#inv-print-area` (not `#print-area` which doesn't exist). Add proper `@page { margin: 12mm }` instead of `margin: 0`.
- **PDF Export (`handleDownloadPDF`)**: The current implementation clones the `#inv-print-area` into a detached wrapper and calls `html2canvas`. Key fixes needed:
  1. Ensure the off-screen wrapper is NOT using `position:fixed` which may cause clipping — use `position:absolute; top:-9999px; left:-9999px` (already done but verify `z-index` doesn't interfere).
  2. Before calling html2canvas, explicitly set `height: auto; overflow: visible; max-height: none` on the clone and every child.
  3. Pass `scrollY: -window.scrollY, scrollX: -window.scrollX` to html2canvas to prevent offset issues.
  4. Also pass `allowTaint: true` to handle any cross-origin resources.
  5. Wait a brief `setTimeout(200ms)` after appending the wrapper to DOM before calling html2canvas, giving browser time to render.
- **Print (`handlePrint`)**: Current implementation clones to `#inv-print-portal`. Ensure the portal clone also has `height: auto; overflow: visible; max-height: none` set on the cloned root element before triggering print.
- **Right sidebar auto-save toggle**: Currently wired to `autoSave` state but the `useEffect` that watches invoice changes for auto-save needs to be verified and fixed if not triggering.
- **`inv-print-css` style injection**: The injected `@media print` CSS in the `useEffect` must match `#inv-print-portal` correctly — verify it hides everything except the portal.

### Remove
- Nothing removed

## Implementation Plan

1. **Fix `index.html`** — Update the `@media print` style block to reference `#inv-print-portal` instead of `#print-area`, and set `@page { margin: 12mm }`.
2. **Fix `handleDownloadPDF`** — Apply the 5 fixes above: proper positioning, `height:auto/overflow:visible` on clone and all children, `scrollX/scrollY` passed to html2canvas, `allowTaint:true`, and 200ms delay before capture.
3. **Fix `handlePrint`** — Ensure clone root has `height:auto; overflow:visible; max-height:none` before printing.
4. **Fix print CSS injection** — Verify the `useEffect`-injected print styles correctly target `#inv-print-portal`.
5. **Add PNG export** — Add `handleDownloadPNG` function (uses html2canvas only, downloads as PNG) and a "Download PNG" button next to the PDF button in the right sidebar and top bar.
6. **Verify auto-save `useEffect`** — Ensure the useEffect depends on `[invoice, autoSave]` and calls `saveEntry` (debounced 1500ms) when autoSave is true.
7. **Toast messages** — Ensure all export/save/load actions show appropriate loading, success, and error toasts.
