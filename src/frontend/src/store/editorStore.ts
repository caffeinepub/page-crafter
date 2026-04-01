import { create } from "zustand";
import {
  type CanvasElement,
  type CanvasState,
  DEFAULT_DOCUMENT_SETTINGS,
  DEFAULT_INVOICE_DATA,
  type DocumentSettings,
  type InvoiceFormData,
  type InvoiceLineItem,
  type PageData,
  generateId,
} from "../types/editor";

const MAX_HISTORY = 50;

function newPage(): PageData {
  return { id: generateId(), elements: [], background: "#FFFFFF" };
}

function calcInvoiceTotals(items: InvoiceLineItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const taxTotal = items.reduce(
    (sum, i) => sum + (i.amount * i.taxPercent) / 100,
    0,
  );
  return { subtotal, taxTotal, grandTotal: subtotal + taxTotal };
}

interface ContextMenuState {
  x: number;
  y: number;
  elementId: string;
}

interface EditorStore {
  designId: string | null;
  designName: string;
  pages: PageData[];
  currentPageIndex: number;
  selectedIds: string[];
  editingId: string | null;
  zoom: number;
  snapToGrid: boolean;
  showGrid: boolean;
  invoiceData: InvoiceFormData;
  documentSettings: DocumentSettings;
  contextMenu: ContextMenuState | null;
  isDirty: boolean;
  past: string[];
  future: string[];

  addPage(): void;
  removePage(index: number): void;
  duplicatePage(index: number): void;
  setCurrentPage(index: number): void;

  addElement(element: Omit<CanvasElement, "id" | "zIndex">): string;
  updateElement(id: string, updates: Partial<CanvasElement>): void;
  deleteElement(id: string): void;
  deleteSelectedElements(): void;
  duplicateElement(id: string): void;
  nudgeElements(dx: number, dy: number): void;

  selectElement(id: string, multiSelect?: boolean): void;
  clearSelection(): void;
  setEditingId(id: string | null): void;

  bringForward(id: string): void;
  sendBackward(id: string): void;
  bringToFront(id: string): void;
  sendToBack(id: string): void;
  toggleLock(id: string): void;
  toggleVisibility(id: string): void;

  setZoom(zoom: number): void;
  toggleSnapToGrid(): void;
  toggleShowGrid(): void;

  pushHistory(): void;
  undo(): void;
  redo(): void;

  updateInvoiceData(data: Partial<InvoiceFormData>): void;
  updateInvoiceLineItem(index: number, item: Partial<InvoiceLineItem>): void;
  addInvoiceLineItem(): void;
  removeInvoiceLineItem(index: number): void;

  updateDocumentSettings(settings: Partial<DocumentSettings>): void;
  setDesignName(name: string): void;
  setDesignId(id: string | null): void;
  setContextMenu(menu: ContextMenuState | null): void;
  setIsDirty(dirty: boolean): void;

  loadCanvasState(state: CanvasState, id?: string, name?: string): void;
  getCanvasState(): CanvasState;
  resetEditor(): void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  designId: null,
  designName: "Untitled Design",
  pages: [newPage()],
  currentPageIndex: 0,
  selectedIds: [],
  editingId: null,
  zoom: 1,
  snapToGrid: false,
  showGrid: false,
  invoiceData: { ...DEFAULT_INVOICE_DATA },
  documentSettings: { ...DEFAULT_DOCUMENT_SETTINGS },
  contextMenu: null,
  isDirty: false,
  past: [],
  future: [],

  addPage: () => {
    get().pushHistory();
    set((s) => ({
      pages: [...s.pages, newPage()],
      currentPageIndex: s.pages.length,
      isDirty: true,
    }));
  },

  removePage: (index) => {
    const { pages } = get();
    if (pages.length <= 1) return;
    get().pushHistory();
    set((s) => {
      const newPages = s.pages.filter((_, i) => i !== index);
      return {
        pages: newPages,
        currentPageIndex: Math.min(s.currentPageIndex, newPages.length - 1),
        isDirty: true,
      };
    });
  },

  duplicatePage: (index) => {
    get().pushHistory();
    set((s) => {
      const page = s.pages[index];
      const dup: PageData = {
        id: generateId(),
        background: page.background,
        elements: page.elements.map((el) => ({ ...el, id: generateId() })),
      };
      const newPages = [...s.pages];
      newPages.splice(index + 1, 0, dup);
      return { pages: newPages, currentPageIndex: index + 1, isDirty: true };
    });
  },

  setCurrentPage: (index) =>
    set({ currentPageIndex: index, selectedIds: [], editingId: null }),

  addElement: (element) => {
    get().pushHistory();
    const id = generateId();
    set((s) => {
      const page = s.pages[s.currentPageIndex];
      const maxZ = page.elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
      const newEl = { ...element, id, zIndex: maxZ + 1 } as CanvasElement;
      const newPages = s.pages.map((p, pi) =>
        pi === s.currentPageIndex
          ? { ...p, elements: [...p.elements, newEl] }
          : p,
      );
      return { pages: newPages, selectedIds: [id], isDirty: true };
    });
    return id;
  },

  updateElement: (id, updates) => {
    set((s) => ({
      pages: s.pages.map((page, pi) =>
        pi !== s.currentPageIndex
          ? page
          : {
              ...page,
              elements: page.elements.map((el) =>
                el.id === id ? { ...el, ...updates } : el,
              ),
            },
      ),
      isDirty: true,
    }));
  },

  deleteElement: (id) => {
    get().pushHistory();
    set((s) => ({
      pages: s.pages.map((page, pi) =>
        pi !== s.currentPageIndex
          ? page
          : { ...page, elements: page.elements.filter((el) => el.id !== id) },
      ),
      selectedIds: s.selectedIds.filter((sid) => sid !== id),
      isDirty: true,
    }));
  },

  deleteSelectedElements: () => {
    const { selectedIds } = get();
    if (!selectedIds.length) return;
    get().pushHistory();
    set((s) => {
      const ids = new Set(s.selectedIds);
      return {
        pages: s.pages.map((page, pi) =>
          pi !== s.currentPageIndex
            ? page
            : {
                ...page,
                elements: page.elements.filter((el) => !ids.has(el.id)),
              },
        ),
        selectedIds: [],
        isDirty: true,
      };
    });
  },

  duplicateElement: (id) => {
    const page = get().pages[get().currentPageIndex];
    const el = page.elements.find((e) => e.id === id);
    if (!el) return;
    get().pushHistory();
    const newEl = { ...el, id: generateId(), x: el.x + 20, y: el.y + 20 };
    set((s) => ({
      pages: s.pages.map((p, pi) =>
        pi === s.currentPageIndex
          ? { ...p, elements: [...p.elements, newEl] }
          : p,
      ),
      selectedIds: [newEl.id],
      isDirty: true,
    }));
  },

  nudgeElements: (dx, dy) => {
    const { selectedIds } = get();
    if (!selectedIds.length) return;
    const ids = new Set(selectedIds);
    set((s) => ({
      pages: s.pages.map((page, pi) =>
        pi !== s.currentPageIndex
          ? page
          : {
              ...page,
              elements: page.elements.map((el) =>
                ids.has(el.id) && !el.locked
                  ? { ...el, x: el.x + dx, y: el.y + dy }
                  : el,
              ),
            },
      ),
      isDirty: true,
    }));
  },

  selectElement: (id, multiSelect = false) =>
    set((s) => ({
      selectedIds: multiSelect
        ? s.selectedIds.includes(id)
          ? s.selectedIds.filter((sid) => sid !== id)
          : [...s.selectedIds, id]
        : [id],
      editingId: null,
    })),

  clearSelection: () => set({ selectedIds: [], editingId: null }),
  setEditingId: (id) => set({ editingId: id }),

  bringForward: (id) =>
    set((s) => ({
      pages: s.pages.map((page, pi) => {
        if (pi !== s.currentPageIndex) return page;
        const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);
        const idx = sorted.findIndex((e) => e.id === id);
        if (idx < sorted.length - 1) {
          const tmp = sorted[idx].zIndex;
          sorted[idx] = { ...sorted[idx], zIndex: sorted[idx + 1].zIndex };
          sorted[idx + 1] = { ...sorted[idx + 1], zIndex: tmp };
        }
        return { ...page, elements: sorted };
      }),
    })),

  sendBackward: (id) =>
    set((s) => ({
      pages: s.pages.map((page, pi) => {
        if (pi !== s.currentPageIndex) return page;
        const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);
        const idx = sorted.findIndex((e) => e.id === id);
        if (idx > 0) {
          const tmp = sorted[idx].zIndex;
          sorted[idx] = { ...sorted[idx], zIndex: sorted[idx - 1].zIndex };
          sorted[idx - 1] = { ...sorted[idx - 1], zIndex: tmp };
        }
        return { ...page, elements: sorted };
      }),
    })),

  bringToFront: (id) =>
    set((s) => ({
      pages: s.pages.map((page, pi) => {
        if (pi !== s.currentPageIndex) return page;
        const maxZ = Math.max(...page.elements.map((e) => e.zIndex)) + 1;
        return {
          ...page,
          elements: page.elements.map((el) =>
            el.id === id ? { ...el, zIndex: maxZ } : el,
          ),
        };
      }),
    })),

  sendToBack: (id) =>
    set((s) => ({
      pages: s.pages.map((page, pi) => {
        if (pi !== s.currentPageIndex) return page;
        const minZ = Math.min(...page.elements.map((e) => e.zIndex)) - 1;
        return {
          ...page,
          elements: page.elements.map((el) =>
            el.id === id ? { ...el, zIndex: minZ } : el,
          ),
        };
      }),
    })),

  toggleLock: (id) =>
    set((s) => ({
      pages: s.pages.map((page, pi) =>
        pi !== s.currentPageIndex
          ? page
          : {
              ...page,
              elements: page.elements.map((el) =>
                el.id === id ? { ...el, locked: !el.locked } : el,
              ),
            },
      ),
    })),

  toggleVisibility: (id) =>
    set((s) => ({
      pages: s.pages.map((page, pi) =>
        pi !== s.currentPageIndex
          ? page
          : {
              ...page,
              elements: page.elements.map((el) =>
                el.id === id ? { ...el, visible: !el.visible } : el,
              ),
            },
      ),
    })),

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3, zoom)) }),
  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  pushHistory: () =>
    set((s) => ({
      past: [...s.past, JSON.stringify(s.pages)].slice(-MAX_HISTORY),
      future: [],
    })),

  undo: () =>
    set((s) => {
      if (!s.past.length) return s;
      const current = JSON.stringify(s.pages);
      const previous = s.past[s.past.length - 1];
      return {
        pages: JSON.parse(previous),
        past: s.past.slice(0, -1),
        future: [current, ...s.future].slice(0, MAX_HISTORY),
        selectedIds: [],
        isDirty: true,
      };
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return s;
      const current = JSON.stringify(s.pages);
      const next = s.future[0];
      return {
        pages: JSON.parse(next),
        past: [...s.past, current].slice(-MAX_HISTORY),
        future: s.future.slice(1),
        selectedIds: [],
        isDirty: true,
      };
    }),

  updateInvoiceData: (data) =>
    set((s) => ({ invoiceData: { ...s.invoiceData, ...data }, isDirty: true })),

  updateInvoiceLineItem: (index, item) =>
    set((s) => {
      const lineItems = s.invoiceData.lineItems.map((li, i) => {
        if (i !== index) return li;
        const updated = { ...li, ...item };
        updated.amount = updated.qty * updated.unitPrice;
        return updated;
      });
      return {
        invoiceData: {
          ...s.invoiceData,
          lineItems,
          ...calcInvoiceTotals(lineItems),
        },
        isDirty: true,
      };
    }),

  addInvoiceLineItem: () =>
    set((s) => {
      const lineItems = [
        ...s.invoiceData.lineItems,
        {
          description: "New Item",
          qty: 1,
          unitPrice: 0,
          taxPercent: 18,
          amount: 0,
        },
      ];
      return {
        invoiceData: {
          ...s.invoiceData,
          lineItems,
          ...calcInvoiceTotals(lineItems),
        },
        isDirty: true,
      };
    }),

  removeInvoiceLineItem: (index) =>
    set((s) => {
      const lineItems = s.invoiceData.lineItems.filter((_, i) => i !== index);
      return {
        invoiceData: {
          ...s.invoiceData,
          lineItems,
          ...calcInvoiceTotals(lineItems),
        },
        isDirty: true,
      };
    }),

  updateDocumentSettings: (settings) =>
    set((s) => ({ documentSettings: { ...s.documentSettings, ...settings } })),

  setDesignName: (name) => set({ designName: name, isDirty: true }),
  setDesignId: (id) => set({ designId: id }),
  setContextMenu: (menu) => set({ contextMenu: menu }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  loadCanvasState: (state, id, name) =>
    set({
      pages: state.pages,
      invoiceData: state.invoiceData || { ...DEFAULT_INVOICE_DATA },
      documentSettings: state.documentSettings || {
        ...DEFAULT_DOCUMENT_SETTINGS,
      },
      currentPageIndex: 0,
      selectedIds: [],
      editingId: null,
      past: [],
      future: [],
      designId: id || null,
      designName: name || "Untitled Design",
      isDirty: false,
    }),

  getCanvasState: (): CanvasState => {
    const { pages, invoiceData, documentSettings } = get();
    return { pages, invoiceData, documentSettings };
  },

  resetEditor: () =>
    set({
      designId: null,
      designName: "Untitled Design",
      pages: [newPage()],
      currentPageIndex: 0,
      selectedIds: [],
      editingId: null,
      invoiceData: { ...DEFAULT_INVOICE_DATA },
      documentSettings: { ...DEFAULT_DOCUMENT_SETTINGS },
      past: [],
      future: [],
      isDirty: false,
    }),
}));
