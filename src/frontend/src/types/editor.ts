export type ShapeType = "rectangle" | "circle" | "triangle" | "line" | "arrow";
export type ElementType = "text" | "image" | "shape" | "table";
export type TextAlign = "left" | "center" | "right" | "justify";
export type PageSize = "A4" | "Letter" | "A5";
export type Orientation = "portrait" | "landscape";

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
  opacity: number;
  name?: string;
  // Text
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: TextAlign;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  // Shape
  shapeType?: ShapeType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  // Image
  src?: string;
  objectFit?: "contain" | "cover" | "fill";
  // Table
  tableHeaders?: string[];
  tableData?: string[][];
  tableColWidths?: number[]; // percentages per column
  tableBorderColor?: string;
  tableHeaderBg?: string;
  tableCellPadding?: number;
  isInvoiceTable?: boolean;
  invoiceBinding?: string;
}

export interface PageData {
  id: string;
  elements: CanvasElement[];
  background: string;
}

export interface InvoiceLineItem {
  description: string;
  qty: number;
  unitPrice: number;
  taxPercent: number;
  amount: number;
}

export interface InvoiceFormData {
  companyName: string;
  companyAddress: string;
  companyGSTIN: string;
  companyLogo?: string;
  customerName: string;
  customerAddress: string;
  customerGSTIN: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  notes: string;
  bankDetails: string;
  currency: string;
}

export interface DocumentSettings {
  pageSize: PageSize;
  orientation: Orientation;
  margins: { top: number; right: number; bottom: number; left: number };
}

export interface CanvasState {
  pages: PageData[];
  invoiceData?: InvoiceFormData;
  documentSettings: DocumentSettings;
}

export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = {
  pageSize: "A4",
  orientation: "portrait",
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
};

export const DEFAULT_INVOICE_DATA: InvoiceFormData = {
  companyName: "Acme Corporation Pvt. Ltd.",
  companyAddress: "123 Business Park, Andheri East\nMumbai, Maharashtra 400069",
  companyGSTIN: "27AABCU9603R1ZX",
  customerName: "Client Company Ltd.",
  customerAddress: "456 Customer Street\nNew Delhi, Delhi 110001",
  customerGSTIN: "07AACCC1596Q1Z2",
  invoiceNumber: "INV-2024-001",
  invoiceDate: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  lineItems: [
    {
      description: "Web Design & Development",
      qty: 1,
      unitPrice: 45000,
      taxPercent: 18,
      amount: 45000,
    },
    {
      description: "SEO Optimization Package",
      qty: 3,
      unitPrice: 8000,
      taxPercent: 18,
      amount: 24000,
    },
    {
      description: "Content Writing Services",
      qty: 10,
      unitPrice: 1500,
      taxPercent: 18,
      amount: 15000,
    },
  ],
  subtotal: 84000,
  taxTotal: 15120,
  grandTotal: 99120,
  notes: "Payment is due within 30 days of invoice date.",
  bankDetails: "Bank: HDFC Bank | Account: 50100123456789 | IFSC: HDFC0001234",
  currency: "\u20b9",
};

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;
