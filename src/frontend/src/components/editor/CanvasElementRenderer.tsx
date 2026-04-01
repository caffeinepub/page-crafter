import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import type { CanvasElement } from "../../types/editor";

interface Props {
  element: CanvasElement;
  zoom: number;
  isSelected: boolean;
  isEditing: boolean;
  onMouseDown(e: React.MouseEvent, id: string): void;
  onDoubleClick(e: React.MouseEvent, id: string): void;
  onContextMenu(e: React.MouseEvent, id: string): void;
}

// ─── Editable Table (Excel-like) ────────────────────────────────────────────
interface EditableCellKey {
  row: number;
  col: number;
  isHeader: boolean;
}

function EditableTable({ el, zoom }: { el: CanvasElement; zoom: number }) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  const headers = el.tableHeaders ?? ["Column 1", "Column 2", "Column 3"];
  const data = el.tableData ?? [["Cell", "Cell", "Cell"]];
  const colWidths =
    el.tableColWidths ?? headers.map(() => 100 / headers.length);
  const bdr = el.tableBorderColor || "#CBD5E1";
  const hBg = el.tableHeaderBg || "#1E6FE6";
  const pad = el.tableCellPadding ?? 8;

  const [editingCell, setEditingCell] = useState<EditableCellKey | null>(null);
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidths = useRef<number[]>([]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const commitCell = (key: EditableCellKey, value: string) => {
    if (key.isHeader) {
      const nh = [...headers];
      nh[key.col] = value;
      updateElement(el.id, { tableHeaders: nh });
    } else {
      const nd = data.map((r) => [...r]);
      if (!nd[key.row]) nd[key.row] = [];
      nd[key.row][key.col] = value;
      updateElement(el.id, { tableData: nd });
    }
    pushHistory();
  };

  const handleCellClick = (e: React.MouseEvent, key: EditableCellKey) => {
    e.stopPropagation();
    setEditingCell(key);
  };

  const handleInputBlur = (value: string) => {
    if (editingCell) {
      commitCell(editingCell, value);
      setEditingCell(null);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (editingCell) {
        commitCell(editingCell, (e.target as HTMLInputElement).value);
        // Move to next row
        if (!editingCell.isHeader) {
          const nextRow = editingCell.row + 1;
          if (nextRow < data.length) {
            setEditingCell({
              row: nextRow,
              col: editingCell.col,
              isHeader: false,
            });
          } else {
            setEditingCell(null);
          }
        } else {
          setEditingCell(null);
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (editingCell) {
        commitCell(editingCell, (e.target as HTMLInputElement).value);
        const nextCol = editingCell.col + 1;
        if (nextCol < headers.length) {
          setEditingCell({ ...editingCell, col: nextCol });
        } else if (!editingCell.isHeader && editingCell.row + 1 < data.length) {
          setEditingCell({ row: editingCell.row + 1, col: 0, isHeader: false });
        } else {
          setEditingCell(null);
        }
      }
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
    e.stopPropagation();
  };

  // Column resize
  const handleColResizeMouseDown = (e: React.MouseEvent, colIdx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingCol(colIdx);
    resizeStartX.current = e.clientX;
    resizeStartWidths.current = [...colWidths];

    const tableWidth = tableRef.current?.offsetWidth ?? 1;
    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - resizeStartX.current;
      const dPct = (dx / tableWidth) * 100;
      const newWidths = [...resizeStartWidths.current];
      const minPct = 5;
      const leftW = Math.max(minPct, newWidths[colIdx] + dPct);
      const delta = leftW - newWidths[colIdx];
      if (colIdx + 1 < newWidths.length) {
        const rightW = Math.max(minPct, newWidths[colIdx + 1] - delta);
        newWidths[colIdx] = leftW;
        newWidths[colIdx + 1] = rightW;
        // Normalize
        const total = newWidths.reduce((a, b) => a + b, 0);
        const normalized = newWidths.map((w) => (w / total) * 100);
        updateElement(el.id, { tableColWidths: normalized });
      }
    };
    const onUp = () => {
      setResizingCol(null);
      pushHistory();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const cellStyle = (isH: boolean, col: number): React.CSSProperties => ({
    padding: `${pad * zoom}px`,
    border: `1px solid ${bdr}`,
    background: isH ? hBg : "#fff",
    color: isH ? "#fff" : "#111827",
    fontWeight: isH ? 600 : 400,
    fontSize: 11 * zoom,
    position: "relative",
    width: `${colWidths[col] ?? 100 / headers.length}%`,
    boxSizing: "border-box",
    cursor: "cell",
    verticalAlign: "middle",
  });

  return (
    <div
      style={{ width: "100%", height: "100%", overflow: "auto" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <table
        ref={tableRef}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontSize: 11 * zoom,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <thead>
          <tr>
            {headers.map((h, ci) => {
              const key: EditableCellKey = { row: 0, col: ci, isHeader: true };
              const isActive = editingCell?.isHeader && editingCell.col === ci;
              return (
                <th
                  key={`header-${h}`}
                  style={{ ...cellStyle(true, ci), textAlign: "left" }}
                  onClick={(e) => handleCellClick(e, key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleCellClick(e as unknown as React.MouseEvent, key);
                  }}
                >
                  {isActive ? (
                    <input
                      ref={inputRef}
                      defaultValue={h}
                      onBlur={(e) => handleInputBlur(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 11 * zoom,
                        fontFamily: "inherit",
                        padding: 0,
                      }}
                    />
                  ) : (
                    h
                  )}
                  {/* Col resize handle */}
                  {ci < headers.length - 1 && (
                    <div
                      onMouseDown={(e) => handleColResizeMouseDown(e, ci)}
                      style={{
                        position: "absolute",
                        top: 0,
                        right: -2,
                        width: 4,
                        height: "100%",
                        cursor: "col-resize",
                        background:
                          resizingCol === ci ? "#60A5FA" : "transparent",
                        zIndex: 10,
                      }}
                    />
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr
              // biome-ignore lint/suspicious/noArrayIndexKey: table rows have no unique ID
              key={`row-${ri}`}
              style={{ background: ri % 2 === 0 ? "#fff" : "#F8FAFC" }}
            >
              {headers.map((_, ci) => {
                const key: EditableCellKey = {
                  row: ri,
                  col: ci,
                  isHeader: false,
                };
                const isActive =
                  editingCell &&
                  !editingCell.isHeader &&
                  editingCell.row === ri &&
                  editingCell.col === ci;
                const cellVal = row[ci] ?? "";
                return (
                  <td
                    // biome-ignore lint/suspicious/noArrayIndexKey: table cells have no unique ID
                    key={`cell-${ri}-${ci}`}
                    style={{
                      ...cellStyle(false, ci),
                      background: isActive
                        ? "#EFF6FF"
                        : ri % 2 === 0
                          ? "#fff"
                          : "#F8FAFC",
                      outline: isActive ? "2px solid #3B82F6" : "none",
                      outlineOffset: -2,
                    }}
                    onClick={(e) => handleCellClick(e, key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        handleCellClick(e as unknown as React.MouseEvent, key);
                    }}
                  >
                    {isActive ? (
                      <input
                        ref={inputRef}
                        defaultValue={cellVal}
                        onBlur={(e) => handleInputBlur(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          color: "#111827",
                          fontSize: 11 * zoom,
                          fontFamily: "inherit",
                          padding: 0,
                        }}
                      />
                    ) : (
                      cellVal
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Invoice Table ───────────────────────────────────────────────────────────
function InvoiceTable({ el, zoom }: { el: CanvasElement; zoom: number }) {
  const invoiceData = useEditorStore((s) => s.invoiceData);
  const updateInvoiceData = useEditorStore((s) => s.updateInvoiceData);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const hBg = el.tableHeaderBg || "#1E6FE6";
  const bdr = el.tableBorderColor || "#E5E7EB";
  const pad = el.tableCellPadding || 10;
  const cur = invoiceData.currency;

  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const cols = ["DESCRIPTION", "QTY", "UNIT PRICE", "TAX %", "AMOUNT"];

  const getVal = (ri: number, ci: number): string => {
    const item = invoiceData.lineItems[ri];
    if (!item) return "";
    if (ci === 0) return item.description;
    if (ci === 1) return String(item.qty);
    if (ci === 2) return String(item.unitPrice);
    if (ci === 3) return String(item.taxPercent);
    if (ci === 4) return String(item.amount);
    return "";
  };

  const commitInvoiceCell = (ri: number, ci: number, val: string) => {
    const items = invoiceData.lineItems.map((it, i) => {
      if (i !== ri) return it;
      const clone = { ...it };
      if (ci === 0) clone.description = val;
      else if (ci === 1) clone.qty = Number(val) || 0;
      else if (ci === 2) clone.unitPrice = Number(val) || 0;
      else if (ci === 3) clone.taxPercent = Number(val) || 0;
      // Recalculate amount
      clone.amount = clone.qty * clone.unitPrice;
      return clone;
    });
    const subtotal = items.reduce((s, it) => s + it.amount, 0);
    const taxTotal = items.reduce(
      (s, it) => s + it.amount * (it.taxPercent / 100),
      0,
    );
    updateInvoiceData({
      lineItems: items,
      subtotal,
      taxTotal,
      grandTotal: subtotal + taxTotal,
    });
    pushHistory();
  };

  const p = pad * zoom;
  const fs = 11 * zoom;
  const tdStyle = (align: "left" | "right" = "left"): React.CSSProperties => ({
    padding: `${p * 0.8}px ${p}px`,
    border: `1px solid ${bdr}`,
    fontSize: fs,
    textAlign: align,
    verticalAlign: "middle",
    position: "relative",
    cursor: "cell",
  });

  return (
    <div
      style={{ width: "100%", height: "100%", overflow: "auto" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <thead>
          <tr style={{ background: hBg, color: "#fff" }}>
            {cols.map((h, ci) => (
              <th
                key={h}
                style={{
                  ...tdStyle(ci === 0 ? "left" : "right"),
                  background: hBg,
                  color: "#fff",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoiceData.lineItems.map((_item, ri) => (
            <tr
              // biome-ignore lint/suspicious/noArrayIndexKey: invoice rows identified by index
              key={`invoicerow-${ri}`}
              style={{ background: ri % 2 === 0 ? "#fff" : "#F9FAFB" }}
            >
              {cols.map((_, ci) => {
                const isActive =
                  editingCell?.row === ri && editingCell?.col === ci;
                const cellVal = getVal(ri, ci);
                return (
                  <td
                    // biome-ignore lint/suspicious/noArrayIndexKey: invoice cells identified by index
                    key={`invoicecell-${ci}`}
                    style={{
                      ...tdStyle(ci === 0 ? "left" : "right"),
                      color: ci === 4 ? "#111827" : "#374151",
                      fontWeight: ci === 4 ? 600 : 400,
                      background: isActive ? "#EFF6FF" : undefined,
                      outline: isActive ? "2px solid #3B82F6" : "none",
                      outlineOffset: -2,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCell({ row: ri, col: ci });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        setEditingCell({ row: ri, col: ci });
                      }
                    }}
                  >
                    {isActive ? (
                      <input
                        ref={inputRef}
                        defaultValue={cellVal}
                        onBlur={(e) => {
                          commitInvoiceCell(ri, ci, e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter" || e.key === "Escape") {
                            commitInvoiceCell(
                              ri,
                              ci,
                              (e.target as HTMLInputElement).value,
                            );
                            setEditingCell(null);
                          } else if (e.key === "Tab") {
                            e.preventDefault();
                            commitInvoiceCell(
                              ri,
                              ci,
                              (e.target as HTMLInputElement).value,
                            );
                            const nextCol = ci + 1 < cols.length ? ci + 1 : 0;
                            const nextRow = ci + 1 < cols.length ? ri : ri + 1;
                            if (nextRow < invoiceData.lineItems.length) {
                              setEditingCell({ row: nextRow, col: nextCol });
                            } else {
                              setEditingCell(null);
                            }
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontSize: fs,
                          fontFamily: "inherit",
                          textAlign: ci === 0 ? "left" : "right",
                          padding: 0,
                          color: ci === 4 ? "#111827" : "#374151",
                        }}
                      />
                    ) : ci === 2 || ci === 4 ? (
                      `${cur}${Number(cellVal).toLocaleString()}`
                    ) : ci === 3 ? (
                      `${cellVal}%`
                    ) : (
                      cellVal
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={4}
              style={{
                ...tdStyle("right"),
                color: "#6B7280",
                fontSize: fs * 0.9,
              }}
            >
              SUBTOTAL
            </td>
            <td style={{ ...tdStyle("right"), fontWeight: 600 }}>
              {cur}
              {invoiceData.subtotal.toLocaleString()}
            </td>
          </tr>
          <tr>
            <td
              colSpan={4}
              style={{
                ...tdStyle("right"),
                color: "#6B7280",
                fontSize: fs * 0.9,
              }}
            >
              TAX TOTAL
            </td>
            <td style={{ ...tdStyle("right"), fontWeight: 600 }}>
              {cur}
              {invoiceData.taxTotal.toLocaleString()}
            </td>
          </tr>
          <tr style={{ background: hBg }}>
            <td
              colSpan={4}
              style={{
                ...tdStyle("right"),
                background: hBg,
                color: "#fff",
                fontWeight: 700,
                fontSize: fs * 1.1,
              }}
            >
              GRAND TOTAL
            </td>
            <td
              style={{
                ...tdStyle("right"),
                background: hBg,
                color: "#fff",
                fontWeight: 700,
                fontSize: fs * 1.2,
              }}
            >
              {cur}
              {invoiceData.grandTotal.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Shape ──────────────────────────────────────────────────────────────────
function ShapeEl({ el }: { el: CanvasElement }) {
  const fill = el.fill || "none";
  const stroke = el.stroke || "none";
  const sw = el.strokeWidth || 0;
  const t = el.shapeType || "rectangle";
  if (t === "rectangle")
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: fill === "none" ? "transparent" : fill,
          border:
            stroke !== "none" && sw > 0 ? `${sw}px solid ${stroke}` : "none",
          borderRadius: el.borderRadius || 0,
          boxSizing: "border-box",
        }}
      />
    );
  if (t === "circle")
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: fill === "none" ? "transparent" : fill,
          border:
            stroke !== "none" && sw > 0 ? `${sw}px solid ${stroke}` : "none",
          borderRadius: "50%",
          boxSizing: "border-box",
        }}
      />
    );
  if (t === "triangle")
    return (
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="50,5 97,95 3,95"
          fill={fill === "none" ? "transparent" : fill}
          stroke={stroke === "none" ? "transparent" : stroke}
          strokeWidth={sw}
        />
      </svg>
    );
  if (t === "line")
    return (
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="50%"
          stroke={stroke === "none" ? "#333" : stroke}
          strokeWidth={sw || 2}
        />
      </svg>
    );
  if (t === "arrow") {
    const sid = `ah-${el.id}`;
    return (
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <defs>
          <marker
            id={sid}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={stroke === "none" ? "#333" : stroke}
            />
          </marker>
        </defs>
        <line
          x1="0"
          y1="50%"
          x2="calc(100% - 8px)"
          y2="50%"
          stroke={stroke === "none" ? "#333" : stroke}
          strokeWidth={sw || 2}
          markerEnd={`url(#${sid})`}
        />
      </svg>
    );
  }
  return null;
}

// ─── Inline Text Editor ──────────────────────────────────────────────────────
function EditableTextDiv({
  el,
  zoom,
  isEditing,
}: {
  el: CanvasElement;
  zoom: number;
  isEditing: boolean;
}) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const setEditingId = useEditorStore((s) => s.setEditingId);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const divRef = useRef<HTMLDivElement>(null);
  const lastContent = useRef(el.content || "");

  // When entering edit mode, focus and place cursor at end
  useEffect(() => {
    if (isEditing && divRef.current) {
      divRef.current.focus();
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(divRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  // Keep innerText in sync when not editing (e.g. content changed via invoice binding)
  useEffect(() => {
    if (!isEditing && divRef.current) {
      const newContent = el.content || "";
      if (divRef.current.innerText !== newContent) {
        divRef.current.innerText = newContent;
      }
      lastContent.current = newContent;
    }
  }, [el.content, isEditing]);

  const handleInput = useCallback(() => {
    if (divRef.current) {
      const txt = divRef.current.innerText;
      lastContent.current = txt;
      updateElement(el.id, { content: txt });
    }
  }, [el.id, updateElement]);

  const handleBlur = useCallback(() => {
    if (divRef.current) {
      updateElement(el.id, { content: divRef.current.innerText });
    }
    setEditingId(null);
    pushHistory();
  }, [el.id, updateElement, setEditingId, pushHistory]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        if (divRef.current) {
          updateElement(el.id, { content: divRef.current.innerText });
        }
        setEditingId(null);
        pushHistory();
      }
    },
    [el.id, updateElement, setEditingId, pushHistory],
  );

  // Resolve invoice-bound content
  let displayContent = el.content || "";
  if (el.invoiceBinding) {
    const inv = useEditorStore.getState().invoiceData as unknown as Record<
      string,
      unknown
    >;
    const val = inv[el.invoiceBinding];
    if (val !== undefined) displayContent = String(val);
  }

  return (
    <div
      ref={divRef}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => {
        if (isEditing) e.stopPropagation();
      }}
      style={{
        width: "100%",
        height: "100%",
        fontFamily: el.fontFamily || "Inter",
        fontSize: (el.fontSize || 14) * zoom,
        fontWeight: el.fontWeight || "400",
        fontStyle: el.fontStyle || "normal",
        textDecoration: el.textDecoration || "none",
        textAlign: el.textAlign || "left",
        color: el.color || "#111827",
        lineHeight: el.lineHeight || 1.4,
        letterSpacing: (el.letterSpacing || 0) * zoom,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowWrap: "break-word",
        overflow: "hidden",
        padding: 2,
        boxSizing: "border-box",
        outline: isEditing ? "2px solid #3B82F6" : "none",
        cursor: isEditing ? "text" : "inherit",
        userSelect: isEditing ? "text" : "none",
        caretColor: el.color || "#111827",
      }}
    >
      {!isEditing && displayContent}
    </div>
  );
}

// ─── Main Renderer ───────────────────────────────────────────────────────────
export default function CanvasElementRenderer({
  element: el,
  zoom,
  isEditing,
  onMouseDown,
  onDoubleClick,
  onContextMenu,
}: Props) {
  if (!el.visible) return null;

  const isTable = el.type === "table";
  const isText = el.type === "text";

  return (
    <div
      data-element-id={el.id}
      style={{
        position: "absolute",
        left: el.x * zoom,
        top: el.y * zoom,
        width: el.width * zoom,
        height: el.height * zoom,
        transform: `rotate(${el.rotation}deg)`,
        opacity: el.opacity,
        cursor: el.locked ? "not-allowed" : isEditing ? "text" : "move",
        userSelect: isEditing ? "text" : "none",
        zIndex: el.zIndex,
        overflow: isTable ? "auto" : "hidden",
        boxSizing: "border-box",
        // Selection shown by CanvasWorkspace overlay, not here
      }}
      onMouseDown={(e) => {
        // Don't start drag if we're editing text or inside a table cell
        if (isEditing && isText) return;
        if (isTable) {
          // Still select the table element on mousedown, but don't drag from inside
          onMouseDown(e, el.id);
          return;
        }
        onMouseDown(e, el.id);
      }}
      onDoubleClick={(e) => onDoubleClick(e, el.id)}
      onContextMenu={(e) => onContextMenu(e, el.id)}
    >
      {isText && <EditableTextDiv el={el} zoom={zoom} isEditing={isEditing} />}
      {el.type === "shape" && <ShapeEl el={el} />}
      {el.type === "image" && (
        <img
          src={el.src}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: el.objectFit || "contain",
            display: "block",
            pointerEvents: "none",
          }}
          draggable={false}
        />
      )}
      {isTable &&
        (el.isInvoiceTable ? (
          <InvoiceTable el={el} zoom={zoom} />
        ) : (
          <EditableTable el={el} zoom={zoom} />
        ))}
    </div>
  );
}
