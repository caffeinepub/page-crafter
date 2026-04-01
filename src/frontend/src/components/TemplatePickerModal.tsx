import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileSignature, FileText, Mail, Receipt } from "lucide-react";
import { BUILT_IN_TEMPLATES } from "../data/templates";

const categoryIcons: Record<string, React.ReactNode> = {
  invoice: <FileText className="w-6 h-6" />,
  quotation: <FileSignature className="w-6 h-6" />,
  letterhead: <Mail className="w-6 h-6" />,
  receipt: <Receipt className="w-6 h-6" />,
};

interface Props {
  open: boolean;
  onClose(): void;
  onSelect(templateId: string): void;
}

export default function TemplatePickerModal({
  open,
  onClose,
  onSelect,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl" data-ocid="template_picker.dialog">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2 mb-2">
          Select a template or close to create a blank document.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
          {BUILT_IN_TEMPLATES.map((tpl, i) => (
            <button
              type="button"
              key={tpl.id}
              data-ocid={`template_picker.template_item.${i + 1}`}
              onClick={() => onSelect(tpl.id)}
              className="flex flex-col items-center text-center bg-muted border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition-all group"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 text-white shadow"
                style={{ background: tpl.accentColor }}
              >
                {categoryIcons[tpl.category]}
              </div>
              <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors mb-1">
                {tpl.name}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {tpl.description}
              </div>
              <Badge variant="outline" className="capitalize text-xs">
                {tpl.category}
              </Badge>
            </button>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            data-ocid="template_picker.close_button"
            variant="outline"
            onClick={onClose}
          >
            Start Blank
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
