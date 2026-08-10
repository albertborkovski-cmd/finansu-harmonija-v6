import { ArrowLeft, ChevronDown, Trash2, Upload, Loader2, Scissors, Plus, Check } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';

type Document = {
  id: string;
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
  status: 'Pending' | 'Paid' | 'Overdue' | 'Draft';
  imageUrl: string | null;
};

type Props = {
  doc: Document;
  onClose: () => void;
  onImageUpload?: (docId: string, imageUrl: string) => void;
};

function Field({ label, value, grey, dropdown }: { label: string; value: string; grey?: boolean; dropdown?: boolean }) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#10233A]">{label}</span>
      <div
        className="flex items-center justify-between px-2 py-[6px] border border-[#D3E1EC] rounded-md h-8"
        style={{ background: grey ? '#F7F7F7' : '#FFFFFF' }}
      >
        <span className="font-montserrat font-medium text-[14px] leading-5 truncate" style={{ color: grey ? '#828588' : '#10233A' }}>
          {value || '—'}
        </span>
        {dropdown && <ChevronDown size={16} className="text-[#7288A3] flex-shrink-0" />}
      </div>
    </div>
  );
}

function Cell({ value, width, grey, dropdown }: { value: string; width: number; grey?: boolean; dropdown?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-2 py-1 border border-[#D3E1EC] rounded text-[12px] leading-[18px] h-[26px] flex-shrink-0"
      style={{ width, background: grey ? '#F7F7F7' : '#FFFFFF' }}
    >
      <span className="font-montserrat font-medium truncate" style={{ color: grey ? '#828588' : '#10233A' }}>
        {value || ''}
      </span>
      {dropdown && <ChevronDown size={12} className="text-[#7288A3] flex-shrink-0" />}
    </div>
  );
}

function EditCell({ value, width, grey, onChange }: { value: string; width: number; grey?: boolean; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className="flex-shrink-0 px-2 py-1 border border-[#D3E1EC] rounded text-[12px] leading-[18px] h-[26px] font-montserrat font-medium focus:outline-none focus:border-[#007EA7] transition-colors"
      style={{ width, background: grey ? '#F7F7F7' : '#FFFFFF', color: grey ? '#828588' : '#10233A' }}
    />
  );
}

type LookupType = 'cost_center' | 'series' | 'object_project' | 'department_code' | 'vat_class' | 'division';

function LookupDropdownCell({ value, width, lookupType, onChange }: { value: string; width: number; lookupType: LookupType; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [newVal, setNewVal] = useState('');
  const [adding, setAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    supabase
      .from('lookup_values')
      .select('value')
      .eq('type', lookupType)
      .order('value')
      .then(({ data }) => { if (data) setOptions(data.map(r => r.value)); });
  }, [open, lookupType]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function handleAdd() {
    const trimmed = newVal.trim();
    if (!trimmed) return;
    setAdding(true);
    await supabase.from('lookup_values').upsert({ type: lookupType, value: trimmed }, { onConflict: 'type,value' });
    setOptions(prev => [...new Set([...prev, trimmed])].sort());
    onChange(trimmed);
    setNewVal('');
    setAdding(false);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex-shrink-0" style={{ width }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between px-2 py-1 border border-[#D3E1EC] rounded text-[12px] leading-[18px] h-[26px] w-full font-montserrat font-medium focus:outline-none focus:border-[#007EA7] transition-colors hover:border-[#007EA7]"
        style={{ background: '#FFFFFF', color: value ? '#10233A' : '#A1B6C6' }}
      >
        <span className="truncate">{value || ''}</span>
        <ChevronDown size={12} className="text-[#7288A3] flex-shrink-0 ml-1" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-[200] bg-white border border-[#D3E1EC] rounded-lg shadow-lg overflow-hidden" style={{ minWidth: Math.max(width, 160) }}>
          <div className="max-h-40 overflow-y-auto">
            {options.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-[#A1B6C6] font-montserrat">No options yet</div>
            )}
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="flex items-center justify-between w-full px-3 py-1.5 text-left text-[12px] font-montserrat font-medium hover:bg-[#F0F8FC] transition-colors"
                style={{ color: opt === value ? '#007EA7' : '#10233A' }}
              >
                <span>{opt}</span>
                {opt === value && <Check size={11} className="text-[#007EA7] flex-shrink-0" />}
              </button>
            ))}
          </div>
          <div className="border-t border-[#D3E1EC] p-2 flex gap-1">
            <input
              value={newVal}
              onChange={e => setNewVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); e.stopPropagation(); }}
              placeholder="Add new..."
              className="flex-1 min-w-0 px-2 py-1 text-[11px] font-montserrat border border-[#D3E1EC] rounded focus:outline-none focus:border-[#007EA7] transition-colors"
            />
            <button data-system-action="true"
              type="button"
              onClick={handleAdd}
              disabled={!newVal.trim() || adding}
              className="flex items-center justify-center w-6 h-6 rounded bg-[#007EA7] hover:bg-[#006a8e] disabled:opacity-40 transition-colors flex-shrink-0"
            >
              {adding ? <Loader2 size={10} className="text-white animate-spin" /> : <Plus size={10} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type LineItem = { id: string; unit: string; qty: string; price: string; subtotal: string; vat: string; vatPct: string; total: string; division: string; object: string; series: string; center: string; allocation: string; vatClass: string };

function newLineItem(): LineItem {
  return { id: crypto.randomUUID(), unit: '', qty: '', price: '', subtotal: '', vat: '', vatPct: '', total: '', division: '', object: '', series: '', center: '', allocation: '', vatClass: '' };
}

const STATUS_COLORS_HIST: Record<string, string> = {
  Manual: '#007EA7', Draft: '#A1B6C6', Pending: '#EEB648', Paid: '#22C55E', Overdue: '#EF4444',
  Processing: '#6366F1', Rejected: '#DC2626', 'Provide Additional': '#F59E0B',
  Exception: '#EA580C', Transferred: '#0284C7', Duplicate: '#7C3AED', 'Not Documented': '#9CA3AF',
};

type HistoryRow = { id: string; created_at: string; user_name: string; action: string; details: string };

export default function DocumentDetailPanel({ doc, onClose, onImageUpload }: Props) {
  const filename = doc.fileCase || `${doc.documentType}-${doc.number}.pdf`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(doc.imageUrl);

  function defaultLineItem(): LineItem {
    return {
      id: crypto.randomUUID(), unit: '', qty: '', price: '',
      subtotal: doc.amountWithoutVat || '',
      vat: doc.vat || '',
      vatPct: doc.vatPercent || '',
      total: doc.totalAmount || '',
      division: '',
      object: doc.objectProject || '',
      series: doc.series || '',
      center: doc.costCenter || '',
      allocation: doc.documentPurpose || '',
      vatClass: doc.vatClassifier || '',
    };
  }

  const [lineItems, setLineItems] = useState<LineItem[]>(() => [defaultLineItem()]);

  function recalcRow(row: LineItem, field: 'subtotal' | 'vatPct', val: string): LineItem {
    const updated = { ...row, [field]: val };
    const sub = parseFloat(updated.subtotal.replace(/[^\d.]/g, '')) || 0;
    const pct = parseFloat(updated.vatPct.replace(/[^\d.]/g, '')) || 0;
    const vatAmt = (sub * pct) / 100;
    const total = sub + vatAmt;
    const cur = doc.currency || 'EUR';
    return { ...updated, vat: vatAmt.toFixed(2) + ' ' + cur, total: total.toFixed(2) + ' ' + cur };
  }
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [showSplitPanel, setShowSplitPanel] = useState(false);
  const [splitMode, setSplitMode] = useState<'equal' | 'percent' | 'amount'>('equal');
  const [splitInputs, setSplitInputs] = useState<Record<string, string>>({});

  useEffect(() => { setLocalImageUrl(doc.imageUrl); }, [doc.imageUrl]);

  useEffect(() => {
    supabase
      .from('document_history')
      .select('*')
      .eq('document_id', doc.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setHistory(data as HistoryRow[]); });
  }, [doc.id]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${doc.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('document-images')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('document-images').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.from('documents').update({ image_url: publicUrl }).eq('id', doc.id);
      setLocalImageUrl(publicUrl);
      onImageUpload?.(doc.id, publicUrl);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const contentRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(60);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);

  const updateScrollState = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollRatio(max > 0 ? el.scrollLeft / max : 0);
    const ratio = el.clientWidth / el.scrollWidth;
    setThumbWidth(Math.max(40, ratio * el.clientWidth));
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    updateScrollState();
    return () => { el.removeEventListener('scroll', updateScrollState); ro.disconnect(); };
  }, [updateScrollState]);

  function scrollByStep(dir: -1 | 1) {
    contentRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  }

  function onTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const el = contentRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - thumbWidth / 2;
    const ratio = Math.max(0, Math.min(1, clickX / (rect.width - thumbWidth)));
    el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth);
  }

  function onThumbMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartScroll.current = contentRef.current?.scrollLeft ?? 0;
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !contentRef.current) return;
      const track = thumbRef.current?.parentElement;
      if (!track) return;
      const dx = ev.clientX - dragStartX.current;
      const max = contentRef.current.scrollWidth - contentRef.current.clientWidth;
      contentRef.current.scrollLeft = dragStartScroll.current + (dx / (track.clientWidth - thumbWidth)) * max;
    };
    const onUp = () => { isDragging.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function parseAmount(s: string): number {
    return parseFloat(s.replace(/[^\d.]/g, '')) || 0;
  }

  function openSplit() {
    const init: Record<string, string> = {};
    if (splitMode === 'equal') {
      lineItems.forEach(r => { init[r.id] = ''; });
    } else if (splitMode === 'percent') {
      const eq = lineItems.length > 0 ? (100 / lineItems.length).toFixed(2) : '0';
      lineItems.forEach(r => { init[r.id] = eq; });
    } else {
      const base = parseAmount(doc.totalAmount);
      const each = lineItems.length > 0 ? (base / lineItems.length).toFixed(2) : '0';
      lineItems.forEach(r => { init[r.id] = each; });
    }
    setSplitInputs(init);
    setShowSplitPanel(true);
  }

  function applySplit() {
    const base = parseAmount(doc.totalAmount);
    setLineItems(prev => prev.map((r) => {
      let amount: number;
      if (splitMode === 'equal') {
        amount = prev.length > 0 ? base / prev.length : 0;
      } else if (splitMode === 'percent') {
        const pct = parseFloat(splitInputs[r.id] ?? '0') || 0;
        amount = (base * pct) / 100;
      } else {
        amount = parseFloat(splitInputs[r.id] ?? '0') || 0;
      }
      const subtotal = amount.toFixed(2) + ' ' + (doc.currency || 'EUR');
      return recalcRow({ ...r, subtotal }, 'subtotal', subtotal);
    }));
    setShowSplitPanel(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto flex flex-row gap-0 p-0">
      {/* Left: document preview / upload placeholder — sticky, never scrolls horizontally */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      {localImageUrl ? (
        <div
          className="flex-shrink-0 sticky left-0 self-start relative group cursor-pointer"
          style={{ width: 400, height: 968 }}
          onClick={() => fileInputRef.current?.click()}
        >
          <img
            src={localImageUrl}
            alt="Document"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploading ? (
              <Loader2 size={36} className="text-white animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={32} className="text-white" />
                <span className="text-white font-montserrat font-semibold text-[14px]">Replace image</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="flex-shrink-0 sticky left-0 self-start flex items-center justify-center bg-[#F8FDFF] border-r border-[#D3E1EC]"
          style={{ width: 400, height: '100vh' }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center gap-3 px-8 py-10 border-2 border-dashed border-[#D3E1EC] rounded-lg bg-white hover:border-[#007EA7] hover:bg-[#F0F7FA] transition-colors disabled:opacity-50"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#F0F7FA]">
              {uploading ? (
                <Loader2 size={28} className="text-[#007EA7] animate-spin" />
              ) : (
                <Upload size={28} className="text-[#007EA7]" strokeWidth={2} />
              )}
            </div>
            <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#10233A]">
              {uploading ? 'Uploading...' : 'Upload document'}
            </span>
            <span className="font-montserrat font-medium text-[13px] leading-5 text-[#7288A3]">PDF, PNG or JPG</span>
          </button>
        </div>
      )}
      {/* Right: content — scrolls horizontally when fields don't fit */}
      <div className="flex-1 flex flex-col min-w-0">
      <div ref={contentRef} className="flex-1 overflow-x-auto overflow-y-visible min-w-0 scrollbar-hide">
      <div className="flex flex-col gap-8 p-6" style={{ minWidth: 1176, width: 'max-content' }}>
        {/* Title bar */}
        <div className="flex flex-row items-center gap-2 min-h-8">
          <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
            <button onClick={onClose} className="flex-shrink-0 flex items-center justify-center w-7 h-7 hover:bg-[#F0F7FA] rounded transition-colors">
              <ArrowLeft size={18} className="text-[#007EA7]" strokeWidth={2} />
            </button>
            <span className="font-montserrat font-semibold text-[18px] leading-[26px] text-[#10233A] truncate">
              Sale invoice {filename}
            </span>
          </div>
          <div className="flex flex-row items-center gap-2 flex-shrink-0">
            <button className="flex items-center justify-center px-3 py-[6px] border-2 border-[#D3E1EC] rounded-md bg-white hover:border-[#007EA7] transition-colors h-8">
              <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3] whitespace-nowrap">Exclude from export</span>
            </button>
            <button className="flex items-center justify-center px-3 py-[6px] border-2 border-[#D3E1EC] rounded-md bg-white hover:border-[#007EA7] transition-colors h-8">
              <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3] whitespace-nowrap">Mark as exported</span>
            </button>
            <button className="flex items-center justify-center px-3 py-[6px] border-2 border-[#D3E1EC] rounded-md bg-white hover:border-[#007EA7] transition-colors h-8">
              <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3] whitespace-nowrap">Add note</span>
            </button>
            <button className="flex items-center justify-center px-3 py-[6px] border-2 border-[#FF6200] rounded-md bg-white hover:bg-[#FFF5F0] transition-colors h-8">
              <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#FF6200] whitespace-nowrap">Report issue</span>
            </button>
          </div>
        </div>

        {/* Main fields card */}
        <div className="border border-[#D3E1EC] rounded-lg p-4 flex flex-row gap-4">
          <div className="flex flex-col gap-4 flex-1 min-w-0" style={{ maxWidth: 216 }}>
            <Field label="Seller (LT)" value={doc.source || 'Meso group, UAB'} grey />
            <Field label="Buyer (LT)" value={doc.clientCounterparty} />
            <Field label="Accountable person" value={doc.accountableResponsible || 'Name Surname'} />
          </div>
          <div className="flex flex-col gap-4 flex-1 min-w-0" style={{ maxWidth: 216 }}>
            <Field label="Invoice date" value={doc.invoiceContractDate || '01.11.2025'} />
            <Field label="Operation date" value={doc.operationDate || '01.11.2025'} />
          </div>
          <div className="flex flex-col gap-4 flex-1 min-w-0" style={{ maxWidth: 216 }}>
            <Field label="Due date" value={doc.dueEndDate || '01.11.2025'} />
          </div>
          <div className="flex flex-col gap-4 flex-1 min-w-0" style={{ maxWidth: 216 }}>
            <Field label="Document Number" value={doc.number || 'Meso27338'} />
            <Field label="Order number" value={doc.orderNo || '—'} />
          </div>
          <div className="flex flex-col gap-4 flex-1 min-w-0" style={{ maxWidth: 216 }}>
            <Field label="Subtotal" value={doc.totalAmount || '205.00 €'} grey />
            <Field label="Total" value={doc.amountWithoutVat || '248.05 €'} grey />
          </div>
          <div className="flex flex-col gap-4 flex-1 min-w-0" style={{ maxWidth: 216 }}>
            <Field label="VAT" value={doc.vat || '43.05 €'} grey />
            <Field label="Currency" value={doc.currency || 'EUR'} dropdown />
          </div>
        </div>

        {/* Line items */}
        <div className="flex flex-col gap-2">
          {/* Header row */}
          <div className="flex flex-row items-center gap-[2px] p-[5px]">
            <div className="flex-shrink-0" style={{ width: 18 }} />
            <button
              onClick={() => setLineItems(prev => [...prev, newLineItem()])}
              className="flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
              style={{ width: 24 }}
              title="Add row"
            >
              <div className="w-4 h-4 rounded-full bg-[#007EA7] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold leading-none">+</span>
              </div>
            </button>
            {[
              { label: 'Unit',       w: 66  },
              { label: 'Quantity',   w: 64  },
              { label: 'Price',      w: 76  },
              { label: 'Subtotal',   w: 76  },
              { label: 'VAT',        w: 76  },
              { label: 'VAT %',      w: 76  },
              { label: 'Total',      w: 76  },
              { label: 'Division',   w: 76  },
              { label: 'Object',     w: 76  },
              { label: 'Series',     w: 76  },
              { label: 'Center',     w: 76  },
              { label: 'Allocation', w: 158 },
              { label: 'VAT Class',  w: 76  },
            ].map((h) => (
              <div key={h.label} className="flex items-center flex-shrink-0" style={{ width: h.w }}>
                <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3] truncate">{h.label}</span>
              </div>
            ))}
            {lineItems.length > 0 && (
              <button
                onClick={openSplit}
                className="ml-3 flex items-center gap-1.5 px-2 py-1 rounded border border-[#D3E1EC] hover:border-[#007EA7] hover:bg-[#F0F7FA] transition-colors flex-shrink-0"
                title="Split amount across rows"
              >
                <Scissors size={11} className="text-[#7288A3]" />
                <span className="font-montserrat font-medium text-[11px] leading-none text-[#7288A3]">Split</span>
              </button>
            )}
          </div>

          {/* Split panel */}
          {showSplitPanel && lineItems.length > 0 && (() => {
            const base = parseAmount(doc.totalAmount);
            const totalPct = lineItems.reduce((s, r) => s + (parseFloat(splitInputs[r.id] ?? '0') || 0), 0);
            const totalAmt = lineItems.reduce((s, r) => s + (parseFloat(splitInputs[r.id] ?? '0') || 0), 0);
            return (
              <div className="border border-[#007EA7]/30 rounded-lg bg-[#F8FDFF] p-4 flex flex-col gap-3">
                {/* Top bar */}
                <div className="flex flex-row items-center gap-3 flex-wrap">
                  <span className="font-montserrat font-semibold text-[12px] text-[#10233A]">
                    Split: <span className="text-[#007EA7]">{doc.totalAmount || '0.00'}</span>
                  </span>
                  <div className="flex flex-row items-center gap-1 bg-white border border-[#D3E1EC] rounded-md p-[2px]">
                    {(['equal', 'percent', 'amount'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => {
                          setSplitMode(m);
                          const init: Record<string, string> = {};
                          if (m === 'equal') {
                            lineItems.forEach(r => { init[r.id] = ''; });
                          } else if (m === 'percent') {
                            const eq = (100 / lineItems.length).toFixed(2);
                            lineItems.forEach(r => { init[r.id] = eq; });
                          } else {
                            const each = (base / lineItems.length).toFixed(2);
                            lineItems.forEach(r => { init[r.id] = each; });
                          }
                          setSplitInputs(init);
                        }}
                        className={`px-3 py-1 rounded text-[11px] font-montserrat font-semibold transition-colors ${splitMode === m ? 'bg-[#007EA7] text-white' : 'text-[#7288A3] hover:text-[#10233A]'}`}
                      >
                        {m === 'equal' ? 'Equal' : m === 'percent' ? 'By %' : 'By amount'}
                      </button>
                    ))}
                  </div>
                  <span className="font-montserrat text-[11px] text-[#7288A3] ml-auto">
                    {splitMode === 'equal'
                      ? `${lineItems.length} rows × ${(base / lineItems.length).toFixed(2)} ${doc.currency || 'EUR'}`
                      : splitMode === 'percent'
                      ? `Total: ${totalPct.toFixed(1)}%`
                      : `Total: ${totalAmt.toFixed(2)} / ${base.toFixed(2)}`}
                  </span>
                </div>

                {/* Per-row inputs */}
                <div className="flex flex-col gap-1">
                  {lineItems.map((r, i) => {
                    const inputVal = splitInputs[r.id] ?? '';
                    const computed = splitMode === 'equal'
                      ? (base / lineItems.length).toFixed(2)
                      : splitMode === 'percent'
                      ? ((base * (parseFloat(inputVal) || 0)) / 100).toFixed(2)
                      : inputVal;
                    return (
                      <div key={r.id} className="flex flex-row items-center gap-3">
                        <span className="font-montserrat font-medium text-[11px] text-[#A1B6C6] w-6 text-right flex-shrink-0">{i + 1}</span>
                        {splitMode === 'equal' ? (
                          <div className="flex items-center px-2 h-7 border border-[#D3E1EC] rounded bg-[#F7F7F7] flex-shrink-0" style={{ width: 130 }}>
                            <span className="font-montserrat font-medium text-[12px] text-[#828588]">{computed} {doc.currency || 'EUR'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              step={splitMode === 'percent' ? '0.01' : '0.01'}
                              value={inputVal}
                              onChange={e => setSplitInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                              className="h-7 px-2 border border-[#D3E1EC] rounded text-[12px] font-montserrat focus:outline-none focus:border-[#007EA7] transition-colors"
                              style={{ width: 80 }}
                              placeholder={splitMode === 'percent' ? '%' : '0.00'}
                            />
                            {splitMode === 'percent' && (
                              <>
                                <span className="font-montserrat text-[11px] text-[#7288A3]">%</span>
                                <span className="font-montserrat text-[11px] text-[#10233A]">= {computed} {doc.currency || 'EUR'}</span>
                              </>
                            )}
                            {splitMode === 'amount' && (
                              <span className="font-montserrat text-[11px] text-[#7288A3]">{doc.currency || 'EUR'}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex flex-row items-center gap-2 pt-1 border-t border-[#D3E1EC]">
                  <button data-system-action="true"
                    onClick={applySplit}
                    className="px-4 py-1.5 rounded-md bg-[#007EA7] text-white font-montserrat font-semibold text-[12px] hover:bg-[#006080] transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setShowSplitPanel(false)}
                    className="px-4 py-1.5 rounded-md border border-[#D3E1EC] text-[#7288A3] font-montserrat font-semibold text-[12px] hover:border-[#007EA7] hover:text-[#10233A] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Data rows */}
          <div className="flex flex-col">
            {lineItems.map((row, i) => (
              <div
                key={row.id}
                className="flex flex-row items-center gap-[2px] p-[5px] rounded-lg"
                style={{ background: i % 2 === 0 ? '#F8FDFF' : '#FFFFFF' }}
              >
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 18 }}>
                  <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#A1B6C6]">{i + 1}</span>
                </div>
                <button
                  className="flex items-center justify-center px-1 flex-shrink-0"
                  style={{ width: 24 }}
                  disabled={lineItems.length === 1}
                  onClick={() => setLineItems(prev => prev.filter(r => r.id !== row.id))}
                >
                  <Trash2 size={14} className={lineItems.length === 1 ? 'text-[#D3E1EC]' : 'text-[#FF6200] opacity-60 hover:opacity-100 transition-opacity'} />
                </button>
                <EditCell value={row.unit} width={66} onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? { ...r, unit: v } : r))} />
                <EditCell value={row.qty} width={64} onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? { ...r, qty: v } : r))} />
                <EditCell value={row.price} width={76} onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? { ...r, price: v } : r))} />
                <EditCell value={row.subtotal} width={76} onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? recalcRow(r, 'subtotal', v) : r))} />
                <EditCell value={row.vat} width={76} onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? { ...r, vat: v } : r))} />
                <EditCell value={row.vatPct} width={76} onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? recalcRow(r, 'vatPct', v) : r))} />
                <EditCell value={row.total} width={76} onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? { ...r, total: v } : r))} grey />
                <LookupDropdownCell value={row.division} width={76} lookupType="division" onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? { ...r, division: v } : r))} />
                <LookupDropdownCell value={row.object} width={76} lookupType="object_project" onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? { ...r, object: v } : r))} />
                <LookupDropdownCell value={row.series} width={76} lookupType="series" onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? { ...r, series: v } : r))} />
                <LookupDropdownCell value={row.center} width={76} lookupType="cost_center" onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? { ...r, center: v } : r))} />
                <EditCell value={row.allocation} width={158} onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? { ...r, allocation: v } : r))} />
                <LookupDropdownCell value={row.vatClass} width={76} lookupType="vat_class" onChange={v => setLineItems(prev => prev.map(r => r.id === row.id ? { ...r, vatClass: v } : r))} />
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="flex flex-col gap-4">
          {/* Header row */}
          <div className="flex flex-row items-center gap-3 pl-3">
            <div className="flex items-center gap-1.5" style={{ width: 158 }}>
              <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">Date</span>
              <div className="flex flex-col gap-0.5">
                <div className="w-3 h-px bg-[#10233A]" />
                <div className="w-2 h-px bg-[#10233A]" />
                <div className="w-1 h-px bg-[#10233A]" />
              </div>
            </div>
            <div className="w-px h-5 bg-[#D3E1EC]" />
            <div style={{ width: 120 }}>
              <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">User</span>
            </div>
            <div className="w-px h-5 bg-[#D3E1EC]" />
            <div style={{ width: 136 }}>
              <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Action</span>
            </div>
            <div className="w-px h-5 bg-[#D3E1EC]" />
            <div className="flex-1">
              <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Details</span>
            </div>
          </div>

          {/* Rows */}
          <div className="flex flex-col">
            {history.length === 0 && (
              <div className="flex items-center justify-center py-6">
                <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#A1B6C6]">No status changes recorded yet</span>
              </div>
            )}
            {history.map((row, i) => {
              const d = new Date(row.created_at);
              const dateStr = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()} — ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
              return (
                <div
                  key={row.id}
                  className="flex flex-row items-center rounded-lg"
                  style={{ background: i % 2 === 0 ? '#F8FDFF' : '#FFFFFF', height: 36 }}
                >
                  <div className="flex items-center px-3 flex-shrink-0" style={{ width: 180 }}>
                    <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{dateStr}</span>
                  </div>
                  <div className="w-1 h-9 opacity-80 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #E3EEFF 0%, rgba(227,238,255,0) 100%)' }} />
                  <div className="flex items-center flex-1 px-3 gap-6">
                    <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]" style={{ width: 120 }}>{row.user_name || '—'}</span>
                    <div className="flex items-center gap-1.5" style={{ width: 136 }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS_HIST[row.action] ?? '#A1B6C6' }} />
                      <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{row.action}</span>
                    </div>
                    <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A] truncate">{row.details}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>
      <HorizontalTableScrollbar scrollRef={contentRef} className="px-6 py-2" />
      </div>
      </div>
    </div>
  );
}
