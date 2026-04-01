import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Image,
  Lock,
  Square,
  Table2,
  Type,
  Unlock,
} from "lucide-react";
import { useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import type { CanvasElement } from "../../types/editor";

const typeIcon: Record<string, React.ReactNode> = {
  text: <Type className="w-3 h-3" />,
  image: <Image className="w-3 h-3" />,
  shape: <Square className="w-3 h-3" />,
  table: <Table2 className="w-3 h-3" />,
};

export default function LayerPanel() {
  const [expanded, setExpanded] = useState(false);
  const pages = useEditorStore((s) => s.pages);
  const currentPageIndex = useEditorStore((s) => s.currentPageIndex);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectElement = useEditorStore((s) => s.selectElement);
  const toggleLock = useEditorStore((s) => s.toggleLock);
  const toggleVisibility = useEditorStore((s) => s.toggleVisibility);

  const elements = [...(pages[currentPageIndex]?.elements || [])].sort(
    (a, b) => b.zIndex - a.zIndex,
  );

  return (
    <div className="no-print">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        onClick={() => setExpanded((v) => !v)}
        data-ocid="right_panel.layers_toggle"
      >
        <span className="flex items-center gap-1.5">
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          Layers ({elements.length})
        </span>
      </button>
      {expanded && (
        <div className="max-h-48 overflow-y-auto panel-scroll border-t border-border">
          {elements.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              No elements on this page
            </p>
          ) : (
            elements.map((el: CanvasElement, i: number) => (
              <div
                key={el.id}
                data-ocid={`right_panel.layer_item.${i + 1}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-muted transition-colors text-xs ${selectedIds.includes(el.id) ? "bg-accent" : ""}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") selectElement(el.id);
                }}
                onClick={() => selectElement(el.id)}
              >
                <span className="text-muted-foreground shrink-0">
                  {typeIcon[el.type]}
                </span>
                <span className="flex-1 truncate text-foreground">
                  {el.name || el.type}
                </span>
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-muted-foreground/10 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(el.id);
                  }}
                >
                  {el.visible ? (
                    <Eye className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-muted-foreground/10 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(el.id);
                  }}
                >
                  {el.locked ? (
                    <Lock className="w-3 h-3 text-primary" />
                  ) : (
                    <Unlock className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
