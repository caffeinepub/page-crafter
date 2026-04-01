import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  FileImage,
  FileText,
  Loader2,
  Monitor,
  Plus,
  Printer,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DynamicTable, {
  type Column,
  type Row,
  type TableData,
} from "../components/invoice/DynamicTable";
import InvoiceHeader, {
  type HeaderData,
} from "../components/invoice/InvoiceHeader";

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function makeDefaultTable(index: number): TableData {
  const descId = generateId();
  const qtyId = generateId();
  const priceId = generateId();
  const amtId = generateId();
  const columns: Column[] = [
    { id: descId, label: "Description", widthPx: 220, type: "text" },
    { id: qtyId, label: "Qty", widthPx: 80, type: "number" },
    { id: priceId, label: "Unit Price", widthPx: 120, type: "number" },
    { id: amtId, label: "Amount", widthPx: 120, type: "number" },
  ];
  const rows: Row[] = [
    {
      id: generateId(),
      cells: { [descId]: "", [qtyId]: "", [priceId]: "", [amtId]: "" },
    },
  ];
  return {
    id: generateId(),
    title: index === 0 ? "Items" : `Table ${index + 1}`,
    columns,
    rows,
  };
}

const defaultHeader: HeaderData = {
  companyName: "Your Company Name",
  companyAddress: "123 Business Street\nCity, State - 500001",
  companyGSTIN: "",
  companyEmail: "",
  companyPhone: "",
  logoUrl: null,
  customerName: "",
  customerAddress: "",
  customerGSTIN: "",
  invoiceNumber: "INV-0001",
  invoiceDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  currency: "INR",
};

function computeSubtotal(tables: TableData[]): number {
  let total = 0;
  for (const table of tables) {
    const amtCol = table.columns.find(
      (c) => c.label.toLowerCase() === "amount",
    );
    const qtyCol = table.columns.find(
      (c) =>
        c.label.toLowerCase() === "qty" || c.label.toLowerCase() === "quantity",
    );
    const priceCol = table.columns.find(
      (c) =>
        c.label.toLowerCase() === "unit price" ||
        c.label.toLowerCase() === "price" ||
        c.label.toLowerCase() === "rate",
    );
    for (const row of table.rows) {
      if (qtyCol && priceCol) {
        const qty = Number.parseFloat(row.cells[qtyCol.id] || "0");
        const price = Number.parseFloat(row.cells[priceCol.id] || "0");
        if (!Number.isNaN(qty) && !Number.isNaN(price)) total += qty * price;
      } else if (amtCol) {
        const amt = Number.parseFloat(row.cells[amtCol.id] || "0");
        if (!Number.isNaN(amt)) total += amt;
      }
    }
  }
  return total;
}

function TotalsSection({ subtotal }: { subtotal: number }) {
  const gst = subtotal * 0.18;
  const grandTotal = subtotal + gst;
  const fmt = (n: number) =>
    n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return (
    <div className="flex justify-end mt-6 mb-6">
      <div className="w-72">
        <div className="flex justify-between text-sm text-gray-700 py-1.5">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium">₹{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-700 py-1.5">
          <span className="text-gray-500">GST (18%)</span>
          <span className="font-medium">₹{fmt(gst)}</span>
        </div>
        <Separator className="my-1.5" />
        <div className="flex justify-between text-base font-bold text-gray-900 py-1.5">
          <span>Grand Total</span>
          <span>₹{fmt(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}

type Resolution = "720p" | "1080p" | "4k";
type PageSize = "a4" | "letter";

export default function InvoiceGenerator() {
  const router = useRouter();
  const [invoiceTitle, setInvoiceTitle] = useState("New Invoice");
  const [header, setHeader] = useState<HeaderData>(defaultHeader);
  const [tables, setTables] = useState<TableData[]>([makeDefaultTable(0)]);
  const [notes, setNotes] = useState("");
  const [exportFormat, setExportFormat] = useState<"pdf" | "png">("pdf");
  const [exportResolution, setExportResolution] = useState<Resolution>("1080p");
  const [exportPageSize, setExportPageSize] = useState<PageSize>("a4");
  const [isExporting, setIsExporting] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const subtotal = computeSubtotal(tables);
  const gst = subtotal * 0.18;
  const grandTotal = subtotal + gst;

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const addTable = () => {
    setTables((prev) => [...prev, makeDefaultTable(prev.length)]);
  };

  const removeTable = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTable = (id: string, updated: TableData) => {
    setTables((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleExport = async () => {
    const el = document.getElementById("invoice-preview");
    if (!el) {
      toast.error("Preview element not found");
      return;
    }
    setIsExporting(true);
    toast.loading("Generating export…", { id: "export" });
    try {
      const scaleMap: Record<Resolution, number> = {
        "720p": 1.5,
        "1080p": 2,
        "4k": 4,
      };
      const scale = scaleMap[exportResolution];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = await (window as any).html2canvas(el, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
      });

      if (exportFormat === "png") {
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `${invoiceTitle.replace(/\s+/g, "-")}.png`;
        a.click();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { jsPDF } = (window as any).jspdf;
        const pdf = new jsPDF({
          orientation: "p",
          unit: "mm",
          format: exportPageSize === "a4" ? "a4" : "letter",
        });
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = (canvas.height / canvas.width) * pdfW;
        pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
        pdf.save(`${invoiceTitle.replace(/\s+/g, "-")}.pdf`);
      }
      toast.success("Export complete!", { id: "export" });
    } catch (e) {
      console.error(e);
      toast.error("Export failed. Please try again.", { id: "export" });
    } finally {
      setIsExporting(false);
    }
  };

  const resolutionLabels: Resolution[] = ["720p", "1080p", "4k"];

  const ExportSidebarContent = () => (
    <>
      {/* Export Settings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <Settings2 className="w-4 h-4" /> Export Settings
        </h3>
        <div className="space-y-4">
          {/* Format */}
          <div>
            <span className="text-xs text-gray-500 font-medium block mb-2">
              Format
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                data-ocid="invoice.format_pdf_toggle"
                onClick={() => setExportFormat("pdf")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded border text-sm transition-colors ${
                  exportFormat === "pdf"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                type="button"
                data-ocid="invoice.format_png_toggle"
                onClick={() => setExportFormat("png")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded border text-sm transition-colors ${
                  exportFormat === "png"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <FileImage className="w-3.5 h-3.5" /> PNG
              </button>
            </div>
          </div>

          {/* Resolution */}
          <div>
            <span className="text-xs text-gray-500 font-medium block mb-2">
              Resolution
            </span>
            <div className="flex gap-1">
              {resolutionLabels.map((r) => (
                <button
                  key={r}
                  type="button"
                  data-ocid={`invoice.resolution_${r}_toggle`}
                  onClick={() => setExportResolution(r)}
                  className={`flex-1 py-1.5 rounded border text-xs font-medium transition-colors ${
                    exportResolution === r
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {r === "4k" ? "4K" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Page Size */}
          <div>
            <span className="text-xs text-gray-500 font-medium block mb-2">
              Page Size
            </span>
            <div className="flex gap-2">
              {(["a4", "letter"] as PageSize[]).map((ps) => (
                <button
                  key={ps}
                  type="button"
                  data-ocid={`invoice.pagesize_${ps}_toggle`}
                  onClick={() => setExportPageSize(ps)}
                  className={`flex-1 py-1.5 rounded border text-xs font-medium transition-colors ${
                    exportPageSize === ps
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {ps === "a4" ? "A4" : "Letter"}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            data-ocid="invoice.sidebar_export_button"
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export {exportFormat.toUpperCase()}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Tables list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tables</h3>
        <div className="space-y-1 mb-3">
          {tables.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center justify-between text-xs text-gray-600 py-1 px-2 rounded hover:bg-gray-50"
            >
              <span className="truncate">{t.title || `Table ${i + 1}`}</span>
              <button
                type="button"
                onClick={() => removeTable(t.id)}
                className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0 transition-colors"
                title="Remove table"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTable}
          data-ocid="invoice.sidebar_add_table_button"
          className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Table
        </button>
      </div>

      <Separator />

      {/* Summary */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Summary</h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">₹{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">GST (18%)</span>
            <span className="font-medium">₹{fmt(gst)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-100 pt-2 mt-1">
            <span>Grand Total</span>
            <span>₹{fmt(grandTotal)}</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 sticky top-0 z-20 gap-3">
        <button
          type="button"
          data-ocid="invoice.back_button"
          onClick={() => router.navigate({ to: "/" })}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <input
          type="text"
          value={invoiceTitle}
          onChange={(e) => setInvoiceTitle(e.target.value)}
          data-ocid="invoice.title_input"
          className="text-base font-semibold text-gray-800 bg-transparent border-0 border-b border-transparent focus:border-gray-300 outline-none min-w-32"
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={addTable}
            data-ocid="invoice.add_table_button"
            className="no-print hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Table
          </button>
          {/* Print button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded border border-gray-200 hover:border-gray-400 transition-colors"
            title="Print Invoice"
            data-ocid="invoice.print_button"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Print</span>
          </button>
          {/* Mobile: toggle sidebar */}
          <button
            type="button"
            onClick={() => setShowMobileSidebar((v) => !v)}
            className="lg:hidden p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
            data-ocid="invoice.sidebar_toggle"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            data-ocid="invoice.export_button"
            className="no-print gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              Export {exportFormat.toUpperCase()}
            </span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Main content: scrollable invoice */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div
            id="invoice-preview"
            className="bg-white w-full max-w-[794px] mx-auto p-8 md:p-10 shadow-md rounded"
          >
            <InvoiceHeader data={header} onChange={setHeader} />

            {tables.map((table) => (
              <DynamicTable
                key={table.id}
                tableData={table}
                onChange={(updated) => updateTable(table.id, updated)}
                onRemove={() => removeTable(table.id)}
              />
            ))}

            {tables.length === 0 && (
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm mb-6"
                data-ocid="invoice.tables.empty_state"
              >
                No tables yet. Click &quot;Add Table&quot; to add one.
              </div>
            )}

            <TotalsSection subtotal={subtotal} />

            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1 font-medium">
                Notes / Terms
              </p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-ocid="invoice.notes_textarea"
                placeholder="Payment terms, notes, or any additional information…"
                className="text-sm text-gray-700 border-gray-200 resize-none min-h-20"
                rows={3}
              />
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
              Thank you for your business!
            </div>
          </div>

          {/* Caffeine footer */}
          <div className="no-print text-center text-xs text-gray-400 mt-6 pb-4">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              Built with ❤️ using caffeine.ai
            </a>
          </div>
        </main>

        {/* Desktop Right Sidebar */}
        <aside className="hidden lg:flex w-72 bg-white border-l border-gray-200 p-5 flex-col gap-5 overflow-y-auto">
          <ExportSidebarContent />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <button
            type="button"
            className="lg:hidden fixed inset-0 z-30 bg-transparent border-0 p-0 cursor-default"
            onClick={() => setShowMobileSidebar(false)}
            onKeyDown={(e) => e.key === "Escape" && setShowMobileSidebar(false)}
            aria-label="Close sidebar"
          >
            <dialog
              open
              className="absolute right-0 top-0 h-full w-72 bg-white border-l border-gray-200 p-5 flex flex-col gap-5 overflow-y-auto shadow-xl m-0 max-h-none max-w-none"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <ExportSidebarContent />
            </dialog>
          </button>
        )}
      </div>
    </div>
  );
}
