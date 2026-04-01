import { Copy, Lock, MoveDown, MoveUp, Trash2, Unlock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import { PAGE_HEIGHT, PAGE_WIDTH } from "../../types/editor";
import CanvasElementRenderer from "./CanvasElementRenderer";

const HANDLES = [
  { id: "nw", style: { top: -5, left: -5 }, cursor: "nw-resize" },
  { id: "n", style: { top: -5, left: "calc(50% - 4px)" }, cursor: "n-resize" },
  { id: "ne", style: { top: -5, right: -5 }, cursor: "ne-resize" },
  { id: "e", style: { top: "calc(50% - 4px)", right: -5 }, cursor: "e-resize" },
  { id: "se", style: { bottom: -5, right: -5 }, cursor: "se-resize" },
  {
    id: "s",
    style: { bottom: -5, left: "calc(50% - 4px)" },
    cursor: "s-resize",
  },
  { id: "sw", style: { bottom: -5, left: -5 }, cursor: "sw-resize" },
  { id: "w", style: { top: "calc(50% - 4px)", left: -5 }, cursor: "w-resize" },
];

interface Props {
  onSave(): void;
}

export default function CanvasWorkspace({ onSave }: Props) {
  const pages = useEditorStore((s) => s.pages);
  const currentPageIndex = useEditorStore((s) => s.currentPageIndex);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const editingId = useEditorStore((s) => s.editingId);
  const zoom = useEditorStore((s) => s.zoom);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const showGrid = useEditorStore((s) => s.showGrid);
  const selectElement = useEditorStore((s) => s.selectElement);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const updateElement = useEditorStore((s) => s.updateElement);
  const deleteSelectedElements = useEditorStore(
    (s) => s.deleteSelectedElements,
  );
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const nudgeElements = useEditorStore((s) => s.nudgeElements);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const bringForward = useEditorStore((s) => s.bringForward);
  const sendBackward = useEditorStore((s) => s.sendBackward);
  const toggleLock = useEditorStore((s) => s.toggleLock);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const setEditingId = useEditorStore((s) => s.setEditingId);

  const elements = pages[currentPageIndex]?.elements || [];
  const selectedId = selectedIds[0];
  const selectedEl = elements.find((e) => e.id === selectedId);

  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, ex: 0, ey: 0 });
  const isResizing = useRef(false);
  const resizeHandle = useRef("");
  const resizeStart = useRef({ mx: 0, my: 0, ex: 0, ey: 0, ew: 0, eh: 0 });
  const currentDragId = useRef("");
  const didMove = useRef(false);

  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    elementId: string;
  } | null>(null);

  // Alignment guides
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});

  const snap = useCallback(
    (v: number) => (snapToGrid ? Math.round(v / 20) * 20 : v),
    [snapToGrid],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable
      )
        return;
      if (e.key === "Delete" || e.key === "Backspace") deleteSelectedElements();
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        onSave();
      }
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        if (selectedId) duplicateElement(selectedId);
      }
      if (selectedIds.length > 0) {
        const n = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          nudgeElements(-n, 0);
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          nudgeElements(n, 0);
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          nudgeElements(0, -n);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          nudgeElements(0, n);
        }
        if (e.key === "Escape") {
          clearSelection();
          setEditingId(null);
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    selectedIds,
    selectedId,
    deleteSelectedElements,
    undo,
    redo,
    onSave,
    duplicateElement,
    nudgeElements,
    clearSelection,
    setEditingId,
  ]);

  useEffect(() => {
    if (!ctxMenu) return;
    const dismiss = () => setCtxMenu(null);
    document.addEventListener("click", dismiss);
    return () => document.removeEventListener("click", dismiss);
  }, [ctxMenu]);

  // Calculate snap guides against other elements
  const calcGuides = useCallback(
    (id: string, nx: number, ny: number, nw: number, nh: number) => {
      const others = elements.filter((e) => e.id !== id);
      const snaps: { x?: number; y?: number } = {};
      const THRESH = 5 / zoom;
      for (const o of others) {
        // Left-left, center-center, right-right alignment
        if (Math.abs(nx - o.x) < THRESH) snaps.x = o.x;
        if (Math.abs(nx + nw / 2 - (o.x + o.width / 2)) < THRESH)
          snaps.x = o.x + o.width / 2 - nw / 2;
        if (Math.abs(nx + nw - (o.x + o.width)) < THRESH)
          snaps.x = o.x + o.width - nw;
        if (Math.abs(ny - o.y) < THRESH) snaps.y = o.y;
        if (Math.abs(ny + nh / 2 - (o.y + o.height / 2)) < THRESH)
          snaps.y = o.y + o.height / 2 - nh / 2;
        if (Math.abs(ny + nh - (o.y + o.height)) < THRESH)
          snaps.y = o.y + o.height - nh;
      }
      return snaps;
    },
    [elements, zoom],
  );

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      if (e.button !== 0) return;
      // If currently editing this text element, don't start drag
      if (editingId === id) return;
      e.stopPropagation();
      const el = elements.find((el) => el.id === id);
      if (!el || el.locked) {
        selectElement(id, e.shiftKey);
        return;
      }
      selectElement(id, e.shiftKey);
      currentDragId.current = id;
      didMove.current = false;
      dragStart.current = { mx: e.clientX, my: e.clientY, ex: el.x, ey: el.y };
      isDragging.current = true;

      const onMove = (me: MouseEvent) => {
        if (!isDragging.current) return;
        const dx = (me.clientX - dragStart.current.mx) / zoom;
        const dy = (me.clientY - dragStart.current.my) / zoom;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didMove.current = true;
        let nx = snap(dragStart.current.ex + dx);
        let ny = snap(dragStart.current.ey + dy);
        const g = calcGuides(id, nx, ny, el.width, el.height);
        if (g.x !== undefined) nx = g.x;
        if (g.y !== undefined) ny = g.y;
        setGuides(g);
        updateElement(currentDragId.current, { x: nx, y: ny });
      };
      const onUp = () => {
        isDragging.current = false;
        setGuides({});
        if (didMove.current) pushHistory();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [
      elements,
      editingId,
      zoom,
      snap,
      selectElement,
      updateElement,
      pushHistory,
      calcGuides,
    ],
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handleId: string) => {
      if (!selectedEl) return;
      e.stopPropagation();
      e.preventDefault();
      isResizing.current = true;
      resizeHandle.current = handleId;
      const s = {
        mx: e.clientX,
        my: e.clientY,
        ex: selectedEl.x,
        ey: selectedEl.y,
        ew: selectedEl.width,
        eh: selectedEl.height,
      };
      resizeStart.current = s;
      const id = selectedEl.id;
      const elType = selectedEl.type;
      const origFontSize = selectedEl.fontSize || 14;

      const onMove = (me: MouseEvent) => {
        if (!isResizing.current) return;
        const dx = (me.clientX - s.mx) / zoom;
        const dy = (me.clientY - s.my) / zoom;
        const h = handleId;
        const MIN = 20;
        let nx = s.ex;
        let ny = s.ey;
        let nw = s.ew;
        let nh = s.eh;

        if (h.includes("e")) nw = Math.max(MIN, s.ew + dx);
        if (h.includes("s")) nh = Math.max(MIN, s.eh + dy);
        if (h.includes("w")) {
          nw = Math.max(MIN, s.ew - dx);
          nx = s.ex + (s.ew - nw);
        }
        if (h === "n" || h === "ne" || h === "nw") {
          nh = Math.max(MIN, s.eh - dy);
          ny = s.ey + (s.eh - nh);
        }

        // Images: maintain aspect ratio on corner handles
        if (
          elType === "image" &&
          (h === "se" || h === "sw" || h === "ne" || h === "nw")
        ) {
          const ratio = s.ew / s.eh;
          if (Math.abs(dx) > Math.abs(dy)) {
            nh = nw / ratio;
            if (h.includes("n")) ny = s.ey + (s.eh - nh);
          } else {
            nw = nh * ratio;
            if (h.includes("w")) nx = s.ex + (s.ew - nw);
          }
        }

        // Text: resize changes font size proportionally
        if (elType === "text") {
          const scale = nw / s.ew;
          const newFontSize = Math.max(6, Math.round(origFontSize * scale));
          updateElement(id, {
            x: snap(nx),
            y: snap(ny),
            width: snap(nw),
            height: snap(nh),
            fontSize: newFontSize,
          });
          return;
        }

        updateElement(id, {
          x: snap(nx),
          y: snap(ny),
          width: snap(nw),
          height: snap(nh),
        });
      };
      const onUp = () => {
        isResizing.current = false;
        pushHistory();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [selectedEl, zoom, snap, updateElement, pushHistory],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      const el = elements.find((el) => el.id === id);
      if (!el || el.locked) return;
      if (el.type !== "text") return;
      e.stopPropagation();
      setEditingId(id);
    },
    [elements, setEditingId],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      selectElement(id);
      setCtxMenu({ x: e.clientX, y: e.clientY, elementId: id });
    },
    [selectElement],
  );

  const pageW = PAGE_WIDTH * zoom;
  const pageH = PAGE_HEIGHT * zoom;

  return (
    <div
      className="flex-1 overflow-auto canvas-workspace relative"
      style={{ background: "oklch(var(--workspace-bg))" }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        // If click lands on an element or inside a table/input, don't clear selection
        if (target.closest("[data-element-id]")) return;
        clearSelection();
        setEditingId(null);
        setCtxMenu(null);
      }}
      onKeyDown={() => {}}
    >
      {/* Ruler H */}
      <div
        className="sticky top-0 z-10 pointer-events-none no-print"
        style={{
          height: 20,
          background: "#F9FAFB",
          borderBottom: "1px solid #E5E7EB",
          overflow: "hidden",
        }}
      >
        <svg
          aria-hidden="true"
          width="100%"
          height="20"
          style={{ position: "absolute", left: 0 }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <g key={`h-${i * 50}`}>
              <line
                x1={80 + i * 50 * zoom}
                y1={12}
                x2={80 + i * 50 * zoom}
                y2={20}
                stroke="#9CA3AF"
                strokeWidth={0.5}
              />
              <text x={82 + i * 50 * zoom} y={10} fontSize={8} fill="#9CA3AF">
                {i * 50}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex">
        {/* Ruler V */}
        <div
          className="sticky left-0 z-10 pointer-events-none no-print"
          style={{
            width: 20,
            minHeight: pageH + 80,
            background: "#F9FAFB",
            borderRight: "1px solid #E5E7EB",
          }}
        >
          <svg aria-hidden="true" width="20" height={pageH + 80}>
            {Array.from({ length: 25 }).map((_, i) => (
              <g key={`v-${i * 50}`}>
                <line
                  x1={12}
                  y1={40 + i * 50 * zoom}
                  x2={20}
                  y2={40 + i * 50 * zoom}
                  stroke="#9CA3AF"
                  strokeWidth={0.5}
                />
                <text
                  x={10}
                  y={44 + i * 50 * zoom}
                  fontSize={8}
                  fill="#9CA3AF"
                  textAnchor="end"
                  transform={`rotate(-90, 10, ${44 + i * 50 * zoom})`}
                >
                  {i * 50}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Canvas container */}
        <div className="flex-1 flex justify-center py-10 px-10">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 32,
            }}
          >
            {/* Main canvas */}
            <div
              className={`a4-canvas relative bg-white ${showGrid ? "canvas-grid" : ""}`}
              style={{
                width: pageW,
                height: pageH,
                position: "relative",
                flexShrink: 0,
              }}
            >
              {elements
                .filter((el) => el.visible)
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((el) => (
                  <CanvasElementRenderer
                    key={el.id}
                    element={el}
                    zoom={zoom}
                    isSelected={selectedIds.includes(el.id)}
                    isEditing={editingId === el.id}
                    onMouseDown={handleElementMouseDown}
                    onDoubleClick={handleDoubleClick}
                    onContextMenu={handleContextMenu}
                  />
                ))}

              {/* Alignment guides */}
              {guides.x !== undefined && (
                <div
                  style={{
                    position: "absolute",
                    left: guides.x * zoom,
                    top: 0,
                    width: 1,
                    height: "100%",
                    background: "#F59E0B",
                    pointerEvents: "none",
                    zIndex: 99998,
                    opacity: 0.8,
                  }}
                />
              )}
              {guides.y !== undefined && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: guides.y * zoom,
                    width: "100%",
                    height: 1,
                    background: "#F59E0B",
                    pointerEvents: "none",
                    zIndex: 99998,
                    opacity: 0.8,
                  }}
                />
              )}

              {/* Selection bounding box + resize handles - ONLY for selected element */}
              {selectedEl && editingId !== selectedEl.id && (
                <div
                  style={{
                    position: "absolute",
                    left: selectedEl.x * zoom - 2,
                    top: selectedEl.y * zoom - 2,
                    width: selectedEl.width * zoom + 4,
                    height: selectedEl.height * zoom + 4,
                    border: "2px dashed #1E6FE6",
                    pointerEvents: "none",
                    zIndex: 9999,
                    boxSizing: "border-box",
                  }}
                >
                  {!selectedEl.locked &&
                    HANDLES.map((handle) => (
                      <div
                        key={handle.id}
                        className="resize-handle"
                        style={{
                          ...handle.style,
                          cursor: handle.cursor,
                          pointerEvents: "all",
                        }}
                        onMouseDown={(e) => handleResizeMouseDown(e, handle.id)}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* Other pages thumbnails */}
            {pages.length > 1 && (
              <div className="flex gap-4 flex-wrap justify-center">
                {pages.map((page, i) => {
                  if (i === currentPageIndex) return null;
                  return (
                    <div
                      key={page.id}
                      className="bg-white shadow-canvas border border-border rounded cursor-pointer hover:border-primary transition"
                      style={{
                        width: 120,
                        height: 170,
                        overflow: "hidden",
                        position: "relative",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        useEditorStore.getState().setCurrentPage(i);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          useEditorStore.getState().setCurrentPage(i);
                      }}
                      title={`Page ${i + 1}`}
                    >
                      <div
                        style={{
                          transform: `scale(${120 / PAGE_WIDTH})`,
                          transformOrigin: "top left",
                          width: PAGE_WIDTH,
                          height: PAGE_HEIGHT,
                          background: page.background,
                          pointerEvents: "none",
                        }}
                      >
                        {page.elements
                          .filter((el) => el.visible)
                          .sort((a, b) => a.zIndex - b.zIndex)
                          .map((el) => (
                            <CanvasElementRenderer
                              key={el.id}
                              element={el}
                              zoom={1}
                              isSelected={false}
                              isEditing={false}
                              onMouseDown={() => {}}
                              onDoubleClick={() => {}}
                              onContextMenu={() => {}}
                            />
                          ))}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 text-center text-[9px] text-muted-foreground bg-white/80 py-0.5">
                        Page {i + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <div
          data-ocid="editor.context_menu"
          className="fixed bg-white border border-border rounded-lg shadow-lg py-1 z-50"
          style={{ left: ctxMenu.x, top: ctxMenu.y, minWidth: 160 }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {[
            {
              label: "Bring Forward",
              icon: <MoveUp className="w-3.5 h-3.5" />,
              action: () => {
                bringForward(ctxMenu.elementId);
                setCtxMenu(null);
              },
            },
            {
              label: "Send Backward",
              icon: <MoveDown className="w-3.5 h-3.5" />,
              action: () => {
                sendBackward(ctxMenu.elementId);
                setCtxMenu(null);
              },
            },
            {
              label: "Duplicate",
              icon: <Copy className="w-3.5 h-3.5" />,
              action: () => {
                duplicateElement(ctxMenu.elementId);
                setCtxMenu(null);
              },
            },
            {
              label: elements.find((e) => e.id === ctxMenu.elementId)?.locked
                ? "Unlock"
                : "Lock",
              icon: elements.find((e) => e.id === ctxMenu.elementId)?.locked ? (
                <Unlock className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              ),
              action: () => {
                toggleLock(ctxMenu.elementId);
                setCtxMenu(null);
              },
            },
            {
              label: "Delete",
              icon: <Trash2 className="w-3.5 h-3.5 text-destructive" />,
              action: () => {
                deleteSelectedElements();
                setCtxMenu(null);
              },
              destructive: true,
            },
          ].map((item) => (
            <button
              type="button"
              key={item.label}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-muted transition ${
                (item as { destructive?: boolean }).destructive
                  ? "text-destructive"
                  : "text-foreground"
              }`}
              onClick={item.action}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
