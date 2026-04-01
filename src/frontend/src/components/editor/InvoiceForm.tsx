import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Image, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { useEditorStore } from "../../store/editorStore";

export default function InvoiceForm() {
  const invoiceData = useEditorStore((s) => s.invoiceData);
  const update = useEditorStore((s) => s.updateInvoiceData);
  const updateItem = useEditorStore((s) => s.updateInvoiceLineItem);
  const addItem = useEditorStore((s) => s.addInvoiceLineItem);
  const removeItem = useEditorStore((s) => s.removeInvoiceLineItem);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      update({ companyLogo: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const fc = "h-7 text-xs px-2";
  const lc =
    "text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-0.5";

  return (
    <div className="px-3 space-y-3 text-xs">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
          Company
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {invoiceData.companyLogo && (
              <img
                src={invoiceData.companyLogo}
                alt="logo"
                className="w-10 h-10 object-contain border rounded"
              />
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => logoInputRef.current?.click()}
            >
              <Image className="w-3 h-3" />{" "}
              {invoiceData.companyLogo ? "Change Logo" : "Upload Logo"}
            </Button>
          </div>
          <div>
            <Label className={lc}>Company Name</Label>
            <Input
              data-ocid="left_panel.company_name_input"
              className={fc}
              value={invoiceData.companyName}
              onChange={(e) => update({ companyName: e.target.value })}
            />
          </div>
          <div>
            <Label className={lc}>Address</Label>
            <Textarea
              className="text-xs px-2 py-1.5 min-h-[60px] resize-none"
              value={invoiceData.companyAddress}
              onChange={(e) => update({ companyAddress: e.target.value })}
            />
          </div>
          <div>
            <Label className={lc}>GSTIN</Label>
            <Input
              className={fc}
              value={invoiceData.companyGSTIN}
              onChange={(e) => update({ companyGSTIN: e.target.value })}
            />
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
          Customer
        </p>
        <div className="space-y-2">
          <div>
            <Label className={lc}>Name</Label>
            <Input
              className={fc}
              value={invoiceData.customerName}
              onChange={(e) => update({ customerName: e.target.value })}
            />
          </div>
          <div>
            <Label className={lc}>Address</Label>
            <Textarea
              className="text-xs px-2 py-1.5 min-h-[50px] resize-none"
              value={invoiceData.customerAddress}
              onChange={(e) => update({ customerAddress: e.target.value })}
            />
          </div>
          <div>
            <Label className={lc}>GSTIN</Label>
            <Input
              className={fc}
              value={invoiceData.customerGSTIN}
              onChange={(e) => update({ customerGSTIN: e.target.value })}
            />
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
          Invoice Details
        </p>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className={lc}>Invoice #</Label>
              <Input
                data-ocid="left_panel.invoice_number_input"
                className={fc}
                value={invoiceData.invoiceNumber}
                onChange={(e) => update({ invoiceNumber: e.target.value })}
              />
            </div>
            <div>
              <Label className={lc}>Currency</Label>
              <Input
                className={fc}
                value={invoiceData.currency}
                onChange={(e) => update({ currency: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className={lc}>Date</Label>
              <Input
                type="date"
                className={fc}
                value={invoiceData.invoiceDate}
                onChange={(e) => update({ invoiceDate: e.target.value })}
              />
            </div>
            <div>
              <Label className={lc}>Due Date</Label>
              <Input
                type="date"
                className={fc}
                value={invoiceData.dueDate}
                onChange={(e) => update({ dueDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
          Line Items
        </p>
        <div className="space-y-1.5">
          {invoiceData.lineItems.map((item, i) => (
            <div
              key={`${item.description}-${i}`}
              data-ocid={`left_panel.line_item.${i + 1}`}
              className="bg-muted rounded-md p-2 space-y-1.5"
            >
              <div className="flex items-center gap-1">
                <Input
                  className="flex-1 h-6 text-xs px-1.5"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(i, { description: e.target.value })
                  }
                />
                <button
                  type="button"
                  data-ocid={`left_panel.remove_item_button.${i + 1}`}
                  onClick={() => removeItem(i)}
                  className="p-0.5 text-destructive hover:bg-destructive/10 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <span className="text-[9px] text-muted-foreground">Qty</span>
                  <Input
                    type="number"
                    className="h-6 text-xs px-1.5"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(i, { qty: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground">
                    Unit Price
                  </span>
                  <Input
                    type="number"
                    className="h-6 text-xs px-1.5"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(i, { unitPrice: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground">
                    Tax %
                  </span>
                  <Input
                    type="number"
                    className="h-6 text-xs px-1.5"
                    value={item.taxPercent}
                    onChange={(e) =>
                      updateItem(i, { taxPercent: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Amount: {invoiceData.currency}
                {item.amount.toLocaleString()}
              </div>
            </div>
          ))}
          <Button
            data-ocid="left_panel.add_line_item_button"
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs gap-1"
            onClick={addItem}
          >
            <Plus className="w-3 h-3" /> Add Item
          </Button>
        </div>
        <div className="mt-2 space-y-0.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">
              {invoiceData.currency}
              {invoiceData.subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">
              {invoiceData.currency}
              {invoiceData.taxTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Grand Total</span>
            <span>
              {invoiceData.currency}
              {invoiceData.grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <Label className={lc}>Notes / Terms</Label>
        <Textarea
          className="text-xs px-2 py-1.5 min-h-[60px] resize-none"
          value={invoiceData.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </div>
      <div>
        <Label className={lc}>Bank Details</Label>
        <Textarea
          className="text-xs px-2 py-1.5 min-h-[50px] resize-none"
          value={invoiceData.bankDetails}
          onChange={(e) => update({ bankDetails: e.target.value })}
        />
      </div>
    </div>
  );
}
