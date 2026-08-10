import { useState, useRef } from 'react';
import { X, ChevronDown, FileText, Upload, Paperclip } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  companyId: string;
  onClose: () => void;
  onCreated: () => void;
  initialData?: Partial<FormData>;
}

const STATUSES = ['Draft', 'Pending', 'Paid', 'Overdue', 'Processing', 'Rejected', 'Provide Additional', 'Exception', 'Transferred', 'Duplicate', 'Not Documented'] as const;

type FormData = {
  status: string;
  receiveDate: string;
  clientCounterparty: string;
  documentType: string;
  source: string;
  totalAmount: string;
  dueEndDate: string;
  fileCase: string;
  orderNo: string;
  number: string;
  type: string;
  documentDate: string;
  documentPurpose: string;
  invoiceContractDate: string;
  operationDate: string;
  expenseAccount: string;
  vatClassifier: string;
  currency: string;
  amountWithoutVat: string;
  vat: string;
  vatPercent: string;
  departmentCode: string;
  objectProject: string;
  validForm: string;
  accountableResponsible: string;
  costCenter: string;
  series: string;
};

const EMPTY: FormData = {
  status: 'Draft',
  receiveDate: '',
  clientCounterparty: '',
  documentType: '',
  source: '',
  totalAmount: '',
  dueEndDate: '',
  fileCase: '',
  orderNo: '',
  number: '',
  type: '',
  documentDate: '',
  documentPurpose: '',
  invoiceContractDate: '',
  operationDate: '',
  expenseAccount: '',
  vatClassifier: '',
  currency: '',
  amountWithoutVat: '',
  vat: '',
  vatPercent: '',
  departmentCode: '',
  objectProject: '',
  validForm: '',
  accountableResponsible: '',
  costCenter: '',
  series: '',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">
        {label}{required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full h-[36px] px-3 bg-white border border-[#D3E1EC] rounded-md font-montserrat font-normal text-[13px] text-[#10233A] placeholder-[#A1B6C6] outline-none focus:border-[#007EA7] transition-colors';

export default function CreateDocumentModal({ companyId, onClose, onCreated, initialData }: Props) {
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initialData });
  const isDuplicate = !!initialData;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileDragOver, setFileDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(key: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientCounterparty.trim()) { setError('Client/Counterparty is required.'); return; }
    setSaving(true);
    setError('');

    let imageUrl: string | null = null;
    if (uploadFile) {
      const ext = uploadFile.name.split('.').pop();
      const path = `${companyId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('document-images')
        .upload(path, uploadFile, { upsert: true });
      if (uploadErr) { setSaving(false); setError(uploadErr.message); return; }
      const { data: urlData } = supabase.storage.from('document-images').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { error: dbErr } = await supabase.from('documents').insert({
      company_id: companyId,
      status: form.status,
      receive_date: form.receiveDate || null,
      client_counterparty: form.clientCounterparty,
      document_type: form.documentType,
      source: form.source,
      total_amount: form.totalAmount,
      due_end_date: form.dueEndDate || null,
      file_case: form.fileCase,
      order_no: form.orderNo,
      number: form.number,
      type: form.type,
      document_date: form.documentDate || null,
      document_purpose: form.documentPurpose,
      invoice_contract_date: form.invoiceContractDate || null,
      operation_date: form.operationDate || null,
      expense_account: form.expenseAccount,
      vat_classifier: form.vatClassifier,
      currency: form.currency,
      amount_without_vat: form.amountWithoutVat,
      vat: form.vat,
      vat_percent: form.vatPercent,
      department_code: form.departmentCode,
      object_project: form.objectProject,
      valid_form: form.validForm || null,
      accountable_responsible: form.accountableResponsible,
      cost_center: form.costCenter,
      series: form.series,
      image_url: imageUrl,
    });
    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    onCreated();
    onClose();
  }

  const STATUS_COLORS: Record<string, string> = {
    Manual: '#007EA7',
    Draft: '#A1B6C6',
    Pending: '#EEB648',
    Paid: '#22C55E',
    Overdue: '#EF4444',
    Processing: '#6366F1',
    Rejected: '#DC2626',
    'Provide Additional': '#F59E0B',
    Exception: '#EA580C',
    Transferred: '#0284C7',
    Duplicate: '#7C3AED',
    'Not Documented': '#9CA3AF',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#10233A]/40 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[760px] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#E6F2F6]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E6F2F6] rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-[#007EA7]" />
            </div>
            <div>
              <h2 className="font-montserrat font-semibold text-[16px] leading-6 text-[#10233A]">{isDuplicate ? 'Duplicate document' : 'New document'}</h2>
              <p className="font-montserrat text-[12px] text-[#7288A3]">{isDuplicate ? 'Review and adjust the copied fields, then save' : 'Fill in the document details below'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F0F7FA] transition-colors">
            <X size={18} className="text-[#7288A3]" />
          </button>
        </div>

        {/* Body */}
        <form id="create-doc-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6">
          {/* Section: General */}
          <p className="font-montserrat font-semibold text-[11px] uppercase tracking-widest text-[#A1B6C6] mb-4">General</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <Field label="Status">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStatusOpen(v => !v)}
                  className={`${inputCls} flex items-center justify-between pr-2`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[form.status] }} />
                    <span>{form.status}</span>
                  </div>
                  <ChevronDown size={14} className="text-[#7288A3]" />
                </button>
                {statusOpen && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#D3E1EC] rounded-lg shadow-lg z-10 overflow-hidden">
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { set('status', s); setStatusOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 font-montserrat text-[13px] hover:bg-[#F0F7FA] transition-colors ${form.status === s ? 'text-[#007EA7] font-semibold' : 'text-[#10233A]'}`}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s] }} />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Client / Counterparty" required>
              <input className={inputCls} placeholder="e.g. Acme Corp" value={form.clientCounterparty} onChange={e => set('clientCounterparty', e.target.value)} />
            </Field>
            <Field label="Document type">
              <input className={inputCls} placeholder="e.g. Invoice" value={form.documentType} onChange={e => set('documentType', e.target.value)} />
            </Field>
            <Field label="Document purpose">
              <input className={inputCls} placeholder="Purpose" value={form.documentPurpose} onChange={e => set('documentPurpose', e.target.value)} />
            </Field>
            <Field label="Source">
              <input className={inputCls} placeholder="Source" value={form.source} onChange={e => set('source', e.target.value)} />
            </Field>
            <Field label="Type">
              <input className={inputCls} placeholder="Type" value={form.type} onChange={e => set('type', e.target.value)} />
            </Field>
            <Field label="Number">
              <input className={inputCls} placeholder="Document number" value={form.number} onChange={e => set('number', e.target.value)} />
            </Field>
            <Field label="Series">
              <input className={inputCls} placeholder="Series" value={form.series} onChange={e => set('series', e.target.value)} />
            </Field>
          </div>

          {/* Section: Dates */}
          <p className="font-montserrat font-semibold text-[11px] uppercase tracking-widest text-[#A1B6C6] mb-4">Dates</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <Field label="Receive date">
              <input type="date" className={inputCls} value={form.receiveDate} onChange={e => set('receiveDate', e.target.value)} />
            </Field>
            <Field label="Due / End date">
              <input type="date" className={inputCls} value={form.dueEndDate} onChange={e => set('dueEndDate', e.target.value)} />
            </Field>
            <Field label="Document date">
              <input type="date" className={inputCls} value={form.documentDate} onChange={e => set('documentDate', e.target.value)} />
            </Field>
            <Field label="Invoice / Contract date">
              <input type="date" className={inputCls} value={form.invoiceContractDate} onChange={e => set('invoiceContractDate', e.target.value)} />
            </Field>
            <Field label="Operation date">
              <input type="date" className={inputCls} value={form.operationDate} onChange={e => set('operationDate', e.target.value)} />
            </Field>
            <Field label="Valid from">
              <input type="date" className={inputCls} value={form.validForm} onChange={e => set('validForm', e.target.value)} />
            </Field>
          </div>

          {/* Section: Financials */}
          <p className="font-montserrat font-semibold text-[11px] uppercase tracking-widest text-[#A1B6C6] mb-4">Financials</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <Field label="Currency">
              <input className={inputCls} placeholder="e.g. EUR" value={form.currency} onChange={e => set('currency', e.target.value)} />
            </Field>
            <Field label="Total amount">
              <input className={inputCls} placeholder="0.00" value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)} />
            </Field>
            <Field label="Amount without VAT">
              <input className={inputCls} placeholder="0.00" value={form.amountWithoutVat} onChange={e => set('amountWithoutVat', e.target.value)} />
            </Field>
            <Field label="VAT">
              <input className={inputCls} placeholder="0.00" value={form.vat} onChange={e => set('vat', e.target.value)} />
            </Field>
            <Field label="VAT %">
              <input className={inputCls} placeholder="e.g. 21" value={form.vatPercent} onChange={e => set('vatPercent', e.target.value)} />
            </Field>
            <Field label="VAT classifier">
              <input className={inputCls} placeholder="VAT classifier" value={form.vatClassifier} onChange={e => set('vatClassifier', e.target.value)} />
            </Field>
            <Field label="Expense account">
              <input className={inputCls} placeholder="Account code" value={form.expenseAccount} onChange={e => set('expenseAccount', e.target.value)} />
            </Field>
          </div>

          {/* Section: Organization */}
          <p className="font-montserrat font-semibold text-[11px] uppercase tracking-widest text-[#A1B6C6] mb-4">Organization</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-2">
            <Field label="Department code">
              <input className={inputCls} placeholder="Dept code" value={form.departmentCode} onChange={e => set('departmentCode', e.target.value)} />
            </Field>
            <Field label="Cost center">
              <input className={inputCls} placeholder="Cost center" value={form.costCenter} onChange={e => set('costCenter', e.target.value)} />
            </Field>
            <Field label="Object / Project">
              <input className={inputCls} placeholder="Object or project" value={form.objectProject} onChange={e => set('objectProject', e.target.value)} />
            </Field>
            <Field label="Accountable / Responsible person">
              <input className={inputCls} placeholder="Person name" value={form.accountableResponsible} onChange={e => set('accountableResponsible', e.target.value)} />
            </Field>
            <Field label="File / Case">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setFileDragOver(true); }}
                onDragLeave={() => setFileDragOver(false)}
                onDrop={e => { e.preventDefault(); setFileDragOver(false); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}
                className={`w-full h-[36px] px-3 flex items-center gap-2 border rounded-md cursor-pointer transition-colors ${fileDragOver ? 'border-[#007EA7] bg-[#EEF6FA]' : 'border-[#D3E1EC] bg-white hover:border-[#007EA7]'}`}
              >
                {uploadFile ? (
                  <>
                    <Paperclip size={13} className="text-[#007EA7] flex-shrink-0" />
                    <span className="font-montserrat text-[13px] text-[#10233A] truncate flex-1">{uploadFile.name}</span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="flex-shrink-0"
                    >
                      <X size={13} className="text-[#7288A3] hover:text-[#EF4444] transition-colors" />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload size={13} className="text-[#A1B6C6] flex-shrink-0" />
                    <span className="font-montserrat text-[13px] text-[#A1B6C6]">Upload or drag a file</span>
                  </>
                )}
              </div>
            </Field>
            <Field label="Order No.">
              <input className={inputCls} placeholder="Order number" value={form.orderNo} onChange={e => set('orderNo', e.target.value)} />
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-[#E6F2F6] bg-[#FAFCFE]">
          {error ? (
            <p className="font-montserrat text-[12px] text-[#EF4444]">{error}</p>
          ) : (
            <p className="font-montserrat text-[12px] text-[#A1B6C6]">Fields marked <span className="text-[#EF4444]">*</span> are required</p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md font-montserrat font-semibold text-[13px] text-[#7288A3] border border-[#D3E1EC] hover:bg-[#F0F7FA] transition-colors"
            >
              Cancel
            </button>
            <button data-system-action="true"
              form="create-doc-form"
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-md font-montserrat font-semibold text-[13px] text-white bg-[#007EA7] hover:bg-[#006A8E] disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : isDuplicate ? 'Save copy' : 'Save document'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
