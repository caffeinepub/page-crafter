# GST Invoice Generator

## Current State
Project is being built fresh. The previous versions had export/print issues and an overly complex canvas-based editor. This build starts clean with a focused, professional invoice generator.

## Requested Changes (Diff)

### Add
- Editable invoice header: Invoice Title, Invoice #, Date, Due Date
- Company info section: Name, Address, Phone, Email, Logo upload
- Customer/Bill-to section: Name, Address, Phone, Email
- Dynamic item table: Item Name, Qty, Unit Price, Total (auto-calculated)
- Add Row / Delete Row (per-row trash icon)
- GST toggle (default ON, 18%) with label "GST 18%"
- Manual adjustment field (+/- value)
- Subtotal, GST amount, Adjustment, Grand Total summary section
- Notes / Terms & Conditions textarea at bottom
- Save Invoice button (localStorage)
- Load Saved Invoices modal with timestamps
- Download PDF button (html2pdf.js, full content, no blank pages)
- Print Invoice button (window.print with @media print styles)
- Dark / Light mode toggle
- Reset / Clear invoice button
- Input validation (no text in number fields, no negative qty/price)
- Responsive layout for desktop and mobile

### Modify
- N/A (new build)

### Remove
- N/A (new build)

## Implementation Plan
1. Backend: Store saved invoices in Motoko stable storage (CRUD: save, list, load, delete)
2. Frontend:
   a. InvoiceHeader component (editable title, invoice#, dates)
   b. CompanyInfo component (editable fields + logo upload)
   c. CustomerInfo component (editable bill-to fields)
   d. InvoiceTable component (dynamic rows, auto-calc per row)
   e. TotalsSection component (subtotal, GST toggle, adjustment, grand total)
   f. NotesSection component (textarea)
   g. ActionBar (Save, Load, Download PDF, Print, Reset, Dark/Light toggle)
   h. LoadModal (list saved invoices from backend, restore or delete)
   i. PDF export via html2pdf.js — clone invoice div off-screen, remove UI chrome, export
   j. Print via @media print — hide all except #invoice-print-area
   k. Input validation utilities
   l. Dark/Light mode via CSS class on root
