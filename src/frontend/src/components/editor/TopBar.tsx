import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "@tanstack/react-router";
import {
  ChevronLeft,
  Download,
  FileImage,
  Grid,
  Loader2,
  Printer,
  Redo2,
  Save,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useEditorStore } from "../../store/editorStore";

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

interface Props {
  onSave(): void;
  isSaving: boolean;
}

export default function TopBar({ onSave, isSaving }: Props) {
  const router = useRouter();
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const toggleSnapToGrid = useEditorStore((s) => s.toggleSnapToGrid);
  const toggleShowGrid = useEditorStore((s) => s.toggleShowGrid);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);
  const designName = useEditorStore((s) => s.designName);
  const setDesignName = useEditorStore((s) => s.setDesignName);
  const pages = useEditorStore((s) => s.pages);
  const currentPageIndex = useEditorStore((s) => s.currentPageIndex);
  const isDirty = useEditorStore((s) => s.isDirty);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(designName);

  const handleExportPDF = async () => {
    const pagesEls = document.querySelectorAll(".a4-canvas");
    if (!pagesEls.length) {
      toast.error("No canvas found");
      return;
    }
    if (typeof html2canvas === "undefined" || typeof jspdf === "undefined") {
      toast.error("Export libraries loading, try again in a moment");
      return;
    }
    toast.loading("Generating PDF...", { id: "pdf-export" });
    try {
      const pdf = new jspdf.jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });
      for (let i = 0; i < pagesEls.length; i++) {
        const cvs = await html2canvas(pagesEls[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const imgData = cvs.toDataURL("image/jpeg", 1.0);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }
      pdf.save(`${designName || "design"}.pdf`);
      toast.success("PDF exported!", { id: "pdf-export" });
    } catch {
      toast.error("PDF export failed", { id: "pdf-export" });
    }
  };

  const handleExportImage = async (format: "png" | "jpg") => {
    const el = document.querySelector(".a4-canvas") as HTMLElement;
    if (!el) {
      toast.error("No canvas found");
      return;
    }
    if (typeof html2canvas === "undefined") {
      toast.error("Export library loading, try again");
      return;
    }
    toast.loading(`Exporting ${format.toUpperCase()}...`, { id: "img-export" });
    try {
      const cvs = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const url = cvs.toDataURL(
        format === "png" ? "image/png" : "image/jpeg",
        1.0,
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${designName || "design"}.${format}`;
      a.click();
      toast.success(`${format.toUpperCase()} exported!`, { id: "img-export" });
    } catch {
      toast.error("Image export failed", { id: "img-export" });
    }
  };

  const handlePrint = () => {
    const el = document.querySelector(".a4-canvas");
    if (el) el.id = "print-area";
    window.print();
  };

  return (
    <TooltipProvider delayDuration={400}>
      <header className="h-12 bg-white border-b border-border flex items-center px-3 gap-1 no-print shrink-0 z-20">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-ocid="editor.back_button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.navigate({ to: "/" })}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to Dashboard</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {editingName ? (
          <input
            className="text-sm font-medium bg-muted px-2 py-1 rounded border border-primary outline-none min-w-32 max-w-56"
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={() => {
              setDesignName(nameVal);
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setDesignName(nameVal);
                setEditingName(false);
              }
            }}
            data-ocid="editor.design_name_input"
          />
        ) : (
          <button
            type="button"
            className="text-sm font-medium px-2 py-1 rounded hover:bg-muted transition max-w-56 truncate flex items-center gap-1"
            onClick={() => {
              setNameVal(designName);
              setEditingName(true);
            }}
            data-ocid="editor.design_name_button"
          >
            {designName}
            {isDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block ml-1" />
            )}
          </button>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-ocid="editor.undo_button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={undo}
                disabled={!past.length}
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-ocid="editor.redo_button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={redo}
                disabled={!future.length}
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-ocid="editor.zoom_out_button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom(zoom - 0.25)}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 px-2 text-xs font-medium w-14"
                data-ocid="editor.zoom_select"
              >
                {Math.round(zoom * 100)}%
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {ZOOM_LEVELS.map((z) => (
                <DropdownMenuItem
                  key={z}
                  onClick={() => setZoom(z)}
                  className={zoom === z ? "bg-accent" : ""}
                >
                  {Math.round(z * 100)}%
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-ocid="editor.zoom_in_button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom(zoom + 0.25)}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-ocid="editor.snap_toggle"
              variant={snapToGrid ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                toggleSnapToGrid();
                toggleShowGrid();
              }}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Snap to Grid</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <span className="text-xs text-muted-foreground font-medium px-2">
          Page {currentPageIndex + 1} / {pages.length}
        </span>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Button
          data-ocid="editor.save_button"
          size="sm"
          className="h-8 gap-1.5"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Save
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-ocid="editor.export_button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileImage className="w-4 h-4 mr-2" /> Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportImage("png")}>
              <FileImage className="w-4 h-4 mr-2" /> Export as PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportImage("jpg")}>
              <FileImage className="w-4 h-4 mr-2" /> Export as JPG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    </TooltipProvider>
  );
}
