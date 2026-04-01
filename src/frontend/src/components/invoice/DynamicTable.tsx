import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Column {
  id: string;
  label: string;
  widthPx: number;
  type: "text" | "number";
}

export interface Row {
  id: string;
  cells: Record<string, string>;
}

export interface TableData {
  id: string;
  title: string;
  columns: Column[];
  rows: Row[];
}

interface DynamicTableProps {
  tableData: TableData;
  onChange: (updated: TableData) => void;
  onRemove: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function formatNumber(val: string): string {
  const n = Number.parseFloat(val);
  if (Number.isNaN(n)) return val;
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function computeAmount(row: Row, cols: Column[]): string {
  const qtyCol = cols.find(
    (c) =>
      c.label.toLowerCase() === "qty" || c.label.toLowerCase() === "quantity",
  );
  const priceCol = cols.find(
    (c) =>
      c.label.toLowerCase() === "unit price" ||
      c.label.toLowerCase() === "price" ||
      c.label.toLowerCase() === "rate",
  );
  if (!qtyCol || !priceCol) return "";
  const qty = Number.parseFloat(row.cells[qtyCol.id] || "0");
  const price = Number.parseFloat(row.cells[priceCol.id] || "0");
  if (Number.isNaN(qty) || Number.isNaN(price)) return "";
  return (qty * price).toFixed(2);
}

export default function DynamicTable({
  tableData,
  onChange,
  onRemove,
}: DynamicTableProps) {
  const [hoveredColId, setHoveredColId] = useState<string | null>(null);
  const [dropTargetColId, setDropTargetColId] = useState<string | null>(null);
  const [dropTargetRowId, setDropTargetRowId] = useState<string | null>(null);

  // Refs for drag state (avoid stale closures)
  const tableDataRef = useRef(tableData);
  useEffect(() => {
    tableDataRef.current = tableData;
  }, [tableData]);

  const resizeRef = useRef<{
    colId: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const colDragRef = useRef<string | null>(null);
  const colDragFromGripRef = useRef(false);
  const rowDragRef = useRef<string | null>(null);
  const rowDragFromGripRef = useRef(false);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { columns, rows } = tableData;

  // Column resize mouse handlers
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, colId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const col = tableDataRef.current.columns.find((c) => c.id === colId);
      if (!col) return;
      resizeRef.current = {
        colId,
        startX: e.clientX,
        startWidth: col.widthPx,
      };
    },
    [],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const { colId, startX, startWidth } = resizeRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(60, startWidth + delta);
      const td = tableDataRef.current;
      onChange({
        ...td,
        columns: td.columns.map((c) =>
          c.id === colId ? { ...c, widthPx: newWidth } : c,
        ),
      });
    };
    const onUp = () => {
      resizeRef.current = null;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [onChange]);

  // Column drag (reorder) — only when drag started on grip
  const handleColDragStart = (e: React.DragEvent, colId: string) => {
    if (!colDragFromGripRef.current) {
      e.preventDefault();
      return;
    }
    colDragRef.current = colId;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleColDragOver = (e: React.DragEvent, colId: string) => {
    if (!colDragRef.current) return;
    e.preventDefault();
    setDropTargetColId(colId);
  };
  const handleColDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const fromId = colDragRef.current;
    if (!fromId || fromId === targetColId) {
      colDragRef.current = null;
      colDragFromGripRef.current = false;
      setDropTargetColId(null);
      return;
    }
    const td = tableDataRef.current;
    const fromIdx = td.columns.findIndex((c) => c.id === fromId);
    const toIdx = td.columns.findIndex((c) => c.id === targetColId);
    const newCols = [...td.columns];
    const [moved] = newCols.splice(fromIdx, 1);
    newCols.splice(toIdx, 0, moved);
    onChange({ ...td, columns: newCols });
    colDragRef.current = null;
    colDragFromGripRef.current = false;
    setDropTargetColId(null);
  };

  // Row drag (reorder) — only when drag started on grip
  const handleRowDragStart = (e: React.DragEvent, rowId: string) => {
    if (!rowDragFromGripRef.current) {
      e.preventDefault();
      return;
    }
    rowDragRef.current = rowId;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleRowDragOver = (e: React.DragEvent, rowId: string) => {
    if (!rowDragRef.current) return;
    e.preventDefault();
    setDropTargetRowId(rowId);
  };
  const handleRowDrop = (e: React.DragEvent, targetRowId: string) => {
    e.preventDefault();
    const fromId = rowDragRef.current;
    if (!fromId || fromId === targetRowId) {
      rowDragRef.current = null;
      rowDragFromGripRef.current = false;
      setDropTargetRowId(null);
      return;
    }
    const td = tableDataRef.current;
    const fromIdx = td.rows.findIndex((r) => r.id === fromId);
    const toIdx = td.rows.findIndex((r) => r.id === targetRowId);
    const newRows = [...td.rows];
    const [moved] = newRows.splice(fromIdx, 1);
    newRows.splice(toIdx, 0, moved);
    onChange({ ...td, rows: newRows });
    rowDragRef.current = null;
    rowDragFromGripRef.current = false;
    setDropTargetRowId(null);
  };

  const handleCellChange = (rowId: string, colId: string, value: string) => {
    const isAmountCol =
      tableDataRef.current.columns
        .find((c) => c.id === colId)
        ?.label.toLowerCase() === "amount";
    if (isAmountCol) return;
    const td = tableDataRef.current;
    onChange({
      ...td,
      rows: td.rows.map((r) =>
        r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r,
      ),
    });
  };

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowId: string,
    rowIdx: number,
    colIdx: number,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Insert new row after current row
      const td = tableDataRef.current;
      const newRow: Row = {
        id: generateId(),
        cells: Object.fromEntries(td.columns.map((c) => [c.id, ""])),
      };
      const newRows = [...td.rows];
      newRows.splice(rowIdx + 1, 0, newRow);
      onChange({ ...td, rows: newRows });
      // Focus the same column in the new row
      setTimeout(() => {
        const inputs = tableContainerRef.current?.querySelectorAll(
          `[data-rowidx="${rowIdx + 1}"]`,
        );
        (inputs?.[colIdx] as HTMLInputElement)?.focus();
      }, 30);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const td = tableDataRef.current;
      const nextColIdx = colIdx + 1;
      const curRowIdx = td.rows.findIndex((r) => r.id === rowId);
      if (nextColIdx < td.columns.length) {
        const inputs = tableContainerRef.current?.querySelectorAll(
          `[data-rowidx="${curRowIdx}"]`,
        );
        (inputs?.[nextColIdx] as HTMLInputElement)?.focus();
      } else if (curRowIdx < td.rows.length - 1) {
        const inputs = tableContainerRef.current?.querySelectorAll(
          `[data-rowidx="${curRowIdx + 1}"]`,
        );
        (inputs?.[0] as HTMLInputElement)?.focus();
      }
    }
  };

  const addRow = () => {
    const td = tableDataRef.current;
    const newRow: Row = {
      id: generateId(),
      cells: Object.fromEntries(td.columns.map((c) => [c.id, ""])),
    };
    onChange({ ...td, rows: [...td.rows, newRow] });
  };

  const removeRow = (rowId: string) => {
    const td = tableDataRef.current;
    onChange({ ...td, rows: td.rows.filter((r) => r.id !== rowId) });
  };

  const addColumn = () => {
    const td = tableDataRef.current;
    const newColId = generateId();
    const newCol: Column = {
      id: newColId,
      label: `Column ${td.columns.length + 1}`,
      widthPx: 120,
      type: "text",
    };
    onChange({
      ...td,
      columns: [...td.columns, newCol],
      rows: td.rows.map((r) => ({
        ...r,
        cells: { ...r.cells, [newColId]: "" },
      })),
    });
  };

  const removeColumn = (colId: string) => {
    const td = tableDataRef.current;
    if (td.columns.length <= 1) return;
    onChange({
      ...td,
      columns: td.columns.filter((c) => c.id !== colId),
      rows: td.rows.map((r) => {
        const cells = { ...r.cells };
        delete cells[colId];
        return { ...r, cells };
      }),
    });
  };

  const updateColumnLabel = (colId: string, label: string) => {
    const td = tableDataRef.current;
    onChange({
      ...td,
      columns: td.columns.map((c) => (c.id === colId ? { ...c, label } : c)),
    });
  };

  const updateTitle = (title: string) =>
    onChange({ ...tableDataRef.current, title });

  const totalTableWidth =
    columns.reduce((sum, c) => sum + c.widthPx, 0) + 28 + 36; // grip col + delete col

  return (
    <div className="mb-8">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <input
          type="text"
          value={tableData.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="text-sm font-semibold text-gray-800 bg-transparent border-0 border-b border-transparent focus:border-blue-300 outline-none flex-1 min-w-32"
          placeholder="Table Title"
        />
        <button
          type="button"
          onClick={addColumn}
          data-ocid="invoice.add_column_button"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-2 py-1 rounded transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Column
        </button>
        <button
          type="button"
          onClick={onRemove}
          data-ocid="invoice.remove_table_button"
          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded border border-red-100 hover:border-red-300 transition-colors"
        >
          Remove Table
        </button>
      </div>

      {/* Table wrapper */}
      <div ref={tableContainerRef} className="overflow-x-auto">
        <table
          className="border-collapse border border-gray-200"
          style={{
            tableLayout: "fixed",
            width: `${totalTableWidth}px`,
            minWidth: "100%",
          }}
        >
          <colgroup>
            {/* Row grip column */}
            <col style={{ width: "28px" }} />
            {columns.map((col) => (
              <col key={col.id} style={{ width: `${col.widthPx}px` }} />
            ))}
            {/* Delete row column */}
            <col style={{ width: "36px" }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50">
              {/* Empty grip header */}
              <th className="border border-gray-200 w-7 print-hide" />
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`border border-gray-200 px-0 py-0 text-xs font-semibold text-gray-600 text-left relative select-none group ${
                    dropTargetColId === col.id && colDragRef.current !== col.id
                      ? "border-l-2 border-l-blue-400"
                      : ""
                  }`}
                  draggable
                  onDragStart={(e) => handleColDragStart(e, col.id)}
                  onDragOver={(e) => handleColDragOver(e, col.id)}
                  onDrop={(e) => handleColDrop(e, col.id)}
                  onDragEnd={() => {
                    colDragRef.current = null;
                    colDragFromGripRef.current = false;
                    setDropTargetColId(null);
                  }}
                  onMouseEnter={() => setHoveredColId(col.id)}
                  onMouseLeave={() => setHoveredColId(null)}
                >
                  <div className="flex items-center pr-1.5 pl-0.5 py-1.5">
                    {/* Grip icon */}
                    <span
                      className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 mr-0.5"
                      onMouseDown={() => {
                        colDragFromGripRef.current = true;
                      }}
                      onMouseUp={() => {
                        colDragFromGripRef.current = false;
                      }}
                      title="Drag to reorder column"
                    >
                      <GripVertical className="w-3 h-3" />
                    </span>
                    <input
                      type="text"
                      value={col.label}
                      onChange={(e) =>
                        updateColumnLabel(col.id, e.target.value)
                      }
                      className="flex-1 bg-transparent outline-none font-semibold text-xs text-gray-600 min-w-0"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    {/* Delete column X */}
                    {hoveredColId === col.id && columns.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeColumn(col.id);
                        }}
                        className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-red-500 flex-shrink-0 ml-0.5 transition-colors"
                        title="Remove column"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {/* Resize handle */}
                  <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 transition-colors z-10"
                    onMouseDown={(e) => handleResizeMouseDown(e, col.id)}
                  />
                </th>
              ))}
              <th className="border border-gray-200 w-9 print-hide" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const isAmountCol = (col: Column) =>
                col.label.toLowerCase() === "amount";
              const isDropTarget =
                dropTargetRowId === row.id && rowDragRef.current !== row.id;
              return (
                <tr
                  key={row.id}
                  draggable
                  onDragStart={(e) => handleRowDragStart(e, row.id)}
                  onDragOver={(e) => handleRowDragOver(e, row.id)}
                  onDrop={(e) => handleRowDrop(e, row.id)}
                  onDragEnd={() => {
                    rowDragRef.current = null;
                    rowDragFromGripRef.current = false;
                    setDropTargetRowId(null);
                  }}
                  className={`transition-colors ${
                    isDropTarget ? "border-t-2 border-t-blue-400" : ""
                  } hover:bg-gray-50`}
                >
                  {/* Row grip */}
                  <td className="border border-gray-100 w-7 text-center print-hide">
                    <span
                      className="cursor-grab active:cursor-grabbing text-gray-200 hover:text-gray-400 flex items-center justify-center h-full transition-colors"
                      onMouseDown={() => {
                        rowDragFromGripRef.current = true;
                      }}
                      onMouseUp={() => {
                        rowDragFromGripRef.current = false;
                      }}
                      title="Drag to reorder row"
                    >
                      <GripVertical className="w-3 h-3" />
                    </span>
                  </td>

                  {columns.map((col, colIdx) => {
                    const isAmt = isAmountCol(col);
                    const cellValue = isAmt
                      ? computeAmount(row, columns)
                      : (row.cells[col.id] ?? "");
                    return (
                      <td
                        key={col.id}
                        className="border border-gray-100 px-0 py-0"
                      >
                        <input
                          type="text"
                          value={isAmt ? formatNumber(cellValue) : cellValue}
                          onChange={(e) =>
                            handleCellChange(row.id, col.id, e.target.value)
                          }
                          onKeyDown={(e) =>
                            handleCellKeyDown(e, row.id, rowIdx, colIdx)
                          }
                          readOnly={isAmt}
                          data-rowidx={rowIdx}
                          className={`w-full px-2.5 py-2 text-sm bg-transparent outline-none border-0 focus:bg-blue-50 transition-colors ${
                            isAmt
                              ? "text-right cursor-default text-gray-700 font-medium"
                              : "text-gray-800"
                          }`}
                          placeholder="—"
                        />
                      </td>
                    );
                  })}

                  {/* Delete row */}
                  <td className="border border-gray-100 w-9 text-center print-hide">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="w-6 h-6 text-gray-400 hover:text-red-500 flex items-center justify-center mx-auto transition-colors rounded hover:bg-red-50"
                      title="Remove row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        data-ocid="invoice.add_row_button"
        className="mt-2 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors border border-blue-200 hover:border-blue-400 rounded px-3 py-1.5"
      >
        <Plus className="w-3 h-3" /> Add Row
      </button>
    </div>
  );
}
