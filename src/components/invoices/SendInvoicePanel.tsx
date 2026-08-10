import { useState } from 'react';
import { X, Send, Plus, Trash2 } from 'lucide-react';

interface InvoiceRow {
  id: string;
  number: string;
  buyer: string;
  totalAmount: number;
  currency: string;
}

interface SendInvoicePanelProps {
  invoice: InvoiceRow;
  onClose: () => void;
}

export default function SendInvoicePanel({ invoice, onClose }: SendInvoicePanelProps) {
  const [recipients, setRecipients] = useState(['']);
  const [subject, setSubject] = useState(`Invoice ${invoice.number} - ${invoice.totalAmount.toFixed(2)} ${invoice.currency}`);
  const [message, setMessage] = useState(
    `Dear Client,\n\nPlease find attached invoice ${invoice.number} for the amount of ${invoice.totalAmount.toFixed(2)} ${invoice.currency}.\n\nKind regards,\nSDK Finance`
  );
  const [includeAttachments, setIncludeAttachments] = useState(true);

  const addRecipient = () => setRecipients(prev => [...prev, '']);
  const removeRecipient = (idx: number) => setRecipients(prev => prev.filter((_, i) => i !== idx));
  const updateRecipient = (idx: number, value: string) => {
    setRecipients(prev => prev.map((r, i) => i === idx ? value : r));
  };

  return (
    <div className="absolute inset-y-0 right-0 z-40 flex">
      <div className="w-[720px] bg-white border-l flex flex-col h-full" style={{ boxShadow: '-2px 0px 0px #E5EDF9' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5EDF9] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-[#007EA7]" />
            <span className="font-montserrat font-semibold text-[18px] text-[#10233A]">Send invoice</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E5EDF9] transition-colors">
            <X size={16} className="text-[#7288A3]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">
            {/* Invoice summary */}
            <div className="flex items-center gap-4 px-4 py-3 bg-[#F6F7FF] rounded-lg border border-[#E5EDF9]">
              <div className="flex flex-col gap-[2px]">
                <span className="font-montserrat font-medium text-[11px] text-[#7288A3]">Invoice</span>
                <span className="font-montserrat font-semibold text-[13px] text-[#10233A]">{invoice.number}</span>
              </div>
              <div className="w-px h-8 bg-[#E5EDF9]" />
              <div className="flex flex-col gap-[2px]">
                <span className="font-montserrat font-medium text-[11px] text-[#7288A3]">Recipient</span>
                <span className="font-montserrat font-medium text-[13px] text-[#10233A]">{invoice.buyer}</span>
              </div>
              <div className="w-px h-8 bg-[#E5EDF9]" />
              <div className="flex flex-col gap-[2px]">
                <span className="font-montserrat font-medium text-[11px] text-[#7288A3]">Amount</span>
                <span className="font-montserrat font-semibold text-[13px] text-[#10233A]">{invoice.totalAmount.toFixed(2)} {invoice.currency}</span>
              </div>
            </div>

            {/* Recipients */}
            <div className="flex flex-col gap-2">
              <span className="font-montserrat font-medium text-[12px] text-[#7288A3] uppercase tracking-wide">Recipients</span>
              {recipients.map((email, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => updateRecipient(idx, e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 h-8 px-3 rounded border border-[#D3E1EC] font-montserrat font-medium text-[12px] text-[#10233A] placeholder:text-[#A1B6C6] outline-none focus:border-[#007EA7] transition-colors"
                  />
                  {recipients.length > 1 && (
                    <button onClick={() => removeRecipient(idx)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#FFF0F0] transition-colors">
                      <Trash2 size={12} className="text-[#FF4550]" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addRecipient}
                className="flex items-center gap-1 self-start hover:opacity-70 transition-opacity"
              >
                <Plus size={12} className="text-[#007EA7]" />
                <span className="font-montserrat font-medium text-[12px] text-[#007EA7]">Add recipient</span>
              </button>
            </div>

            {/* Subject */}
            <div className="flex flex-col gap-1">
              <span className="font-montserrat font-medium text-[12px] text-[#7288A3] uppercase tracking-wide">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="h-8 px-3 rounded border border-[#D3E1EC] font-montserrat font-medium text-[12px] text-[#10233A] outline-none focus:border-[#007EA7] transition-colors"
              />
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1">
              <span className="font-montserrat font-medium text-[12px] text-[#7288A3] uppercase tracking-wide">Message</span>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={8}
                className="px-3 py-2 rounded border border-[#D3E1EC] font-montserrat font-medium text-[12px] text-[#10233A] outline-none focus:border-[#007EA7] transition-colors resize-none"
              />
            </div>

            {/* Options */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeAttachments}
                onChange={e => setIncludeAttachments(e.target.checked)}
                className="w-[14px] h-[14px] rounded border-[#A1B6C6] accent-[#007EA7]"
              />
              <span className="font-montserrat font-medium text-[12px] text-[#10233A]">Include invoice PDF as attachment</span>
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
          <button data-system-action="true" className="flex items-center gap-1 px-4 py-2 rounded-md bg-[#007EA7] font-montserrat font-semibold text-[13px] text-white hover:bg-[#006b8f] transition-colors">
            <Send size={12} className="text-white" />
            Send invoice
          </button>
        </div>
      </div>
    </div>
  );
}
