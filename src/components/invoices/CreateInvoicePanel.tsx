import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

interface ServiceLine {
  id: string;
  name: string;
  unit: string;
  quantity: string;
  price: string;
  vatRate: string;
}

interface CreateInvoicePanelProps {
  onClose: () => void;
}

export default function CreateInvoicePanel({ onClose }: CreateInvoicePanelProps) {
  const [invoiceType, setInvoiceType] = useState<'Sales' | 'Purchase'>('Sales');
  const [personType, setPersonType] = useState<'physical' | 'legal'>('legal');
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    buyer: true,
    seller: true,
    services: true,
  });

  const [services, setServices] = useState<ServiceLine[]>([
    { id: '1', name: '', unit: 'service', quantity: '1', price: '', vatRate: '21' },
  ]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const addService = () => {
    setServices(prev => [...prev, { id: Date.now().toString(), name: '', unit: 'service', quantity: '1', price: '', vatRate: '21' }]);
  };

  const removeService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const updateService = (id: string, field: keyof ServiceLine, value: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  return (
    <div className="absolute inset-y-0 right-0 z-40 flex">
      <div className="w-[720px] bg-white border-l flex flex-col h-full" style={{ boxShadow: '-2px 0px 0px #E5EDF9' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5EDF9] flex-shrink-0">
          <span className="font-montserrat font-semibold text-[18px] text-[#10233A]">Create VAT invoice</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E5EDF9] transition-colors">
            <X size={16} className="text-[#7288A3]" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">
            {/* Invoice type radio */}
            <div className="flex flex-col gap-2">
              <span className="font-montserrat font-medium text-[12px] text-[#7288A3] uppercase tracking-wide">Invoice type</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${invoiceType === 'Sales' ? 'border-[#007EA7]' : 'border-[#A1B6C6]'}`}>
                    {invoiceType === 'Sales' && <div className="w-2 h-2 rounded-full bg-[#007EA7]" />}
                  </div>
                  <span className="font-montserrat font-medium text-[13px] text-[#10233A]">Sales invoice</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${invoiceType === 'Purchase' ? 'border-[#007EA7]' : 'border-[#A1B6C6]'}`}>
                    {invoiceType === 'Purchase' && <div className="w-2 h-2 rounded-full bg-[#007EA7]" />}
                  </div>
                  <span className="font-montserrat font-medium text-[13px] text-[#10233A]">Purchase invoice</span>
                </label>
              </div>
            </div>

            {/* General section */}
            <CollapsibleSection
              title="General information"
              expanded={expandedSections.general}
              onToggle={() => toggleSection('general')}
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Invoice number" placeholder="Auto-generated" />
                <FormField label="Invoice series" placeholder="e.g. SER" />
                <FormField label="Invoice date" type="date" required />
                <FormField label="Due date" type="date" required />
                <FormSelect label="Currency" options={['EUR', 'USD', 'GBP']} required />
                <FormSelect label="Payment method" options={['Bank transfer', 'Card', 'Cash']} />
              </div>
            </CollapsibleSection>

            {/* Buyer section */}
            <CollapsibleSection
              title="Buyer information"
              expanded={expandedSections.buyer}
              onToggle={() => toggleSection('buyer')}
            >
              <div className="flex flex-col gap-4">
                {/* Person type */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${personType === 'legal' ? 'border-[#007EA7]' : 'border-[#A1B6C6]'}`}>
                      {personType === 'legal' && <div className="w-2 h-2 rounded-full bg-[#007EA7]" />}
                    </div>
                    <span className="font-montserrat font-medium text-[13px] text-[#10233A]">Legal person</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${personType === 'physical' ? 'border-[#007EA7]' : 'border-[#A1B6C6]'}`}>
                      {personType === 'physical' && <div className="w-2 h-2 rounded-full bg-[#007EA7]" />}
                    </div>
                    <span className="font-montserrat font-medium text-[13px] text-[#10233A]">Physical person</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Company name" placeholder="Enter company name" required />
                  <FormField label="Company code" placeholder="Enter code" required />
                  <FormField label="VAT code" placeholder="Enter VAT code" />
                  <FormField label="Address" placeholder="Enter address" required />
                  <FormField label="Email" placeholder="Enter email" type="email" />
                  <FormField label="Phone" placeholder="Enter phone" />
                </div>
              </div>
            </CollapsibleSection>

            {/* Seller section */}
            <CollapsibleSection
              title="Seller information"
              expanded={expandedSections.seller}
              onToggle={() => toggleSection('seller')}
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Company name" placeholder="Enter company name" required />
                <FormField label="Company code" placeholder="Enter code" required />
                <FormField label="VAT code" placeholder="Enter VAT code" />
                <FormField label="Address" placeholder="Enter address" required />
                <FormField label="Bank name" placeholder="Enter bank name" />
                <FormField label="Bank account" placeholder="Enter account number" />
              </div>
            </CollapsibleSection>

            {/* Services section */}
            <CollapsibleSection
              title="Services / Items"
              expanded={expandedSections.services}
              onToggle={() => toggleSection('services')}
            >
              <div className="flex flex-col gap-3">
                {services.map((svc, idx) => (
                  <div key={svc.id} className="flex flex-col gap-2 p-3 bg-[#F8FDFF] rounded border border-[#E5EDF9]">
                    <div className="flex items-center justify-between">
                      <span className="font-montserrat font-medium text-[11px] text-[#7288A3]">Item {idx + 1}</span>
                      {services.length > 1 && (
                        <button onClick={() => removeService(svc.id)} className="hover:opacity-70">
                          <Trash2 size={12} className="text-[#FF4550]" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        value={svc.name}
                        onChange={e => updateService(svc.id, 'name', e.target.value)}
                        placeholder="Service/item name"
                        className="h-8 px-3 rounded border border-[#D3E1EC] font-montserrat font-medium text-[12px] text-[#10233A] placeholder:text-[#A1B6C6] outline-none focus:border-[#007EA7] transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="font-montserrat font-medium text-[10px] text-[#A1B6C6]">Unit</span>
                        <input
                          type="text"
                          value={svc.unit}
                          onChange={e => updateService(svc.id, 'unit', e.target.value)}
                          className="h-7 px-2 rounded border border-[#D3E1EC] font-montserrat font-medium text-[11px] text-[#10233A] outline-none focus:border-[#007EA7] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-montserrat font-medium text-[10px] text-[#A1B6C6]">Qty</span>
                        <input
                          type="number"
                          value={svc.quantity}
                          onChange={e => updateService(svc.id, 'quantity', e.target.value)}
                          className="h-7 px-2 rounded border border-[#D3E1EC] font-montserrat font-medium text-[11px] text-[#10233A] outline-none focus:border-[#007EA7] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-montserrat font-medium text-[10px] text-[#A1B6C6]">Price</span>
                        <input
                          type="number"
                          value={svc.price}
                          onChange={e => updateService(svc.id, 'price', e.target.value)}
                          placeholder="0.00"
                          className="h-7 px-2 rounded border border-[#D3E1EC] font-montserrat font-medium text-[11px] text-[#10233A] placeholder:text-[#A1B6C6] outline-none focus:border-[#007EA7] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-montserrat font-medium text-[10px] text-[#A1B6C6]">VAT %</span>
                        <input
                          type="number"
                          value={svc.vatRate}
                          onChange={e => updateService(svc.id, 'vatRate', e.target.value)}
                          className="h-7 px-2 rounded border border-[#D3E1EC] font-montserrat font-medium text-[11px] text-[#10233A] outline-none focus:border-[#007EA7] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addService}
                  className="flex items-center gap-1 px-3 py-2 rounded border border-dashed border-[#007EA7] hover:bg-[#E6F2F6] transition-colors self-start"
                >
                  <Plus size={12} className="text-[#007EA7]" />
                  <span className="font-montserrat font-medium text-[12px] text-[#007EA7]">Add service/item</span>
                </button>
              </div>
            </CollapsibleSection>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <span className="font-montserrat font-medium text-[12px] text-[#7288A3] uppercase tracking-wide">Notes</span>
              <textarea
                placeholder="Add invoice notes..."
                rows={3}
                className="px-3 py-2 rounded border border-[#D3E1EC] font-montserrat font-medium text-[12px] text-[#10233A] placeholder:text-[#A1B6C6] outline-none focus:border-[#007EA7] transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5EDF9] flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[#D3E1EC] font-montserrat font-medium text-[13px] text-[#10233A] hover:bg-[#F8FDFF] transition-colors"
          >
            Cancel
          </button>
          <button className="px-4 py-2 rounded-md border border-[#D3E1EC] font-montserrat font-medium text-[13px] text-[#10233A] hover:bg-[#F8FDFF] transition-colors">
            Save as draft
          </button>
          <button data-system-action="true" className="px-4 py-2 rounded-md bg-[#007EA7] font-montserrat font-semibold text-[13px] text-white hover:bg-[#006b8f] transition-colors">
            Create invoice
          </button>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, expanded, onToggle, children }: { title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col border border-[#D3E1EC] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between px-4 py-3 bg-[#F8FDFF] hover:bg-[#E6F2F6] transition-colors"
      >
        <span className="font-montserrat font-semibold text-[13px] text-[#10233A]">{title}</span>
        {expanded ? <ChevronUp size={14} className="text-[#7288A3]" /> : <ChevronDown size={14} className="text-[#7288A3]" />}
      </button>
      {expanded && <div className="px-4 py-4">{children}</div>}
    </div>
  );
}

function FormField({ label, placeholder, type = 'text', required }: { label: string; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-montserrat font-medium text-[11px] text-[#7288A3]">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-8 px-3 rounded border border-[#D3E1EC] font-montserrat font-medium text-[12px] text-[#10233A] placeholder:text-[#A1B6C6] outline-none focus:border-[#007EA7] transition-colors"
      />
    </div>
  );
}

function FormSelect({ label, options, required }: { label: string; options: string[]; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-montserrat font-medium text-[11px] text-[#7288A3]">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
      <div className="relative">
        <select className="w-full h-8 px-3 pr-8 rounded border border-[#D3E1EC] font-montserrat font-medium text-[12px] text-[#10233A] outline-none focus:border-[#007EA7] transition-colors appearance-none bg-white">
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7288A3] pointer-events-none" />
      </div>
    </div>
  );
}
