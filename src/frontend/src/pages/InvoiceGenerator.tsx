import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@tanstack/react-router";
import {
  BarChart2,
  Download,
  FileText,
  FolderOpen,
  Home,
  ImageIcon,
  Loader2,
  Moon,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Sun,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InvoiceRow {
  id: string;
  item: string;
  qty: number;
  price: number;
}

interface InvoiceData {
  title: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyGSTIN: string;
  companyLogo: string | null;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail: string;
  customerGSTIN: string;
  rows: InvoiceRow[];
  gstEnabled: boolean;
  gstRate: number;
  adjustment: number;
  notes: string;
  terms: string;
}

interface SavedEntry {
  id: string;
  savedAt: string;
  data: InvoiceData;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gid(): string {
  return Math.random().toString(36).slice(2, 9);
}

const STORAGE_KEY = "gst_invoices_v2";

function loadEntries(): SavedEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveEntry(data: InvoiceData): SavedEntry {
  const entries = loadEntries();
  const entry: SavedEntry = {
    id: gid(),
    savedAt: new Date().toISOString(),
    data,
  };
  const updated = [entry, ...entries].slice(0, 30);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return entry;
}

function deleteEntry(id: string): void {
  const updated = loadEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

const INR = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function parseNum(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isNaN(n) ? 0 : Math.max(0, n);
}

function parseAdjust(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
}

const defaultData: InvoiceData = {
  title: "TAX INVOICE",
  invoiceNumber: "INV-0001",
  date: new Date().toISOString().split("T")[0],
  dueDate: "",
  companyName: "Sunrise Enterprises",
  companyAddress: "12, MG Road, Banjara Hills\nHyderabad, Telangana - 500034",
  companyPhone: "+91 40 2345 6789",
  companyEmail: "billing@sunriseenterprises.in",
  companyGSTIN: "36AABCU9603R1ZX",
  companyLogo: null,
  customerName: "Horizon Technologies Pvt. Ltd.",
  customerAddress: "Plot 8, HITEC City\nHyderabad, Telangana - 500081",
  customerPhone: "+91 40 6789 0123",
  customerEmail: "accounts@horizontech.in",
  customerGSTIN: "36AABCH1234P1ZY",
  rows: [
    { id: gid(), item: "Web Development Services", qty: 1, price: 45000 },
    { id: gid(), item: "UI/UX Design Package", qty: 2, price: 12500 },
    { id: gid(), item: "SEO Optimization", qty: 3, price: 8000 },
    { id: gid(), item: "Cloud Hosting (Annual)", qty: 1, price: 18000 },
  ],
  gstEnabled: true,
  gstRate: 18,
  adjustment: 0,
  notes:
    "Payment is due within 30 days. Please include the invoice number on your payment.",
  terms:
    "1. All prices are in Indian Rupees (INR).\n2. Goods once sold will not be taken back.\n3. Subject to Hyderabad jurisdiction.",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function EditableText({
  value,
  onChange,
  placeholder,
  className = "",
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  multiline?: boolean;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={`w-full bg-transparent resize-none outline-none border-b border-transparent focus:border-blue-300 placeholder-gray-300 transition-colors leading-relaxed ${className}`}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent outline-none border-b border-transparent focus:border-blue-300 placeholder-gray-300 transition-colors ${className}`}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InvoiceGenerator() {
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceData>(defaultData);
  const [darkMode, setDarkMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [entries, setEntries] = useState<SavedEntry[]>(loadEntries);
  const [editingTitle, setEditingTitle] = useState(false);
  const [activeNav, setActiveNav] = useState<"invoice" | "saved" | "settings">(
    "invoice",
  );
  const titleInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [autoSave, setAutoSave] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dark mode class on html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [darkMode]);

  // Focus title input when editing
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  // Inject print styles
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "inv-print-css";
    style.textContent = `
      @media print {
        body > * { visibility: hidden !important; }
        #inv-print-portal { visibility: visible !important; display: block !important; }
        #inv-print-portal * { visibility: visible !important; }
        #inv-print-portal #inv-print-area { width: 794px !important; background: white !important; overflow: visible !important; height: auto !important; max-height: none !important; box-shadow: none !important; }
        .no-print { display: none !important; }
        @page { size: A4 portrait; margin: 12mm; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById("inv-print-css")?.remove();
    };
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveEntry(invoice);
      setEntries(loadEntries());
    }, 1500);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [invoice, autoSave]);

  // ── Calculations (on every render) ────────────────────────────────────────
  const subtotal = invoice.rows.reduce((s, r) => s + r.qty * r.price, 0);
  const gstAmount = invoice.gstEnabled ? subtotal * (invoice.gstRate / 100) : 0;
  const grandTotal = subtotal + gstAmount + invoice.adjustment;

  // ── State updaters ─────────────────────────────────────────────────────────
  const setField = <K extends keyof InvoiceData>(
    key: K,
    value: InvoiceData[K],
  ) => setInvoice((prev) => ({ ...prev, [key]: value }));

  const updateRow = (id: string, key: keyof InvoiceRow, raw: string) => {
    setInvoice((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => {
        if (r.id !== id) return r;
        if (key === "item") return { ...r, item: raw };
        if (key === "qty") return { ...r, qty: parseNum(raw) };
        if (key === "price") return { ...r, price: parseNum(raw) };
        return r;
      }),
    }));
  };

  const addRow = () => {
    const newRow: InvoiceRow = { id: gid(), item: "", qty: 1, price: 0 };
    setInvoice((prev) => ({ ...prev, rows: [...prev.rows, newRow] }));
    setTimeout(() => {
      const rows = document.querySelectorAll<HTMLInputElement>(".item-input");
      rows[rows.length - 1]?.focus();
    }, 40);
  };

  const deleteRow = (id: string) => {
    setInvoice((prev) => ({
      ...prev,
      rows: prev.rows.filter((r) => r.id !== id),
    }));
  };

  // ── Logo upload ────────────────────────────────────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setField("companyLogo", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ── Save / Load ────────────────────────────────────────────────────────────
  const handleSave = () => {
    saveEntry(invoice);
    setEntries(loadEntries());
    toast.success("Invoice saved!");
  };

  const handleLoad = (entry: SavedEntry) => {
    setInvoice(entry.data);
    setShowLoadModal(false);
    toast.success("Invoice loaded!");
  };

  const handleDeleteEntry = (id: string) => {
    deleteEntry(id);
    setEntries(loadEntries());
    toast.success("Deleted");
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setInvoice({
      ...defaultData,
      rows: [{ id: gid(), item: "", qty: 1, price: 0 }],
      invoiceNumber: `INV-${String(Date.now()).slice(-4)}`,
      date: new Date().toISOString().split("T")[0],
      notes: "",
      terms: "",
      companyLogo: null,
      adjustment: 0,
    });
    toast.success("Invoice reset");
  };

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    const el = document.getElementById("inv-print-area");
    if (!el) {
      toast.error("Invoice area not found");
      return;
    }
    setIsExporting(true);
    toast.loading("Generating PDF…", { id: "pdf" });

    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:absolute;top:-9999px;left:-9999px;width:794px;background:white;padding:40px;box-sizing:border-box;";
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.cssText =
      "width:714px;background:white;overflow:visible;height:auto;max-height:none;box-shadow:none;border-radius:0;";
    // Remove no-print elements
    for (const n of Array.from(clone.querySelectorAll(".no-print"))) n.remove();
    // Force all children to be visible and unclipped
    for (const n of Array.from(clone.querySelectorAll<HTMLElement>("*"))) {
      if (n.style.overflow === "hidden") n.style.overflow = "visible";
      if (n.style.maxHeight) n.style.maxHeight = "none";
    }
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Wait for browser to fully render cloned content
    await new Promise((r) => setTimeout(r, 200));

    try {
      const canvas = await (window as any).html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: wrapper.scrollHeight,
        windowWidth: 794,
        scrollY: 0,
        scrollX: 0,
      });

      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const pw = pageW - margin * 2;
      const ph = pageH - margin * 2;
      const imgW = pw;
      const imgH = (canvas.height / canvas.width) * imgW;
      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      if (imgH <= ph) {
        pdf.addImage(imgData, "JPEG", margin, margin, imgW, imgH);
      } else {
        const totalPages = Math.ceil(imgH / ph);
        for (let p = 0; p < totalPages; p++) {
          if (p > 0) pdf.addPage();
          const srcY = (p * ph * canvas.width) / imgW;
          const srcH = Math.min(
            (ph * canvas.width) / imgW,
            canvas.height - srcY,
          );
          const pc = document.createElement("canvas");
          pc.width = canvas.width;
          pc.height = srcH;
          const ctx = pc.getContext("2d");
          if (ctx)
            ctx.drawImage(
              canvas,
              0,
              srcY,
              canvas.width,
              srcH,
              0,
              0,
              canvas.width,
              srcH,
            );
          const sliceH = (srcH / canvas.width) * imgW;
          pdf.addImage(
            pc.toDataURL("image/jpeg", 0.98),
            "JPEG",
            margin,
            margin,
            imgW,
            sliceH,
          );
        }
      }
      pdf.save(
        `${invoice.title.replace(/\s+/g, "-")}-${invoice.invoiceNumber}.pdf`,
      );
      toast.success("PDF downloaded!", { id: "pdf" });
    } catch (e) {
      console.error(e);
      toast.error("Export failed. Please try again.", { id: "pdf" });
    } finally {
      document.body.removeChild(wrapper);
      setIsExporting(false);
    }
  };

  // ── PNG Export ─────────────────────────────────────────────────────────────
  const handleDownloadPNG = async () => {
    const el = document.getElementById("inv-print-area");
    if (!el) {
      toast.error("Invoice area not found");
      return;
    }
    setIsExporting(true);
    toast.loading("Generating PNG…", { id: "png" });

    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:absolute;top:-9999px;left:-9999px;width:794px;background:white;padding:40px;box-sizing:border-box;";
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.cssText =
      "width:714px;background:white;overflow:visible;height:auto;max-height:none;box-shadow:none;border-radius:0;";
    for (const n of Array.from(clone.querySelectorAll(".no-print"))) n.remove();
    for (const n of Array.from(clone.querySelectorAll<HTMLElement>("*"))) {
      if (n.style.overflow === "hidden") n.style.overflow = "visible";
      if (n.style.maxHeight) n.style.maxHeight = "none";
    }
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    await new Promise((r) => setTimeout(r, 200));

    try {
      const canvas = await (window as any).html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: wrapper.scrollHeight,
        windowWidth: 794,
        scrollY: 0,
        scrollX: 0,
      });
      const link = document.createElement("a");
      link.download = `${invoice.title.replace(/\s+/g, "-")}-${invoice.invoiceNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG downloaded!", { id: "png" });
    } catch (e) {
      console.error(e);
      toast.error("PNG export failed.", { id: "png" });
    } finally {
      document.body.removeChild(wrapper);
      setIsExporting(false);
    }
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const el = document.getElementById("inv-print-area");
    if (!el) {
      toast.error("Invoice area not found");
      return;
    }

    let portal = document.getElementById("inv-print-portal");
    if (!portal) {
      portal = document.createElement("div");
      portal.id = "inv-print-portal";
      portal.style.display = "none";
      document.body.appendChild(portal);
    }
    const clone = el.cloneNode(true) as HTMLElement;
    clone.id = "inv-print-area";
    clone.style.cssText =
      "width:794px;background:white;overflow:visible;height:auto;max-height:none;box-shadow:none;padding:0;";
    for (const n of Array.from(clone.querySelectorAll(".no-print"))) n.remove();
    // Fix any overflow:hidden children
    for (const n of Array.from(clone.querySelectorAll<HTMLElement>("*"))) {
      if (n.style.overflow === "hidden") n.style.overflow = "visible";
    }
    portal.innerHTML = "";
    portal.appendChild(clone);
    portal.style.display = "block";

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (portal) portal.style.display = "none";
      }, 1000);
    }, 400);
  };

  // ── Nav click ─────────────────────────────────────────────────────────────
  const handleNavClick = (item: typeof activeNav) => {
    setActiveNav(item);
    if (item === "saved") {
      setEntries(loadEntries());
      setShowLoadModal(true);
    }
  };

  const navItems = [
    { id: "invoice" as const, icon: FileText, label: "Invoice" },
    { id: "saved" as const, icon: FolderOpen, label: "Saved" },
    { id: "settings" as const, icon: Settings, label: "Settings" },
  ];

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: darkMode ? "#111827" : "#F3F6FA" }}
    >
      {/* ── Top Header ── */}
      <header
        className="no-print h-14 flex items-center px-6 sticky top-0 z-30 gap-4"
        style={{
          background: "linear-gradient(135deg, #0B1F3A 0%, #0A2A55 100%)",
        }}
      >
        <button
          type="button"
          onClick={() => router.navigate({ to: "/" })}
          className="flex items-center gap-2.5 flex-shrink-0 group"
          data-ocid="invoice.back_button"
        >
          <div className="w-7 h-7 bg-white/10 rounded-md flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base tracking-tight hidden sm:block">
            GST Invoice Pro
          </span>
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            data-ocid="invoice.dark_mode_toggle"
            className="no-print w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-yellow-300" />
            ) : (
              <Moon className="w-4 h-4 text-white" />
            )}
          </button>

          <div className="h-5 w-px bg-white/20" />

          {/* Quick actions */}
          <button
            type="button"
            onClick={handleSave}
            data-ocid="invoice.save_button"
            className="no-print hidden sm:flex items-center gap-1.5 text-white/80 hover:text-white text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button
            type="button"
            onClick={handlePrint}
            data-ocid="invoice.print_button"
            className="no-print hidden sm:flex items-center gap-1.5 text-white/80 hover:text-white text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Print</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExporting}
            data-ocid="invoice.download_pdf_button"
            className="no-print flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">PDF</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPNG}
            disabled={isExporting}
            data-ocid="invoice.download_png_button"
            className="no-print hidden md:flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{ background: "rgba(255,255,255,0.10)", color: "white" }}
            title="Download PNG"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">PNG</span>
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar ── */}
        <aside
          className="no-print hidden lg:flex w-[240px] flex-col flex-shrink-0 border-r"
          style={{
            background: darkMode ? "#1F2937" : "#FFFFFF",
            borderColor: darkMode ? "#374151" : "#E5E7EB",
          }}
        >
          <nav className="p-4 flex flex-col gap-1 mt-2">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleNavClick(id)}
                data-ocid={`invoice.nav_${id}_link`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                  activeNav === id
                    ? "text-white"
                    : darkMode
                      ? "text-gray-400 hover:text-white hover:bg-gray-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                style={
                  activeNav === id
                    ? {
                        background: "linear-gradient(135deg, #0B1F3A, #0A2A55)",
                      }
                    : {}
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <Separator className={darkMode ? "bg-gray-700" : "bg-gray-100"} />

          <nav className="p-4 flex flex-col gap-1">
            {[
              {
                icon: Home,
                label: "Dashboard",
                action: () => router.navigate({ to: "/" }),
              },
              { icon: Users, label: "Customers" },
              { icon: BarChart2, label: "Reports" },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                  darkMode
                    ? "text-gray-400 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto p-4">
            <div
              className="rounded-xl p-3 text-xs"
              style={{
                background: darkMode ? "#374151" : "#F3F6FA",
                color: darkMode ? "#9CA3AF" : "#6B7280",
              }}
            >
              <p
                className="font-semibold mb-1"
                style={{ color: darkMode ? "#D1D5DB" : "#374151" }}
              >
                GST Invoice Pro
              </p>
              <p>Professional billing software for Indian businesses.</p>
            </div>
          </div>
        </aside>

        {/* ── Center: Invoice ── */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{ background: darkMode ? "#111827" : "#F3F6FA" }}
        >
          {/* Invoice Card */}
          <div
            id="inv-print-area"
            ref={printAreaRef}
            className="w-full max-w-3xl mx-auto rounded-xl p-8 md:p-10"
            style={{
              background: darkMode ? "#1F2937" : "#FFFFFF",
              boxShadow: "0 6px 20px rgba(17,24,39,0.08)",
            }}
          >
            {/* Invoice Title */}
            <div className="mb-6">
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={invoice.title}
                  onChange={(e) => setField("title", e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingTitle(false);
                  }}
                  data-ocid="invoice.title_input"
                  className="text-2xl font-bold outline-none border-b-2 border-blue-400 bg-transparent w-full"
                  style={{ color: darkMode ? "#F9FAFB" : "#111827" }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingTitle(true)}
                  data-ocid="invoice.title_heading"
                  className="group flex items-center gap-2 text-left"
                >
                  <h1
                    className="text-2xl font-bold uppercase tracking-wide"
                    style={{ color: darkMode ? "#F9FAFB" : "#111827" }}
                  >
                    {invoice.title}
                  </h1>
                  <Pencil
                    className="no-print w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: darkMode ? "#60A5FA" : "#3B82F6" }}
                  />
                </button>
              )}
            </div>

            {/* Company + Invoice Meta */}
            <div className="flex gap-8 mb-8">
              {/* Company Left */}
              <div className="flex-1">
                {/* Logo */}
                <div className="mb-4">
                  {invoice.companyLogo ? (
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="block"
                      >
                        <img
                          src={invoice.companyLogo}
                          alt="Logo"
                          className="h-16 w-auto object-contain rounded"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setField("companyLogo", null)}
                        className="no-print absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                        data-ocid="invoice.remove_logo_button"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      data-ocid="invoice.upload_logo_button"
                      className="no-print border-2 border-dashed rounded-lg px-4 py-2 text-xs transition-colors"
                      style={{
                        borderColor: darkMode ? "#4B5563" : "#E5E7EB",
                        color: darkMode ? "#6B7280" : "#9CA3AF",
                      }}
                    >
                      + Upload Logo
                    </button>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>

                <EditableText
                  value={invoice.companyName}
                  onChange={(v) => setField("companyName", v)}
                  placeholder="Company Name"
                  className={`text-base font-bold uppercase mb-1 ${
                    darkMode ? "text-gray-100" : "text-gray-800"
                  }`}
                />
                <EditableText
                  value={invoice.companyAddress}
                  onChange={(v) => setField("companyAddress", v)}
                  placeholder="Company Address"
                  multiline
                  className={`text-sm mb-1 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                />
                <EditableText
                  value={invoice.companyGSTIN}
                  onChange={(v) => setField("companyGSTIN", v)}
                  placeholder="GSTIN"
                  className={`text-xs mb-0.5 ${
                    darkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                />
                <EditableText
                  value={invoice.companyEmail}
                  onChange={(v) => setField("companyEmail", v)}
                  placeholder="Email"
                  className={`text-xs mb-0.5 ${
                    darkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                />
                <EditableText
                  value={invoice.companyPhone}
                  onChange={(v) => setField("companyPhone", v)}
                  placeholder="Phone"
                  className={`text-xs ${
                    darkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                />
              </div>

              {/* Invoice Meta Right */}
              <div className="w-56 flex-shrink-0">
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className="text-xs"
                      style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
                    >
                      #
                    </span>
                    <input
                      type="text"
                      value={invoice.invoiceNumber}
                      onChange={(e) =>
                        setField("invoiceNumber", e.target.value)
                      }
                      data-ocid="invoice.number_input"
                      className="text-sm font-semibold bg-transparent outline-none border-b border-transparent focus:border-blue-300 text-right w-32 transition-colors"
                      style={{ color: darkMode ? "#F9FAFB" : "#111827" }}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className="text-xs"
                      style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
                    >
                      Date
                    </span>
                    <input
                      type="date"
                      value={invoice.date}
                      onChange={(e) => setField("date", e.target.value)}
                      data-ocid="invoice.date_input"
                      className="text-sm bg-transparent outline-none border-b border-transparent focus:border-blue-300 text-right transition-colors"
                      style={{ color: darkMode ? "#D1D5DB" : "#374151" }}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className="text-xs whitespace-nowrap"
                      style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
                    >
                      Due Date
                    </span>
                    <input
                      type="date"
                      value={invoice.dueDate}
                      onChange={(e) => setField("dueDate", e.target.value)}
                      data-ocid="invoice.due_date_input"
                      className="text-sm bg-transparent outline-none border-b border-transparent focus:border-blue-300 text-right transition-colors"
                      style={{ color: darkMode ? "#D1D5DB" : "#374151" }}
                    />
                  </div>
                </div>

                {/* Bill To */}
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: darkMode ? "#6B7280" : "#6B7280" }}
                  >
                    Bill To
                  </p>
                  <EditableText
                    value={invoice.customerName}
                    onChange={(v) => setField("customerName", v)}
                    placeholder="Customer Name"
                    className={`text-sm font-semibold mb-1 ${
                      darkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  />
                  <EditableText
                    value={invoice.customerAddress}
                    onChange={(v) => setField("customerAddress", v)}
                    placeholder="Customer Address"
                    multiline
                    className={`text-xs mb-1 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  />
                  <EditableText
                    value={invoice.customerGSTIN}
                    onChange={(v) => setField("customerGSTIN", v)}
                    placeholder="GSTIN"
                    className={`text-xs ${
                      darkMode ? "text-gray-500" : "text-gray-500"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div
              className="h-px mb-6"
              style={{ background: darkMode ? "#374151" : "#E5E7EB" }}
            />

            {/* Items Table */}
            <div className="mb-6 overflow-x-auto">
              <table
                className="w-full border-collapse"
                style={{ minWidth: "500px" }}
              >
                <thead>
                  <tr style={{ background: darkMode ? "#374151" : "#F1F3F6" }}>
                    <th
                      className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wide w-8"
                      style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
                    >
                      #
                    </th>
                    <th
                      className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wide"
                      style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
                    >
                      Item Description
                    </th>
                    <th
                      className="text-center py-2.5 px-3 text-xs font-bold uppercase tracking-wide w-20"
                      style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
                    >
                      Qty
                    </th>
                    <th
                      className="text-right py-2.5 px-3 text-xs font-bold uppercase tracking-wide w-28"
                      style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
                    >
                      Rate
                    </th>
                    <th
                      className="text-right py-2.5 px-3 text-xs font-bold uppercase tracking-wide w-28"
                      style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
                    >
                      Amount
                    </th>
                    <th className="no-print w-8" />
                  </tr>
                </thead>
                <tbody>
                  {invoice.rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      data-ocid={`invoice.item.${idx + 1}`}
                      className="transition-colors"
                      style={{
                        borderBottom: `1px solid ${darkMode ? "#374151" : "#F3F4F6"}`,
                      }}
                    >
                      <td
                        className="py-2 px-3 text-sm"
                        style={{ color: darkMode ? "#6B7280" : "#9CA3AF" }}
                      >
                        {idx + 1}
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="text"
                          value={row.item}
                          onChange={(e) =>
                            updateRow(row.id, "item", e.target.value)
                          }
                          data-ocid={`invoice.item_name_input.${idx + 1}`}
                          className="item-input w-full px-2 py-1.5 text-sm bg-transparent outline-none rounded-md focus:ring-1 transition-all"
                          style={{ color: darkMode ? "#E5E7EB" : "#111827" }}
                          placeholder="Item description"
                          onFocus={(e) => {
                            (e.target as HTMLInputElement).style.background =
                              darkMode ? "#374151" : "#EFF6FF";
                          }}
                          onBlur={(e) => {
                            (e.target as HTMLInputElement).style.background =
                              "transparent";
                          }}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.qty === 0 ? "" : row.qty}
                          onChange={(e) =>
                            updateRow(row.id, "qty", e.target.value)
                          }
                          data-ocid={`invoice.item_qty_input.${idx + 1}`}
                          className="w-full px-2 py-1.5 text-sm text-center bg-transparent outline-none rounded-md focus:ring-1 transition-all"
                          style={{ color: darkMode ? "#E5E7EB" : "#111827" }}
                          placeholder="0"
                          onFocus={(e) => {
                            (e.target as HTMLInputElement).style.background =
                              darkMode ? "#374151" : "#EFF6FF";
                          }}
                          onBlur={(e) => {
                            (e.target as HTMLInputElement).style.background =
                              "transparent";
                          }}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.price === 0 ? "" : row.price}
                          onChange={(e) =>
                            updateRow(row.id, "price", e.target.value)
                          }
                          data-ocid={`invoice.item_price_input.${idx + 1}`}
                          className="w-full px-2 py-1.5 text-sm text-right bg-transparent outline-none rounded-md focus:ring-1 transition-all"
                          style={{ color: darkMode ? "#E5E7EB" : "#111827" }}
                          placeholder="0.00"
                          onFocus={(e) => {
                            (e.target as HTMLInputElement).style.background =
                              darkMode ? "#374151" : "#EFF6FF";
                          }}
                          onBlur={(e) => {
                            (e.target as HTMLInputElement).style.background =
                              "transparent";
                          }}
                        />
                      </td>
                      <td
                        className="py-2 px-3 text-sm text-right font-medium"
                        style={{ color: darkMode ? "#D1D5DB" : "#374151" }}
                      >
                        ₹{INR(row.qty * row.price)}
                      </td>
                      <td className="no-print py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => deleteRow(row.id)}
                          data-ocid={`invoice.item_delete_button.${idx + 1}`}
                          className="w-6 h-6 flex items-center justify-center mx-auto rounded transition-colors hover:bg-red-50"
                          title="Delete row"
                        >
                          <Trash2
                            className="w-3.5 h-3.5"
                            style={{ color: darkMode ? "#6B7280" : "#9CA3AF" }}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {invoice.rows.length === 0 && (
                    <tr data-ocid="invoice.items.empty_state">
                      <td
                        colSpan={6}
                        className="py-8 text-center text-sm"
                        style={{ color: darkMode ? "#6B7280" : "#9CA3AF" }}
                      >
                        No items yet. Click "Add Row" to add items.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Row Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={addRow}
                data-ocid="invoice.add_row_button"
                className="no-print flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors font-medium"
                style={{
                  borderColor: darkMode ? "#374151" : "#E5E7EB",
                  color: darkMode ? "#60A5FA" : "#3B82F6",
                  background: darkMode ? "transparent" : "transparent",
                }}
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>

            <div
              className="h-px mb-6"
              style={{ background: darkMode ? "#374151" : "#E5E7EB" }}
            />

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-72">
                {/* Subtotal */}
                <div className="flex justify-between py-2">
                  <span
                    className="text-sm"
                    style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    Subtotal
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: darkMode ? "#D1D5DB" : "#374151" }}
                  >
                    ₹{INR(subtotal)}
                  </span>
                </div>

                {/* GST Row */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={invoice.gstEnabled}
                      onCheckedChange={(v) => setField("gstEnabled", v)}
                      data-ocid="invoice.gst_switch"
                      className="no-print scale-75"
                    />
                    <span
                      className="text-sm"
                      style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
                    >
                      GST {invoice.gstRate}%
                    </span>
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: invoice.gstEnabled
                        ? darkMode
                          ? "#D1D5DB"
                          : "#374151"
                        : darkMode
                          ? "#4B5563"
                          : "#D1D5DB",
                    }}
                  >
                    {invoice.gstEnabled ? `₹${INR(gstAmount)}` : "—"}
                  </span>
                </div>

                {/* Manual Adjustment */}
                <div className="flex items-center justify-between py-2">
                  <span
                    className="text-sm"
                    style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    Adjustment (+/-)
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className="text-sm"
                      style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={invoice.adjustment === 0 ? "" : invoice.adjustment}
                      onChange={(e) =>
                        setField("adjustment", parseAdjust(e.target.value))
                      }
                      data-ocid="invoice.adjustment_input"
                      placeholder="0.00"
                      className="w-24 text-sm text-right bg-transparent outline-none border-b border-transparent focus:border-blue-300 transition-colors"
                      style={{
                        color:
                          invoice.adjustment < 0
                            ? "#EF4444"
                            : darkMode
                              ? "#D1D5DB"
                              : "#374151",
                      }}
                    />
                  </div>
                </div>

                <div
                  className="h-px my-2"
                  style={{ background: darkMode ? "#374151" : "#E5E7EB" }}
                />

                {/* Grand Total */}
                <div className="flex justify-between py-2">
                  <span
                    className="text-base font-bold"
                    style={{ color: darkMode ? "#F9FAFB" : "#111827" }}
                  >
                    Grand Total
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{
                      background: "linear-gradient(135deg, #0B1F3A, #0A2A55)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    ₹{INR(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes + Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: darkMode ? "#6B7280" : "#6B7280" }}
                >
                  Notes
                </p>
                <textarea
                  value={invoice.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  data-ocid="invoice.notes_textarea"
                  placeholder="Payment terms, notes, or additional information…"
                  rows={3}
                  className="w-full text-sm bg-transparent resize-none outline-none border rounded-lg p-2 transition-colors"
                  style={{
                    color: darkMode ? "#D1D5DB" : "#4B5563",
                    borderColor: darkMode ? "#374151" : "#E5E7EB",
                  }}
                />
              </div>
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: darkMode ? "#6B7280" : "#6B7280" }}
                >
                  Terms &amp; Conditions
                </p>
                <textarea
                  value={invoice.terms}
                  onChange={(e) => setField("terms", e.target.value)}
                  data-ocid="invoice.terms_textarea"
                  placeholder="Terms and conditions…"
                  rows={3}
                  className="w-full text-sm bg-transparent resize-none outline-none border rounded-lg p-2 transition-colors"
                  style={{
                    color: darkMode ? "#D1D5DB" : "#4B5563",
                    borderColor: darkMode ? "#374151" : "#E5E7EB",
                  }}
                />
              </div>
            </div>

            {/* Thank you footer */}
            <div
              className="text-center text-xs pt-4 border-t"
              style={{
                color: darkMode ? "#4B5563" : "#9CA3AF",
                borderColor: darkMode ? "#374151" : "#F3F4F6",
              }}
            >
              Thank you for your business!
            </div>
          </div>

          {/* Caffeine footer */}
          <div
            className="no-print text-center text-xs mt-6 pb-4"
            style={{ color: darkMode ? "#4B5563" : "#9CA3AF" }}
          >
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Built with ❤️ using caffeine.ai
            </a>
          </div>
        </main>

        {/* ── Right: Actions Panel ── */}
        <aside
          className="no-print hidden xl:flex w-[300px] flex-shrink-0 flex-col border-l overflow-y-auto"
          style={{
            background: darkMode ? "#1F2937" : "#FFFFFF",
            borderColor: darkMode ? "#374151" : "#E5E7EB",
          }}
        >
          <div className="p-5 flex flex-col gap-4 sticky top-0">
            <h2
              className="text-lg font-bold"
              style={{ color: darkMode ? "#F9FAFB" : "#111827" }}
            >
              Actions
            </h2>

            {/* Save Invoice — Primary */}
            <Button
              onClick={handleSave}
              data-ocid="invoice.actions_save_button"
              className="w-full h-11 text-sm font-medium rounded-xl gap-2"
              style={{
                background: "linear-gradient(135deg, #0B1F3A, #0A2A55)",
                color: "white",
                border: "none",
              }}
            >
              <Save className="w-4 h-4" /> Save Invoice
            </Button>

            {/* Load Invoices */}
            <button
              type="button"
              onClick={() => {
                setEntries(loadEntries());
                setShowLoadModal(true);
              }}
              data-ocid="invoice.actions_load_button"
              className="w-full h-11 text-sm font-medium rounded-xl border flex items-center justify-center gap-2 transition-colors"
              style={{
                borderColor: darkMode ? "#374151" : "#E5E7EB",
                background: darkMode ? "transparent" : "#FFFFFF",
                color: darkMode ? "#D1D5DB" : "#374151",
              }}
            >
              <FolderOpen className="w-4 h-4" /> Load Invoices
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              data-ocid="invoice.actions_pdf_button"
              className="w-full h-11 text-sm font-medium rounded-xl border flex items-center justify-center gap-2 transition-colors"
              style={{
                borderColor: darkMode ? "#374151" : "#E5E7EB",
                background: darkMode ? "transparent" : "#FFFFFF",
                color: darkMode ? "#D1D5DB" : "#374151",
              }}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download PDF
            </button>

            {/* Download PNG */}
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isExporting}
              data-ocid="invoice.actions_png_button"
              className="w-full h-11 text-sm font-medium rounded-xl border flex items-center justify-center gap-2 transition-colors"
              style={{
                borderColor: darkMode ? "#374151" : "#E5E7EB",
                background: darkMode ? "transparent" : "#FFFFFF",
                color: darkMode ? "#D1D5DB" : "#374151",
              }}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              Download PNG
            </button>

            {/* Print Invoice */}
            <button
              type="button"
              onClick={handlePrint}
              data-ocid="invoice.actions_print_button"
              className="w-full h-11 text-sm font-medium rounded-xl border flex items-center justify-center gap-2 transition-colors"
              style={{
                borderColor: darkMode ? "#374151" : "#E5E7EB",
                background: darkMode ? "transparent" : "#FFFFFF",
                color: darkMode ? "#D1D5DB" : "#374151",
              }}
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </button>

            <Separator
              style={{ background: darkMode ? "#374151" : "#F3F4F6" }}
            />

            {/* Auto Save Toggle */}
            <div className="flex items-center justify-between">
              <span
                className="text-sm"
                style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
              >
                Auto Save
              </span>
              <Switch
                checked={autoSave}
                onCheckedChange={setAutoSave}
                data-ocid="invoice.actions_auto_save_switch"
              />
            </div>

            <Separator
              style={{ background: darkMode ? "#374151" : "#F3F4F6" }}
            />

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <span
                className="text-sm"
                style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}
              >
                Dark Mode
              </span>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                data-ocid="invoice.actions_dark_mode_switch"
              />
            </div>

            <Separator
              style={{ background: darkMode ? "#374151" : "#F3F4F6" }}
            />

            {/* Live totals summary */}
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: darkMode ? "#6B7280" : "#9CA3AF" }}
              >
                Summary
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}>
                    Subtotal
                  </span>
                  <span style={{ color: darkMode ? "#D1D5DB" : "#374151" }}>
                    ₹{INR(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}>
                    GST {invoice.gstRate}%
                  </span>
                  <span style={{ color: darkMode ? "#D1D5DB" : "#374151" }}>
                    {invoice.gstEnabled ? `₹${INR(gstAmount)}` : "—"}
                  </span>
                </div>
                {invoice.adjustment !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: darkMode ? "#9CA3AF" : "#6B7280" }}>
                      Adjustment
                    </span>
                    <span
                      style={{
                        color:
                          invoice.adjustment < 0
                            ? "#EF4444"
                            : darkMode
                              ? "#D1D5DB"
                              : "#374151",
                      }}
                    >
                      {invoice.adjustment > 0 ? "+" : ""}₹
                      {INR(Math.abs(invoice.adjustment))}
                    </span>
                  </div>
                )}
                <div
                  className="flex justify-between text-sm font-bold pt-1.5 border-t"
                  style={{ borderColor: darkMode ? "#374151" : "#E5E7EB" }}
                >
                  <span style={{ color: darkMode ? "#F9FAFB" : "#111827" }}>
                    Grand Total
                  </span>
                  <span style={{ color: darkMode ? "#60A5FA" : "#0B1F3A" }}>
                    ₹{INR(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            <Separator
              style={{ background: darkMode ? "#374151" : "#F3F4F6" }}
            />

            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              data-ocid="invoice.actions_reset_button"
              className="w-full h-11 text-sm font-medium rounded-xl border flex items-center justify-center gap-2 transition-colors"
              style={{
                borderColor: darkMode ? "#4B5563" : "#E5E7EB",
                background: darkMode ? "transparent" : "#FFF5F5",
                color: "#EF4444",
              }}
            >
              <RotateCcw className="w-4 h-4" /> Reset Invoice
            </button>
          </div>
        </aside>
      </div>

      {/* ── Load Modal ── */}
      <Dialog open={showLoadModal} onOpenChange={setShowLoadModal}>
        <DialogContent
          className="max-w-lg"
          data-ocid="invoice.load_modal"
          style={{
            background: darkMode ? "#1F2937" : "#FFFFFF",
            borderColor: darkMode ? "#374151" : "#E5E7EB",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: darkMode ? "#F9FAFB" : "#111827" }}>
              Saved Invoices
            </DialogTitle>
          </DialogHeader>

          {entries.length === 0 ? (
            <div
              className="text-center text-sm py-10"
              data-ocid="invoice.saved.empty_state"
              style={{ color: darkMode ? "#6B7280" : "#9CA3AF" }}
            >
              No saved invoices yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  data-ocid={`invoice.saved.item.${i + 1}`}
                  className="flex items-center justify-between p-3 rounded-xl border transition-colors"
                  style={{
                    borderColor: darkMode ? "#374151" : "#E5E7EB",
                    background: darkMode ? "#111827" : "#F9FAFB",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: darkMode ? "#F9FAFB" : "#111827" }}
                    >
                      {entry.data.title} — {entry.data.invoiceNumber}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: darkMode ? "#6B7280" : "#9CA3AF" }}
                    >
                      {new Date(entry.savedAt).toLocaleString()}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: darkMode ? "#6B7280" : "#9CA3AF" }}
                    >
                      {entry.data.companyName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleLoad(entry)}
                      data-ocid={`invoice.saved.load_button.${i + 1}`}
                      className="text-xs h-8 px-3"
                      style={{
                        background: "linear-gradient(135deg, #0B1F3A, #0A2A55)",
                        color: "white",
                      }}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Load
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry.id)}
                      data-ocid={`invoice.saved.delete_button.${i + 1}`}
                      className="p-1.5 rounded-lg transition-colors"
                      title="Delete"
                      style={{ color: darkMode ? "#6B7280" : "#9CA3AF" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
