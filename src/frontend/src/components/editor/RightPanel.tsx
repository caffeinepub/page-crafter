import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronsDown,
  ChevronsUp,
  Eye,
  EyeOff,
  Italic,
  Lock,
  Minus,
  MoveDown,
  MoveUp,
  Plus,
  Underline,
  Unlock,
} from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import type { CanvasElement, DocumentSettings } from "../../types/editor";
import LayerPanel from "./LayerPanel";

const FONTS = [
  "Inter",
  "Roboto",
  "Arial",
  "Georgia",
  "Playfair Display",
  "Lato",
  "Noto Sans Telugu",
];
const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96,
];

function ST({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
      {children}
    </p>
  );
}
function FL({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-0.5">
      {children}
    </Label>
  );
}
function ColorIn({
  value,
  onChange,
  label,
  ocid,
}: {
  value?: string;
  onChange: (v: string) => void;
  label: string;
  ocid?: string;
}) {
  return (
    <div>
      <FL>{label}</FL>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          className="w-7 h-7 rounded cursor-pointer border border-border p-0.5"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          data-ocid={ocid}
        />
        <Input
          className="flex-1 h-7 text-xs px-2 font-mono"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function TextProps({ el }: { el: CanvasElement }) {
  const u = (v: Partial<CanvasElement>) =>
    useEditorStore.getState().updateElement(el.id, v);
  return (
    <div className="space-y-3">
      <ST>Typography</ST>
      <div>
        <FL>Font Family</FL>
        <Select
          value={el.fontFamily || "Inter"}
          onValueChange={(v) => u({ fontFamily: v })}
        >
          <SelectTrigger
            className="h-7 text-xs"
            data-ocid="right_panel.font_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <FL>Font Size</FL>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            className="w-16 h-7 text-xs px-2"
            value={el.fontSize || 14}
            onChange={(e) => u({ fontSize: Number(e.target.value) })}
            data-ocid="right_panel.font_size_input"
          />
          <Select
            value={String(el.fontSize || 14)}
            onValueChange={(v) => u({ fontSize: Number(v) })}
          >
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <FL>Style</FL>
        <div className="flex gap-1">
          <Toggle
            size="sm"
            pressed={el.fontWeight === "700"}
            onPressedChange={(p) => u({ fontWeight: p ? "700" : "400" })}
            className="h-7 w-7 p-0"
          >
            <Bold className="w-3.5 h-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={el.fontStyle === "italic"}
            onPressedChange={(p) => u({ fontStyle: p ? "italic" : "normal" })}
            className="h-7 w-7 p-0"
          >
            <Italic className="w-3.5 h-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={el.textDecoration === "underline"}
            onPressedChange={(p) =>
              u({ textDecoration: p ? "underline" : "none" })
            }
            className="h-7 w-7 p-0"
          >
            <Underline className="w-3.5 h-3.5" />
          </Toggle>
        </div>
      </div>
      <div>
        <FL>Alignment</FL>
        <div className="flex gap-0.5">
          {(["left", "center", "right", "justify"] as const).map((a, idx) => (
            <Toggle
              key={a}
              size="sm"
              pressed={el.textAlign === a}
              onPressedChange={() => u({ textAlign: a })}
              className="h-7 w-7 p-0"
            >
              {idx === 0 ? (
                <AlignLeft className="w-3.5 h-3.5" />
              ) : idx === 1 ? (
                <AlignCenter className="w-3.5 h-3.5" />
              ) : idx === 2 ? (
                <AlignRight className="w-3.5 h-3.5" />
              ) : (
                <AlignJustify className="w-3.5 h-3.5" />
              )}
            </Toggle>
          ))}
        </div>
      </div>
      <ColorIn
        label="Text Color"
        value={el.color}
        onChange={(v) => u({ color: v })}
        ocid="right_panel.text_color_input"
      />
      <div>
        <FL>Line Height: {(el.lineHeight || 1.4).toFixed(1)}</FL>
        <Slider
          min={0.8}
          max={3}
          step={0.1}
          value={[el.lineHeight || 1.4]}
          onValueChange={([v]) => u({ lineHeight: v })}
          className="mt-1"
        />
      </div>
      <div>
        <FL>Letter Spacing: {el.letterSpacing || 0}px</FL>
        <Slider
          min={-5}
          max={20}
          step={0.5}
          value={[el.letterSpacing || 0]}
          onValueChange={([v]) => u({ letterSpacing: v })}
          className="mt-1"
        />
      </div>
    </div>
  );
}

function ShapeProps({ el }: { el: CanvasElement }) {
  const u = (v: Partial<CanvasElement>) =>
    useEditorStore.getState().updateElement(el.id, v);
  return (
    <div className="space-y-3">
      <ST>Shape Style</ST>
      {el.shapeType !== "line" && el.shapeType !== "arrow" && (
        <ColorIn
          label="Fill Color"
          value={el.fill}
          onChange={(v) => u({ fill: v })}
          ocid="right_panel.fill_color_input"
        />
      )}
      <ColorIn
        label="Stroke Color"
        value={el.stroke}
        onChange={(v) => u({ stroke: v })}
      />
      <div>
        <FL>Stroke Width</FL>
        <Input
          type="number"
          min={0}
          max={20}
          className="h-7 text-xs w-20"
          value={el.strokeWidth || 0}
          onChange={(e) => u({ strokeWidth: Number(e.target.value) })}
        />
      </div>
      {el.shapeType === "rectangle" && (
        <div>
          <FL>Border Radius</FL>
          <Slider
            min={0}
            max={60}
            step={1}
            value={[el.borderRadius || 0]}
            onValueChange={([v]) => u({ borderRadius: v })}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}

function ImageProps({ el }: { el: CanvasElement }) {
  const u = (v: Partial<CanvasElement>) =>
    useEditorStore.getState().updateElement(el.id, v);
  return (
    <div className="space-y-3">
      <ST>Image</ST>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FL>Width</FL>
          <Input
            type="number"
            className="h-7 text-xs"
            value={Math.round(el.width)}
            onChange={(e) => u({ width: Number(e.target.value) })}
          />
        </div>
        <div>
          <FL>Height</FL>
          <Input
            type="number"
            className="h-7 text-xs"
            value={Math.round(el.height)}
            onChange={(e) => u({ height: Number(e.target.value) })}
          />
        </div>
      </div>
      <div>
        <FL>Object Fit</FL>
        <Select
          value={el.objectFit || "contain"}
          onValueChange={(v) =>
            u({ objectFit: v as "contain" | "cover" | "fill" })
          }
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contain">Contain</SelectItem>
            <SelectItem value="cover">Cover</SelectItem>
            <SelectItem value="fill">Fill</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function TableProps({ el }: { el: CanvasElement }) {
  const u = (v: Partial<CanvasElement>) =>
    useEditorStore.getState().updateElement(el.id, v);

  const headers = el.tableHeaders ?? ["Column 1", "Column 2", "Column 3"];
  const data = el.tableData ?? [["Cell", "Cell", "Cell"]];

  const addRow = () => {
    const newRow = headers.map(() => "");
    u({ tableData: [...data, newRow] });
  };
  const removeRow = () => {
    if (data.length <= 1) return;
    u({ tableData: data.slice(0, -1) });
  };
  const addCol = () => {
    const nh = [...headers, `Column ${headers.length + 1}`];
    const nd = data.map((r) => [...r, ""]);
    // Normalize widths
    const total = 100;
    const newColPct = total / nh.length;
    const normalized = nh.map(() => newColPct);
    u({ tableHeaders: nh, tableData: nd, tableColWidths: normalized });
  };
  const removeCol = () => {
    if (headers.length <= 1) return;
    const nh = headers.slice(0, -1);
    const nd = data.map((r) => r.slice(0, -1));
    const normalized = nh.map(() => 100 / nh.length);
    u({ tableHeaders: nh, tableData: nd, tableColWidths: normalized });
  };

  return (
    <div className="space-y-3">
      <ST>Table Structure</ST>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FL>Rows: {data.length}</FL>
          <div className="flex gap-1 mt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 text-xs gap-1"
              onClick={addRow}
            >
              <Plus className="w-3 h-3" /> Row
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 text-xs gap-1"
              onClick={removeRow}
              disabled={data.length <= 1}
            >
              <Minus className="w-3 h-3" /> Row
            </Button>
          </div>
        </div>
        <div>
          <FL>Cols: {headers.length}</FL>
          <div className="flex gap-1 mt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 text-xs gap-1"
              onClick={addCol}
            >
              <Plus className="w-3 h-3" /> Col
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 text-xs gap-1"
              onClick={removeCol}
              disabled={headers.length <= 1}
            >
              <Minus className="w-3 h-3" /> Col
            </Button>
          </div>
        </div>
      </div>
      <Separator />
      <ST>Table Style</ST>
      <ColorIn
        label="Header Color"
        value={el.tableHeaderBg}
        onChange={(v) => u({ tableHeaderBg: v })}
      />
      <ColorIn
        label="Border Color"
        value={el.tableBorderColor}
        onChange={(v) => u({ tableBorderColor: v })}
      />
      <div>
        <FL>Cell Padding: {el.tableCellPadding || 8}px</FL>
        <Slider
          min={2}
          max={24}
          step={1}
          value={[el.tableCellPadding || 8]}
          onValueChange={([v]) => u({ tableCellPadding: v })}
          className="mt-1"
        />
      </div>
    </div>
  );
}

function DocProps() {
  const ds = useEditorStore((s) => s.documentSettings);
  const upd = useEditorStore((s) => s.updateDocumentSettings);
  return (
    <div className="space-y-3">
      <ST>Document</ST>
      <div>
        <FL>Page Size</FL>
        <Select
          value={ds.pageSize}
          onValueChange={(v) =>
            upd({ pageSize: v as DocumentSettings["pageSize"] })
          }
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A4">A4</SelectItem>
            <SelectItem value="Letter">Letter</SelectItem>
            <SelectItem value="A5">A5</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <FL>Orientation</FL>
        <Select
          value={ds.orientation}
          onValueChange={(v) =>
            upd({ orientation: v as DocumentSettings["orientation"] })
          }
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">Portrait</SelectItem>
            <SelectItem value="landscape">Landscape</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <FL>Margins (px)</FL>
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <div key={side}>
              <span className="text-[9px] text-muted-foreground capitalize">
                {side}
              </span>
              <Input
                type="number"
                className="h-6 text-xs px-1.5"
                value={ds.margins[side]}
                onChange={(e) =>
                  upd({
                    margins: { ...ds.margins, [side]: Number(e.target.value) },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RightPanel() {
  const pages = useEditorStore((s) => s.pages);
  const currentPageIndex = useEditorStore((s) => s.currentPageIndex);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const updateElement = useEditorStore((s) => s.updateElement);
  const bringForward = useEditorStore((s) => s.bringForward);
  const sendBackward = useEditorStore((s) => s.sendBackward);
  const bringToFront = useEditorStore((s) => s.bringToFront);
  const sendToBack = useEditorStore((s) => s.sendToBack);
  const toggleLock = useEditorStore((s) => s.toggleLock);
  const toggleVisibility = useEditorStore((s) => s.toggleVisibility);

  const el = pages[currentPageIndex]?.elements.find(
    (e) => e.id === selectedIds[0],
  );
  const u = (v: Partial<CanvasElement>) => {
    if (el) updateElement(el.id, v);
  };

  return (
    <aside className="w-72 bg-white border-l border-border flex flex-col h-full shrink-0 no-print">
      <ScrollArea className="flex-1 panel-scroll">
        <div className="p-4 space-y-4">
          {!el ? (
            <DocProps />
          ) : (
            <>
              <div>
                <FL>Name</FL>
                <Input
                  className="h-7 text-xs"
                  value={el.name || ""}
                  onChange={(e) => u({ name: e.target.value })}
                  placeholder={el.type}
                />
              </div>
              <div className="space-y-2">
                <ST>Position & Size</ST>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FL>X</FL>
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={Math.round(el.x)}
                      onChange={(e) => u({ x: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <FL>Y</FL>
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={Math.round(el.y)}
                      onChange={(e) => u({ y: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <FL>W</FL>
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={Math.round(el.width)}
                      onChange={(e) => u({ width: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <FL>H</FL>
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={Math.round(el.height)}
                      onChange={(e) => u({ height: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <FL>Rotation</FL>
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={el.rotation}
                      onChange={(e) => u({ rotation: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <FL>Opacity: {Math.round(el.opacity * 100)}%</FL>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[el.opacity]}
                      onValueChange={([v]) => u({ opacity: v })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              <Separator />
              {el.type === "text" && <TextProps el={el} />}
              {el.type === "shape" && <ShapeProps el={el} />}
              {el.type === "image" && <ImageProps el={el} />}
              {el.type === "table" && !el.isInvoiceTable && (
                <TableProps el={el} />
              )}
              {el.type === "table" && el.isInvoiceTable && (
                <div className="space-y-3">
                  <ST>Invoice Table</ST>
                  <p className="text-[10px] text-muted-foreground">
                    Edit cells directly on the canvas by clicking them. Line
                    items are shared with the Invoice panel.
                  </p>
                  <ColorIn
                    label="Header Color"
                    value={el.tableHeaderBg}
                    onChange={(v) => updateElement(el.id, { tableHeaderBg: v })}
                  />
                  <ColorIn
                    label="Border Color"
                    value={el.tableBorderColor}
                    onChange={(v) =>
                      updateElement(el.id, { tableBorderColor: v })
                    }
                  />
                </div>
              )}
              <Separator />
              <div>
                <ST>Layer Order</ST>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => bringToFront(el.id)}
                  >
                    <ChevronsUp className="w-3 h-3" /> To Front
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => sendToBack(el.id)}
                  >
                    <ChevronsDown className="w-3 h-3" /> To Back
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => bringForward(el.id)}
                  >
                    <MoveUp className="w-3 h-3" /> Forward
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => sendBackward(el.id)}
                  >
                    <MoveDown className="w-3 h-3" /> Backward
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button
                  data-ocid="right_panel.lock_toggle"
                  variant={el.locked ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-7 text-xs gap-1"
                  onClick={() => toggleLock(el.id)}
                >
                  {el.locked ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <Unlock className="w-3 h-3" />
                  )}
                  {el.locked ? "Locked" : "Lock"}
                </Button>
                <Button
                  variant={el.visible ? "outline" : "default"}
                  size="sm"
                  className="flex-1 h-7 text-xs gap-1"
                  onClick={() => toggleVisibility(el.id)}
                >
                  {el.visible ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                  {el.visible ? "Visible" : "Hidden"}
                </Button>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
      <div className="border-t border-border">
        <LayerPanel />
      </div>
    </aside>
  );
}
