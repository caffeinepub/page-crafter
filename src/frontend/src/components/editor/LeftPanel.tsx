import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowRight,
  Circle,
  Copy,
  FileText,
  Image,
  Minus,
  Plus,
  Square,
  Table2,
  Trash2,
  Triangle,
  Type,
} from "lucide-react";
import { useRef } from "react";
import { useEditorStore } from "../../store/editorStore";
import { type CanvasElement, PAGE_WIDTH } from "../../types/editor";
import InvoiceForm from "./InvoiceForm";

function addDefaultText(
  type: "heading" | "subheading" | "body" | "text",
): Omit<CanvasElement, "id" | "zIndex"> {
  const configs = {
    heading: {
      content: "Add a Heading",
      fontSize: 32,
      fontWeight: "700",
      height: 50,
    },
    subheading: {
      content: "Add a Subheading",
      fontSize: 22,
      fontWeight: "600",
      height: 38,
    },
    body: {
      content: "Add body text here. Click to edit.",
      fontSize: 14,
      fontWeight: "400",
      height: 60,
    },
    text: { content: "Text Box", fontSize: 14, fontWeight: "400", height: 40 },
  };
  const c = configs[type];
  return {
    type: "text",
    x: 80,
    y: 80,
    width: 300,
    height: c.height,
    rotation: 0,
    locked: false,
    visible: true,
    opacity: 1,
    content: c.content,
    fontFamily: "Inter",
    fontSize: c.fontSize,
    fontWeight: c.fontWeight,
    color: "#111827",
    textAlign: "left",
    lineHeight: 1.4,
    letterSpacing: 0,
    name: type,
  };
}

export default function LeftPanel() {
  const addElement = useEditorStore((s) => s.addElement);
  const addPage = useEditorStore((s) => s.addPage);
  const removePage = useEditorStore((s) => s.removePage);
  const duplicatePage = useEditorStore((s) => s.duplicatePage);
  const pages = useEditorStore((s) => s.pages);
  const currentPageIndex = useEditorStore((s) => s.currentPageIndex);
  const setCurrentPage = useEditorStore((s) => s.setCurrentPage);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleAddShape = (
    shapeType: "rectangle" | "circle" | "triangle" | "line" | "arrow",
  ) => {
    const isLine = shapeType === "line" || shapeType === "arrow";
    addElement({
      type: "shape",
      x: 100,
      y: 100,
      width: isLine ? 200 : 120,
      height: isLine ? 20 : shapeType === "circle" ? 120 : 80,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 1,
      shapeType,
      fill: isLine ? "none" : "#1E6FE6",
      stroke: isLine ? "#1E6FE6" : "none",
      strokeWidth: 2,
      borderRadius: 0,
      name: shapeType,
    });
  };

  const handleAddTable = () => {
    addElement({
      type: "table",
      x: 40,
      y: 100,
      width: PAGE_WIDTH - 80,
      height: 200,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 1,
      tableHeaders: ["Description", "Qty", "Unit Price", "Amount"],
      tableData: [
        ["Product", "1", "0.00", "0.00"],
        ["Product", "1", "0.00", "0.00"],
      ],
      tableBorderColor: "#E5E7EB",
      tableHeaderBg: "#1E6FE6",
      tableCellPadding: 10,
      name: "Simple Table",
    });
  };

  const handleAddInvoiceTable = () => {
    addElement({
      type: "table",
      x: 40,
      y: 100,
      width: PAGE_WIDTH - 80,
      height: 380,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 1,
      isInvoiceTable: true,
      tableBorderColor: "#E5E7EB",
      tableHeaderBg: "#1E6FE6",
      tableCellPadding: 10,
      name: "Invoice Table",
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      addElement({
        type: "image",
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        rotation: 0,
        locked: false,
        visible: true,
        opacity: 1,
        src: ev.target?.result as string,
        objectFit: "contain",
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const shapes = [
    {
      label: "Rect",
      icon: <Square className="w-4 h-4" />,
      type: "rectangle" as const,
      ocid: "editor.add_rect_button",
    },
    {
      label: "Circle",
      icon: <Circle className="w-4 h-4" />,
      type: "circle" as const,
      ocid: "editor.add_circle_button",
    },
    {
      label: "Triangle",
      icon: <Triangle className="w-4 h-4" />,
      type: "triangle" as const,
      ocid: "editor.add_triangle_button",
    },
    {
      label: "Line",
      icon: <Minus className="w-4 h-4" />,
      type: "line" as const,
      ocid: "editor.add_line_button",
    },
    {
      label: "Arrow",
      icon: <ArrowRight className="w-4 h-4" />,
      type: "arrow" as const,
      ocid: "editor.add_arrow_button",
    },
  ];

  return (
    <TooltipProvider delayDuration={500}>
      <aside className="w-64 bg-white border-r border-border flex flex-col h-full shrink-0 no-print">
        <ScrollArea className="flex-1 panel-scroll">
          <Accordion
            type="multiple"
            defaultValue={["text", "elements", "tables", "pages"]}
            className="w-full"
          >
            <AccordionItem value="text" className="border-b">
              <AccordionTrigger className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
                <span className="flex items-center gap-2">
                  <Type className="w-3.5 h-3.5" /> Text
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 px-3">
                <div className="grid gap-1.5">
                  <Button
                    data-ocid="editor.add_heading_button"
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 h-9"
                    onClick={() => addElement(addDefaultText("heading"))}
                  >
                    <span className="font-bold text-base leading-none">H</span>
                    <span className="text-xs">Add Heading</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 h-9"
                    onClick={() => addElement(addDefaultText("subheading"))}
                  >
                    <span className="font-semibold text-sm leading-none">
                      H2
                    </span>
                    <span className="text-xs">Subheading</span>
                  </Button>
                  <Button
                    data-ocid="editor.add_text_button"
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 h-9"
                    onClick={() => addElement(addDefaultText("body"))}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span className="text-xs">Body Text</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 h-9"
                    onClick={() => addElement(addDefaultText("text"))}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span className="text-xs">Text Box</span>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="elements" className="border-b">
              <AccordionTrigger className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
                <span className="flex items-center gap-2">
                  <Square className="w-3.5 h-3.5" /> Elements
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 px-3">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  data-ocid="editor.add_image_button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 h-9 mb-2"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span className="text-xs">Upload Image</span>
                </Button>
                <div className="grid grid-cols-3 gap-1.5">
                  {shapes.map((s) => (
                    <Tooltip key={s.type}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          data-ocid={s.ocid}
                          className="flex flex-col items-center gap-1 p-2 border border-border rounded-md hover:border-primary hover:bg-accent transition-all text-muted-foreground hover:text-primary"
                          onClick={() => handleAddShape(s.type)}
                        >
                          {s.icon}
                          <span className="text-[10px] font-medium">
                            {s.label}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Add {s.label}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tables" className="border-b">
              <AccordionTrigger className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
                <span className="flex items-center gap-2">
                  <Table2 className="w-3.5 h-3.5" /> Tables
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 px-3">
                <div className="grid gap-1.5">
                  <Button
                    data-ocid="editor.add_invoice_table_button"
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 h-9"
                    onClick={handleAddInvoiceTable}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-xs">Invoice Table</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 h-9"
                    onClick={handleAddTable}
                  >
                    <Table2 className="w-3.5 h-3.5" />
                    <span className="text-xs">Simple Table</span>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="invoice" className="border-b">
              <AccordionTrigger className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Invoice Data
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <InvoiceForm />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pages">
              <AccordionTrigger className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Pages ({pages.length})
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 px-3">
                <div className="space-y-1.5 mb-2">
                  {pages.map((page, i) => (
                    <div
                      key={page.id}
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all ${i === currentPageIndex ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setCurrentPage(i);
                      }}
                      onClick={() => setCurrentPage(i)}
                      data-ocid={`editor.page_item.${i + 1}`}
                    >
                      <div className="w-10 h-14 bg-white border border-border rounded flex items-center justify-center text-xs text-muted-foreground shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-xs font-medium flex-1 truncate">
                        Page {i + 1}
                      </span>
                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-muted transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicatePage(i);
                          }}
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </button>
                        {pages.length > 1 && (
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-destructive/10 transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePage(i);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  data-ocid="editor.add_page_button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs h-8"
                  onClick={addPage}
                >
                  <Plus className="w-3 h-3" /> Add Page
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}
