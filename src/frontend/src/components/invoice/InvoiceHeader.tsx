import { useRef } from "react";

export interface HeaderData {
  companyName: string;
  companyAddress: string;
  companyGSTIN: string;
  companyEmail: string;
  companyPhone: string;
  logoUrl: string | null;
  customerName: string;
  customerAddress: string;
  customerGSTIN: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
}

interface Props {
  data: HeaderData;
  onChange: (updated: HeaderData) => void;
}

function EditableField({
  value,
  onChange,
  placeholder,
  className = "",
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  multiline?: boolean;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={`w-full bg-transparent resize-none border-0 border-b border-transparent focus:border-gray-300 outline-none text-sm text-gray-700 placeholder-gray-300 transition-colors leading-relaxed ${className}`}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent border-0 border-b border-transparent focus:border-gray-300 outline-none text-sm text-gray-700 placeholder-gray-300 transition-colors ${className}`}
    />
  );
}

export default function InvoiceHeader({ data, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof HeaderData) => (v: string) =>
    onChange({ ...data, [key]: v });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      onChange({ ...data, logoUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-8">
      <div className="flex gap-8">
        {/* Left: Company Info */}
        <div className="flex-1">
          <div className="mb-4">
            {data.logoUrl ? (
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="block"
                  title="Click to change logo"
                >
                  <img
                    src={data.logoUrl}
                    alt="Company Logo"
                    className="h-16 w-auto object-contain mb-2 rounded"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, logoUrl: null })}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-lg px-4 py-2 text-xs text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors mb-2"
              >
                + Upload Logo
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
          <EditableField
            value={data.companyName}
            onChange={set("companyName")}
            placeholder="Company Name"
            className="text-xl font-bold text-gray-800 mb-1"
          />
          <EditableField
            value={data.companyAddress}
            onChange={set("companyAddress")}
            placeholder="Company Address"
            multiline
            className="text-gray-600 mb-1"
          />
          <EditableField
            value={data.companyGSTIN}
            onChange={set("companyGSTIN")}
            placeholder="GSTIN"
            className="text-xs text-gray-500 mb-1"
          />
          <EditableField
            value={data.companyEmail}
            onChange={set("companyEmail")}
            placeholder="Email"
            className="text-xs text-gray-500 mb-1"
          />
          <EditableField
            value={data.companyPhone}
            onChange={set("companyPhone")}
            placeholder="Phone"
            className="text-xs text-gray-500"
          />
        </div>

        {/* Right: Invoice details + customer */}
        <div className="w-60">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-right">
            INVOICE
          </h2>
          <div className="space-y-1 text-right mb-6">
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">#</span>
              <input
                type="text"
                value={data.invoiceNumber}
                onChange={(e) => set("invoiceNumber")(e.target.value)}
                placeholder="INV-0001"
                className="text-sm font-semibold text-gray-700 bg-transparent border-0 border-b border-transparent focus:border-gray-300 outline-none text-right w-32"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Date
              </span>
              <input
                type="date"
                value={data.invoiceDate}
                onChange={(e) => set("invoiceDate")(e.target.value)}
                className="text-sm text-gray-700 bg-transparent border-0 border-b border-transparent focus:border-gray-300 outline-none text-right"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Due Date
              </span>
              <input
                type="date"
                value={data.dueDate}
                onChange={(e) => set("dueDate")(e.target.value)}
                className="text-sm text-gray-700 bg-transparent border-0 border-b border-transparent focus:border-gray-300 outline-none text-right"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Bill To
            </p>
            <EditableField
              value={data.customerName}
              onChange={set("customerName")}
              placeholder="Customer Name"
              className="font-semibold text-gray-800 mb-1"
            />
            <EditableField
              value={data.customerAddress}
              onChange={set("customerAddress")}
              placeholder="Customer Address"
              multiline
              className="text-gray-600 mb-1"
            />
            <EditableField
              value={data.customerGSTIN}
              onChange={set("customerGSTIN")}
              placeholder="GSTIN"
              className="text-xs text-gray-500"
            />
          </div>
        </div>
      </div>
      <div className="mt-4 h-px bg-gray-200" />
    </div>
  );
}
