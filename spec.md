# Page Crafter — Invoice Table Edit, Delete, Print Fixes

## Current State
- InvoiceGenerator.tsx has a working invoice layout with DynamicTable components
- DynamicTable already has input fields per cell, Add Row button, and X delete button
- However, the row delete button is `opacity-0` by default (only shows on hover), making it invisible/hard to use
- No Print button exists; only PDF/PNG export via html2canvas
- No `@media print` CSS exists for browser print
- Amount column is readOnly (correct, auto-computed) but should be visually clear
- GST label already correctly reads "GST (18%)" in TotalsSection

## Requested Changes (Diff)

### Add
- Print button in the top bar of InvoiceGenerator: calls `window.print()`
- `@media print` CSS in index.css for A4 layout:
  - Hide sidebar, topbar, export controls, back button when printing
  - Show only `#invoice-preview` at full width
  - Set A4 page size (210mm x 297mm) with 15mm margins
  - Ensure no overflow cut, scale-to-fit
  - `page-break-inside: avoid` on tables
- Print layout button icon: use `Printer` from lucide-react

### Modify
- DynamicTable.tsx: Remove `opacity-0 md:opacity-0` from the row delete button — make it always visible. Change icon from `X` to `Trash2` (trash bin). Optionally keep tooltip "Remove row".
- DynamicTable.tsx: The row delete button should also be slightly larger for easier clicking (w-6 h-6)
- DynamicTable.tsx: The Add Row button should be styled more prominently (border, padding, hover state)

### Remove
- Nothing to remove

## Implementation Plan
1. Edit `src/frontend/src/index.css` — add `@media print` rules for A4, hiding non-print elements, showing `#invoice-preview`
2. Edit `src/frontend/src/components/invoice/DynamicTable.tsx` — make trash button always visible, use Trash2 icon
3. Edit `src/frontend/src/pages/InvoiceGenerator.tsx` — add Print button in header using `Printer` icon from lucide-react
