import { useState, useRef, useEffect, useCallback } from 'react';
import { Copy, ChevronDown, Plus, Search, Columns2, Download, RefreshCw, Info, X, Upload, AlertCircle, Check, Loader2 } from 'lucide-react';
import ColumnSettingsPanel, { type ColConfig } from './ColumnSettingsPanel';
import { useColumnResize, ResizeHandle } from './useColumnResize';
import DocumentDetailPanel from './DocumentDetailPanel';
import CreateDocumentModal from './CreateDocumentModal';
import { PageActionButton, PageHeader } from './PageHeader';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import { supabase, type DbDocument } from '../lib/supabase';
import ColumnSortButton, { useMultiColumnSort } from './ColumnSortButton';
import { ColumnSettingsButton } from './ScopedActionButtons';
import ImportButton from './ImportButton';

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
  status: 'Pending' | 'Paid' | 'Overdue' | 'Draft' | 'Manual' | 'Processing' | 'Rejected' | 'Provide Additional' | 'Exception' | 'Transferred' | 'Duplicate' | 'Not Documented';
  imageUrl: string | null;
};

const STATUSES: Document['status'][] = ['Draft', 'Pending', 'Paid', 'Overdue', 'Processing', 'Rejected', 'Provide Additional', 'Exception', 'Transferred', 'Duplicate', 'Not Documented'];

function mapRow(r: DbDocument): Document {
  return {
    id: r.id,
    receiveDate: r.receive_date,
    clientCounterparty: r.client_counterparty,
    documentType: r.document_type,
    source: r.source,
    totalAmount: r.total_amount,
    dueEndDate: r.due_end_date,
    fileCase: r.file_case,
    orderNo: r.order_no,
    number: r.number,
    type: r.type,
    documentDate: r.document_date,
    documentPurpose: r.document_purpose,
    invoiceContractDate: r.invoice_contract_date,
    operationDate: r.operation_date,
    expenseAccount: r.expense_account,
    vatClassifier: r.vat_classifier,
    currency: r.currency,
    amountWithoutVat: r.amount_without_vat,
    vat: r.vat,
    vatPercent: r.vat_percent,
    departmentCode: r.department_code,
    objectProject: r.object_project,
    validForm: r.valid_form,
    accountableResponsible: r.accountable_responsible,
    costCenter: r.cost_center,
    series: r.series,
    status: r.status as Document['status'],
    imageUrl: r.image_url,
  };
}

const STATUS_COLORS: Record<Document['status'], string> = {
  Manual: '#007EA7',
  Pending: '#EEB648',
  Paid: '#22C55E',
  Overdue: '#EF4444',
  Draft: '#A1B6C6',
  Processing: '#6366F1',
  Rejected: '#DC2626',
  'Provide Additional': '#F59E0B',
  Exception: '#EA580C',
  Transferred: '#0284C7',
  Duplicate: '#7C3AED',
  'Not Documented': '#9CA3AF',
};

const BASE_COLUMNS: ColConfig[] = [
  { key: 'status',               label: 'Status',                        width: 110, visible: true },
  { key: 'receiveDate',           label: 'Receive date',                  width: 110, visible: true },
  { key: 'clientCounterparty',    label: 'Client/Counterparty',           width: 170, visible: true },
  { key: 'documentType',         label: 'Document type',                 width: 140, visible: true },
  { key: 'source',               label: 'Source',                        width: 90,  visible: true },
  { key: 'totalAmount',          label: 'Total amount',                  width: 120, visible: true },
  { key: 'dueEndDate',           label: 'Due/End date',                  width: 110, visible: true },
  { key: 'fileCase',             label: 'File/Case',                     width: 150, visible: true },
  { key: 'orderNo',              label: 'Order No.',                     width: 100, visible: true },
  { key: 'number',               label: 'Number',                        width: 100, visible: true },
  { key: 'type',                 label: 'Type',                          width: 90,  visible: true },
  { key: 'documentDate',         label: 'Document date',                 width: 120, visible: true },
  { key: 'documentPurpose',      label: 'Document purpose',              width: 150, visible: true },
  { key: 'invoiceContractDate',  label: 'Invoice/Contract date',         width: 155, visible: true },
  { key: 'operationDate',        label: 'Operation date',                width: 120, visible: true },
  { key: 'expenseAccount',       label: 'Expense account',               width: 135, visible: true },
  { key: 'vatClassifier',        label: 'VAT classifier',                width: 120, visible: true },
  { key: 'currency',             label: 'Currency',                      width: 90,  visible: true },
  { key: 'amountWithoutVat',     label: 'Amount without VAT',            width: 155, visible: true },
  { key: 'vat',                  label: 'VAT',                           width: 90,  visible: true },
  { key: 'vatPercent',           label: 'VAT%',                          width: 75,  visible: true },
  { key: 'departmentCode',       label: 'Department code',               width: 140, visible: true },
  { key: 'objectProject',        label: 'Object/Project',                width: 130, visible: true },
  { key: 'validForm',            label: 'Valid form',                    width: 110, visible: true },
  { key: 'accountableResponsible',label:'Accountable/Responsible person',width: 210, visible: true },
  { key: 'costCenter',           label: 'Cost center',                   width: 110, visible: true },
  { key: 'series',               label: 'Series',                        width: 90,  visible: true },
];

const FIXED_FILTER_KEYS = new Set(['status', 'clientCounterparty', 'currency']);

const FILTERABLE_COLUMNS: { key: keyof Document; label: string }[] = BASE_COLUMNS
  .filter(c => !FIXED_FILTER_KEYS.has(c.key) && c.key !== 'status')
  .map(c => ({ key: c.key as keyof Document, label: c.label }));

type LookupType = 'cost_center' | 'series' | 'object_project' | 'department_code';

const LOOKUP_COL_MAP: Partial<Record<keyof Document, LookupType>> = {
  series: 'series',
  departmentCode: 'department_code',
  objectProject: 'object_project',
  costCenter: 'cost_center',
};

const DB_COL_MAP: Partial<Record<keyof Document, string>> = {
  series: 'series',
  departmentCode: 'department_code',
  objectProject: 'object_project',
  costCenter: 'cost_center',
};

function LookupCellDropdown({
  docId, colKey, value, lookupType, width,
  onSave,
}: {
  docId: string; colKey: string; value: string; lookupType: LookupType; width: number;
  onSave: (docId: string, colKey: string, newVal: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [newVal, setNewVal] = useState('');
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    supabase
      .from('lookup_values')
      .select('value')
      .eq('type', lookupType)
      .order('value')
      .then(({ data }) => { if (data) setOptions(data.map((r: { value: string }) => r.value)); });
  }, [open, lookupType]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function handleSelect(val: string) {
    setSaving(true);
    await onSave(docId, colKey, val);
    setOpen(false);
    setSaving(false);
  }

  async function handleAdd() {
    const trimmed = newVal.trim();
    if (!trimmed) return;
    setSaving(true);
    await supabase.from('lookup_values').upsert({ type: lookupType, value: trimmed }, { onConflict: 'type,value' });
    await onSave(docId, colKey, trimmed);
    setOptions(prev => [...new Set([...prev, trimmed])].sort());
    setNewVal('');
    setSaving(false);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative" style={{ width }} onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full gap-1 group/lcell"
      >
        <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A] truncate">
          {value || <span className="text-[#A1B6C6]">—</span>}
        </span>
        <ChevronDown
          size={11}
          className="flex-shrink-0 text-[#A1B6C6] opacity-0 group-hover/lcell:opacity-100 transition-opacity"
        />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-[100] bg-white border border-[#D3E1EC] rounded-lg shadow-lg overflow-hidden"
          style={{ minWidth: Math.max(width, 160) }}
        >
          <div className="max-h-44 overflow-y-auto">
            {options.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-[#A1B6C6] font-montserrat">No options yet</div>
            )}
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                disabled={saving}
                onClick={() => handleSelect(opt)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-left text-[12px] font-montserrat font-medium hover:bg-[#F0F8FC] transition-colors disabled:opacity-50"
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
              disabled={!newVal.trim() || saving}
              className="flex items-center justify-center w-6 h-6 rounded bg-[#007EA7] hover:bg-[#006a8e] disabled:opacity-40 transition-colors flex-shrink-0"
            >
              {saving ? <Loader2 size={10} className="text-white animate-spin" /> : <Plus size={10} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Documents({ companyId }: { companyId: string }) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [activeColumns, setActiveColumns] = useState<ColConfig[]>(BASE_COLUMNS);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<Document | null>(null);
  const [openDoc, setOpenDoc] = useState<Document | null>(null);
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadCompany, setUploadCompany] = useState('');
  const [uploadDatePeriod, setUploadDatePeriod] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(60);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);
  const [selectedCounterparty, setSelectedCounterparty] = useState<string | null>(null);
  const [showCounterpartyMenu, setShowCounterpartyMenu] = useState(false);
  const counterpartyRef = useRef<HTMLDivElement>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string>>({});
  const [openDynamicMenu, setOpenDynamicMenu] = useState<string | null>(null);
  const [showAddFilterMenu, setShowAddFilterMenu] = useState(false);
  const addFilterRef = useRef<HTMLDivElement>(null);
  const dynamicFilterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [rangeAmountMin, setRangeAmountMin] = useState('');
  const [rangeAmountMax, setRangeAmountMax] = useState('');
  const [appliedRangeMin, setAppliedRangeMin] = useState<number | null>(null);
  const [appliedRangeMax, setAppliedRangeMax] = useState<number | null>(null);
  const [showRangeAmountMenu, setShowRangeAmountMenu] = useState(false);
  const rangeAmountRef = useRef<HTMLDivElement>(null);

  const [statusDropdownDocId, setStatusDropdownDocId] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [showPerPageMenu, setShowPerPageMenu] = useState(false);

  const updateDocField = useCallback(async (docId: string, colKey: string, newVal: string) => {
    const dbCol = DB_COL_MAP[colKey as keyof Document];
    if (!dbCol) return;
    await supabase.from('documents').update({ [dbCol]: newVal }).eq('id', docId);
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, [colKey]: newVal } : d));
  }, []);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setDocs(data.map(mapRow));
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const { startResize } = useColumnResize(activeColumns, setActiveColumns);

  const visibleColumns = activeColumns.filter(c => c.visible);

  async function handleStatusChange(doc: Document, newStatus: Document['status']) {
    if (newStatus === doc.status) { setStatusDropdownDocId(null); return; }
    const { error } = await supabase.from('documents').update({ status: newStatus }).eq('id', doc.id);
    if (!error) {
      await supabase.from('document_history').insert({
        document_id: doc.id,
        action: newStatus,
        user_name: doc.accountableResponsible || '',
        details: `Status changed from ${doc.status} to ${newStatus}`,
      });
      setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: newStatus } : d));
      if (openDoc?.id === doc.id) setOpenDoc(prev => prev ? { ...prev, status: newStatus } : prev);
    }
    setStatusDropdownDocId(null);
  }

  const handleExport = () => {
    if (!exportFormat) return;
    const cols = visibleColumns;
    const headers = cols.map(c => c.label);
    const dataRows = sortedDocs.map(doc =>
      cols.map(c => {
        const val = (doc as Record<string, unknown>)[c.key];
        return val?.toString() ?? '';
      })
    );
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    if (exportFormat === 'csv') {
      const lines = [headers.map(escape).join(','), ...dataRows.map(r => r.map(escape).join(','))];
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'documents.csv'; a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'xlsx') {
      const tsv = [headers, ...dataRows].map(r => r.join('\t')).join('\n');
      const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'documents.xls'; a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'pdf') {
      const lines = ['Documents Export', '', headers.join(' | '), headers.map(() => '---').join('-|-'),
        ...dataRows.map(r => r.join(' | '))];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'documents.txt'; a.click();
      URL.revokeObjectURL(url);
    }
    setExportOpen(false);
  };

  function parseDate(d: string): number {
    const [day, mon, yr] = d.split('.');
    return new Date(Number(yr), Number(mon) - 1, Number(day)).getTime();
  }

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function formatPeriod(ym: string) {
    const [yr, mo] = ym.split('-');
    return `${MONTH_NAMES[Number(mo) - 1]} ${yr}`;
  }

  const availablePeriods: string[] = Array.from(
    new Set(docs.map(doc => {
      const [, mon, yr] = doc.receiveDate.split('.');
      return `${yr}-${mon}`;
    }))
  ).sort((a, b) => b.localeCompare(a));

  const { sortedRows: baseDocs, changeSort, directionFor } = useMultiColumnSort(docs, (document, key) => {
    const value = document[key as keyof Document];
    return key === 'receiveDate' ? parseDate(String(value)) : typeof value === 'boolean' ? String(value) : value as string | number | undefined;
  });

  const sortedDocs = (selectedPeriod
    ? baseDocs.filter(doc => {
        const [, mon, yr] = doc.receiveDate.split('.');
        return `${yr}-${mon}` === selectedPeriod;
      })
    : baseDocs
  ).filter(doc => !selectedCurrency || doc.currency === selectedCurrency)
   .filter(doc => !selectedCounterparty || doc.clientCounterparty === selectedCounterparty)
   .filter(doc => !selectedStatus || doc.status === selectedStatus)
   .filter(doc => {
     return Object.entries(dynamicFilters).every(([key, val]) => {
       if (!val) return true;
       return String(doc[key as keyof Document] ?? '').toLowerCase() === val.toLowerCase();
     });
   })
   .filter(doc => {
     if (!searchQuery.trim()) return true;
     const q = searchQuery.trim().toLowerCase();
     return Object.values(doc).some(v => v != null && String(v).toLowerCase().includes(q));
   })
   .filter(doc => {
     if (appliedRangeMin === null && appliedRangeMax === null) return true;
     const val = parseFloat(doc.amountWithoutVat.replace(/[^\d.,-]/g, '').replace(',', '.'));
     if (isNaN(val)) return false;
     if (appliedRangeMin !== null && val < appliedRangeMin) return false;
     if (appliedRangeMax !== null && val > appliedRangeMax) return false;
     return true;
   });

  const totalDocs = sortedDocs.length;
  const totalPages = Math.ceil(totalDocs / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, totalDocs);
  const pageDocs = sortedDocs.slice(startIdx, endIdx);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setShowPeriodMenu(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setShowCurrencyMenu(false);
      }
      if (counterpartyRef.current && !counterpartyRef.current.contains(e.target as Node)) {
        setShowCounterpartyMenu(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
      if (addFilterRef.current && !addFilterRef.current.contains(e.target as Node)) {
        setShowAddFilterMenu(false);
      }
      Object.entries(dynamicFilterRefs.current).forEach(([key, el]) => {
        if (el && !el.contains(e.target as Node)) {
          setOpenDynamicMenu(prev => prev === key ? null : prev);
        }
      });
      if (rangeAmountRef.current && !rangeAmountRef.current.contains(e.target as Node)) {
        setShowRangeAmountMenu(false);
      }
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setShowInfoPanel(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const updateScrollState = useCallback(() => {
    const el = tableRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollRatio(max > 0 ? el.scrollLeft / max : 0);
    const ratio = el.clientWidth / el.scrollWidth;
    setThumbWidth(Math.max(40, ratio * el.clientWidth));
  }, []);

  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    updateScrollState();
    return () => { el.removeEventListener('scroll', updateScrollState); ro.disconnect(); };
  }, [updateScrollState]);

  function scrollByStep(dir: -1 | 1) {
    const el = tableRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 200, behavior: 'smooth' });
  }

  function onTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const track = e.currentTarget;
    const el = tableRef.current;
    if (!el) return;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left - thumbWidth / 2;
    const maxThumbLeft = rect.width - thumbWidth;
    const ratio = Math.max(0, Math.min(1, clickX / maxThumbLeft));
    el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth);
  }

  function onThumbMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartScroll.current = tableRef.current?.scrollLeft ?? 0;
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !tableRef.current) return;
      const track = thumbRef.current?.parentElement;
      if (!track) return;
      const trackW = track.clientWidth - thumbWidth;
      const dx = ev.clientX - dragStartX.current;
      const max = tableRef.current.scrollWidth - tableRef.current.clientWidth;
      tableRef.current.scrollLeft = dragStartScroll.current + (dx / trackW) * max;
    };
    const onUp = () => { isDragging.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function goToPage(page: number) {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
    setSelectedIds(new Set());
  }

  function changeItemsPerPage(n: number) {
    setItemsPerPage(n);
    setCurrentPage(1);
    setSelectedIds(new Set());
    setShowPerPageMenu(false);
  }

  function toggleAll() {
    const pageIds = pageDocs.map(d => d.id);
    const allSelected = pageIds.every(id => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) pageIds.forEach(id => next.delete(id));
    else pageIds.forEach(id => next.add(id));
    setSelectedIds(next);
  }

  function toggleRow(id: string) {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  }

  return (
    <div className="flex flex-col gap-8 px-4 sm:px-8 lg:px-[72px] py-14 min-w-0">
      {/* Title row */}
      <PageHeader title="Documents" actions={
        <>
          <PageActionButton disabled>Import</PageActionButton>
          <PageActionButton onClick={() => setShowCreateModal(true)}>Create document manually</PageActionButton>
          <div className="flex flex-row items-center gap-1.5">
            <PageActionButton onClick={() => setShowUploadPanel(true)}>Upload document</PageActionButton>
            <div className="relative" ref={infoRef}>
              <button
                onClick={() => setShowInfoPanel(v => !v)}
                className="flex items-center justify-center"
              >
                <Info size={24} className={`flex-shrink-0 transition-colors ${showInfoPanel ? 'text-[#007EA7]' : 'text-[#A1B6C6] hover:text-[#007EA7]'}`} />
              </button>
              {showInfoPanel && (
                <div className="absolute right-0 top-full mt-2 z-50 flex flex-col items-end" style={{ filter: 'drop-shadow(2px 0px 16px #E3EEFF)' }}>
                  {/* Arrow */}
                  <div className="mr-[4px] w-0 h-0" style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '8px solid #ffffff' }} />
                  {/* Panel */}
                  <div className="w-[706px] max-h-[calc(100vh-140px)] overflow-y-auto bg-white rounded-3xl p-6 flex flex-col gap-4">
                    {/* Warning box */}
                    <div className="flex flex-row items-center justify-center px-4 py-3 gap-2.5 rounded-lg" style={{ background: 'rgba(204,79,0,0.1)', border: '1px solid #CC4F00' }}>
                      <p className="font-montserrat font-semibold text-[14px] leading-5 text-[#CC4F00]">
                        Important: the system processes purchase invoices by default. If the subject line does not contain any keyword, the document will still be interpreted as a purchase invoice.
                      </p>
                    </div>
                    {/* Body */}
                    <div className="flex flex-col gap-2">
                      <p className="font-montserrat font-normal text-[14px] leading-5 text-black">
                        When sending documents, you may use the following keywords in the email subject line (using keywords is optional; the system will process documents even without them):
                      </p>
                      <p className="font-montserrat font-normal text-[14px] leading-5 text-black">
                        To assign an analytical code (project, department, or object) to all documents in the email, include the code in round brackets in the subject line, e.g. (PROJ001) or (ADMIN).
                      </p>
                      <div className="font-montserrat font-semibold text-[14px] leading-5 text-black flex flex-col gap-1 mt-2">
                        {[
                          { kw: 'PAY', desc: '– after the document is processed, a payment draft will be created. You will later receive a prepared payment order. If bank integration is enabled, you may also specify the bank using SWED, SEB, or PAYSERA. In this case, the payment draft will be created directly in the selected internet bank.' },
                          { kw: 'PERSONAL', desc: '– the document relates to personal expenses paid by the sender and will be processed as reimbursable expenses.' },
                          { kw: 'INVOICE', desc: '– the document will be processed as a purchase invoice.' },
                          { kw: '@XXX', desc: '– receiving goods into a warehouse with code XXX, e.g. @WH, @MAIN, @STO.' },
                          { kw: 'QTY', desc: '– the document will be processed based on quantities.' },
                          { kw: 'AMOUNT', desc: '– the document will be processed based on amounts only (without quantities).' },
                          { kw: 'COMPANY', desc: '– the document relates to company expenses.' },
                          { kw: 'PIT', desc: '– this keyword is used when submitting a document that is not a purchase invoice, but must be recorded as a personal income tax (PIT/GPM) transaction.' },
                          { kw: 'NOSPLIT', desc: '– this keyword is used when a PDF file contains several pages but must not be split. The entire PDF will be treated as a single document.' },
                        ].map(({ kw, desc }) => (
                          <p key={kw}><span className="text-[#007EA7]">{kw}</span> {desc}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      } />

      {/* Email card */}
      <div className="flex flex-row items-center gap-4 px-6 py-4 bg-white border border-[#E6F2F6] rounded-2xl max-w-xl">
        <div className="flex flex-col gap-0.5">
          <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">
            Email for uploading new documents
          </span>
          <div className="flex flex-row items-center gap-1">
            <Copy size={16} className="text-[#007EA7] flex-shrink-0 cursor-pointer" />
            <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">
              demo@robolabs.lt
            </span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-row items-end gap-4 flex-wrap">
        <div className="flex flex-row items-center gap-1 flex-wrap">
          {/* Period dropdown */}
          <div className="relative" ref={periodRef}>
            <div
              onClick={() => setShowPeriodMenu(v => !v)}
              className={`flex flex-row items-center gap-1 px-2 py-[5px] rounded cursor-pointer transition-colors ${
                selectedPeriod ? 'bg-[#007EA7]' : 'bg-[#E5EDF9]'
              }`}
            >
              <span className={`font-montserrat font-medium text-[12px] leading-[18px] whitespace-nowrap ${
                selectedPeriod ? 'text-white' : 'text-[#7288A3]'
              }`}>
                {selectedPeriod ? formatPeriod(selectedPeriod) : 'Period'}
              </span>
              <ChevronDown size={16} className={selectedPeriod ? 'text-white' : 'text-[#7288A3]'} />
            </div>
            {showPeriodMenu && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-[#D3E1EC] rounded-lg shadow-lg overflow-hidden z-20 min-w-[130px]">
                {selectedPeriod && (
                  <button
                    onClick={() => { setSelectedPeriod(null); setShowPeriodMenu(false); setCurrentPage(1); }}
                    className="w-full px-4 py-2 text-left font-montserrat font-medium text-[13px] text-[#EF4444] hover:bg-[#FFF5F5] transition-colors border-b border-[#E6F2F6]"
                  >
                    Clear
                  </button>
                )}
                {availablePeriods.map(ym => (
                  <button
                    key={ym}
                    onClick={() => { setSelectedPeriod(ym); setShowPeriodMenu(false); setCurrentPage(1); setSelectedIds(new Set()); }}
                    className={`w-full px-4 py-2 text-left font-montserrat font-medium text-[13px] hover:bg-[#F0F7FA] transition-colors ${
                      selectedPeriod === ym ? 'text-[#007EA7] bg-[#EEF6FA]' : 'text-[#10233A]'
                    }`}
                  >
                    {formatPeriod(ym)}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Client/Counterparty filter */}
          <div className="relative" ref={counterpartyRef}>
            <div
              onClick={() => setShowCounterpartyMenu(v => !v)}
              className={`flex flex-row items-center gap-1 px-2 py-[5px] rounded cursor-pointer ${selectedCounterparty ? 'bg-[#007EA7]' : 'bg-[#E5EDF9]'}`}
            >
              <span className={`font-montserrat font-medium text-[12px] leading-[18px] whitespace-nowrap max-w-[160px] truncate ${selectedCounterparty ? 'text-white' : 'text-[#7288A3]'}`}>
                {selectedCounterparty ?? 'Client/Counterparty'}
              </span>
              <ChevronDown size={16} className={selectedCounterparty ? 'text-white' : 'text-[#7288A3]'} />
            </div>
            {showCounterpartyMenu && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-[#D3E1EC] rounded-lg shadow-lg overflow-y-auto z-20 min-w-[200px] max-h-[240px]">
                {selectedCounterparty && (
                  <button
                    onClick={() => { setSelectedCounterparty(null); setShowCounterpartyMenu(false); setCurrentPage(1); }}
                    className="w-full px-4 py-2 text-left font-montserrat font-medium text-[13px] text-[#EF4444] hover:bg-[#FFF5F5] transition-colors border-b border-[#E6F2F6]"
                  >
                    Clear
                  </button>
                )}
                {Array.from(new Set(docs.map(d => d.clientCounterparty).filter(Boolean))).sort().map(cp => (
                  <button
                    key={cp}
                    onClick={() => { setSelectedCounterparty(cp); setShowCounterpartyMenu(false); setCurrentPage(1); setSelectedIds(new Set()); }}
                    className={`w-full px-4 py-2 text-left font-montserrat font-medium text-[13px] hover:bg-[#F0F7FA] transition-colors ${selectedCounterparty === cp ? 'text-[#007EA7] bg-[#EEF6FA]' : 'text-[#10233A]'}`}
                  >
                    {cp}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Currency filter */}
          <div className="relative" ref={currencyRef}>
            <div
              onClick={() => setShowCurrencyMenu(v => !v)}
              className={`flex flex-row items-center gap-1 px-2 py-[5px] rounded cursor-pointer ${selectedCurrency ? 'bg-[#007EA7]' : 'bg-[#E5EDF9]'}`}
            >
              <span className={`font-montserrat font-medium text-[12px] leading-[18px] whitespace-nowrap ${selectedCurrency ? 'text-white' : 'text-[#7288A3]'}`}>
                {selectedCurrency ?? 'Currency'}
              </span>
              <ChevronDown size={16} className={selectedCurrency ? 'text-white' : 'text-[#7288A3]'} />
            </div>
            {showCurrencyMenu && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#D3E1EC] py-1 min-w-[100px]">
                {selectedCurrency && (
                  <button
                    onClick={() => { setSelectedCurrency(null); setShowCurrencyMenu(false); setCurrentPage(1); }}
                    className="w-full px-4 py-2 text-left font-montserrat font-medium text-[13px] text-[#FF6200] hover:bg-[#FFF5F0] transition-colors"
                  >
                    Clear
                  </button>
                )}
                {Array.from(new Set(docs.map(d => d.currency).filter(Boolean))).sort().map(cur => (
                  <button
                    key={cur}
                    onClick={() => { setSelectedCurrency(cur); setShowCurrencyMenu(false); setCurrentPage(1); }}
                    className={`w-full px-4 py-2 text-left font-montserrat font-medium text-[13px] hover:bg-[#F0F7FA] transition-colors ${selectedCurrency === cur ? 'text-[#007EA7] bg-[#EEF6FA]' : 'text-[#10233A]'}`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Range amount filter */}
          <div className="relative" ref={rangeAmountRef}>
            <div
              onClick={() => setShowRangeAmountMenu(v => !v)}
              className={`flex flex-row items-center gap-1 px-2 py-[5px] rounded cursor-pointer ${(appliedRangeMin !== null || appliedRangeMax !== null) ? 'bg-[#007EA7]' : 'bg-[#E5EDF9]'}`}
            >
              <span className={`font-montserrat font-medium text-[12px] leading-[18px] whitespace-nowrap ${(appliedRangeMin !== null || appliedRangeMax !== null) ? 'text-white' : 'text-[#7288A3]'}`}>
                {(appliedRangeMin !== null || appliedRangeMax !== null)
                  ? `${appliedRangeMin ?? ''}–${appliedRangeMax ?? ''}`
                  : 'Range amount'}
              </span>
              <ChevronDown size={16} className={(appliedRangeMin !== null || appliedRangeMax !== null) ? 'text-white' : 'text-[#7288A3]'} />
            </div>
            {showRangeAmountMenu && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#D3E1EC] p-3 min-w-[200px]">
                <p className="font-montserrat font-semibold text-[11px] text-[#7288A3] uppercase tracking-wide mb-2">Amount without VAT range</p>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="font-montserrat text-[11px] text-[#7288A3]">From</label>
                    <input
                      type="number"
                      value={rangeAmountMin}
                      onChange={e => setRangeAmountMin(e.target.value)}
                      placeholder="Min"
                      className="w-full px-2 py-1.5 border border-[#D3E1EC] rounded text-[13px] font-montserrat text-[#10233A] outline-none focus:border-[#007EA7]"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="font-montserrat text-[11px] text-[#7288A3]">To</label>
                    <input
                      type="number"
                      value={rangeAmountMax}
                      onChange={e => setRangeAmountMax(e.target.value)}
                      placeholder="Max"
                      className="w-full px-2 py-1.5 border border-[#D3E1EC] rounded text-[13px] font-montserrat text-[#10233A] outline-none focus:border-[#007EA7]"
                    />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => {
                        setAppliedRangeMin(rangeAmountMin !== '' ? parseFloat(rangeAmountMin) : null);
                        setAppliedRangeMax(rangeAmountMax !== '' ? parseFloat(rangeAmountMax) : null);
                        setCurrentPage(1);
                        setShowRangeAmountMenu(false);
                      }}
                      className="flex-1 py-1.5 bg-[#007EA7] text-white font-montserrat font-medium text-[12px] rounded hover:bg-[#006A8E] transition-colors"
                    >
                      Apply
                    </button>
                    {(appliedRangeMin !== null || appliedRangeMax !== null) && (
                      <button
                        onClick={() => {
                          setRangeAmountMin(''); setRangeAmountMax('');
                          setAppliedRangeMin(null); setAppliedRangeMax(null);
                          setCurrentPage(1); setShowRangeAmountMenu(false);
                        }}
                        className="px-3 py-1.5 border border-[#D3E1EC] text-[#EF4444] font-montserrat font-medium text-[12px] rounded hover:bg-[#FFF5F5] transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Status filter */}
          <div className="relative" ref={statusRef}>
            <div
              onClick={() => setShowStatusMenu(v => !v)}
              className={`flex flex-row items-center gap-1 px-2 py-[5px] rounded cursor-pointer ${selectedStatus ? 'bg-[#007EA7]' : 'bg-[#E5EDF9]'}`}
            >
              <span className={`font-montserrat font-medium text-[12px] leading-[18px] whitespace-nowrap ${selectedStatus ? 'text-white' : 'text-[#7288A3]'}`}>
                {selectedStatus ?? 'Status'}
              </span>
              <ChevronDown size={16} className={selectedStatus ? 'text-white' : 'text-[#7288A3]'} />
            </div>
            {showStatusMenu && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-[#D3E1EC] rounded-lg shadow-lg overflow-hidden z-20 min-w-[140px]">
                {selectedStatus && (
                  <button
                    onClick={() => { setSelectedStatus(null); setShowStatusMenu(false); setCurrentPage(1); }}
                    className="w-full px-4 py-2 text-left font-montserrat font-medium text-[13px] text-[#EF4444] hover:bg-[#FFF5F5] transition-colors border-b border-[#E6F2F6]"
                  >
                    Clear
                  </button>
                )}
                {Array.from(new Set(docs.map(d => d.status).filter(Boolean))).sort().map(st => (
                  <button
                    key={st}
                    onClick={() => { setSelectedStatus(st); setShowStatusMenu(false); setCurrentPage(1); setSelectedIds(new Set()); }}
                    className={`w-full px-4 py-2 text-left font-montserrat font-medium text-[13px] hover:bg-[#F0F7FA] transition-colors ${selectedStatus === st ? 'text-[#007EA7] bg-[#EEF6FA]' : 'text-[#10233A]'}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-row items-center gap-1 px-2 py-[5px] bg-[#E5EDF9] rounded w-[180px]">
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search"
              className="flex-1 bg-transparent outline-none font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A] placeholder-[#7288A3] min-w-0"
            />
            {searchQuery ? (
              <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>
                <X size={14} className="text-[#7288A3]" />
              </button>
            ) : (
              <Search size={16} className="text-[#7288A3]" />
            )}
          </div>
          {/* Dynamic filter chips */}
          {Object.entries(dynamicFilters).map(([key, val]) => {
            const col = FILTERABLE_COLUMNS.find(c => c.key === key);
            if (!col) return null;
            const uniqueVals = Array.from(new Set(docs.map(d => String(d[key as keyof Document] ?? '')).filter(Boolean))).sort();
            return (
              <div key={key} className="relative" ref={el => { dynamicFilterRefs.current[key] = el; }}>
                <div
                  onClick={() => setOpenDynamicMenu(prev => prev === key ? null : key)}
                  className={`flex flex-row items-center gap-1 px-2 py-[5px] rounded cursor-pointer ${val ? 'bg-[#007EA7]' : 'bg-[#E5EDF9]'}`}
                >
                  <span className={`font-montserrat font-medium text-[12px] leading-[18px] whitespace-nowrap max-w-[140px] truncate ${val ? 'text-white' : 'text-[#7288A3]'}`}>
                    {val || col.label}
                  </span>
                  <ChevronDown size={16} className={val ? 'text-white' : 'text-[#7288A3]'} />
                  <button
                    onClick={e => { e.stopPropagation(); setDynamicFilters(prev => { const n = { ...prev }; delete n[key]; return n; }); setOpenDynamicMenu(null); setCurrentPage(1); }}
                    className="ml-0.5"
                  >
                    <X size={12} className={val ? 'text-white/80' : 'text-[#7288A3]'} />
                  </button>
                </div>
                {openDynamicMenu === key && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-[#D3E1EC] rounded-lg shadow-lg overflow-y-auto z-20 min-w-[180px] max-h-[240px]">
                    {val && (
                      <button
                        onClick={() => { setDynamicFilters(prev => ({ ...prev, [key]: '' })); setOpenDynamicMenu(null); setCurrentPage(1); }}
                        className="w-full px-4 py-2 text-left font-montserrat font-medium text-[13px] text-[#EF4444] hover:bg-[#FFF5F5] transition-colors border-b border-[#E6F2F6]"
                      >
                        Clear
                      </button>
                    )}
                    {uniqueVals.map(v => (
                      <button
                        key={v}
                        onClick={() => { setDynamicFilters(prev => ({ ...prev, [key]: v })); setOpenDynamicMenu(null); setCurrentPage(1); setSelectedIds(new Set()); }}
                        className={`w-full px-4 py-2 text-left font-montserrat font-medium text-[13px] hover:bg-[#F0F7FA] transition-colors truncate ${val === v ? 'text-[#007EA7] bg-[#EEF6FA]' : 'text-[#10233A]'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {/* Add filter */}
          <div className="relative" ref={addFilterRef}>
            <button
              onClick={() => setShowAddFilterMenu(v => !v)}
              className="flex flex-row items-center gap-1 px-2 py-[5px] bg-[#E5EDF9] rounded"
            >
              <Plus size={16} className="text-[#7288A3]" />
              <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Add filter</span>
            </button>
            {showAddFilterMenu && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-[#D3E1EC] rounded-lg shadow-lg overflow-y-auto z-20 min-w-[200px] max-h-[280px]">
                {FILTERABLE_COLUMNS.filter(c => !(c.key in dynamicFilters)).map(col => (
                  <button
                    key={col.key}
                    onClick={() => {
                      setDynamicFilters(prev => ({ ...prev, [col.key]: '' }));
                      setShowAddFilterMenu(false);
                      setOpenDynamicMenu(col.key);
                    }}
                    className="w-full px-4 py-2 text-left font-montserrat font-medium text-[13px] text-[#10233A] hover:bg-[#F0F7FA] transition-colors"
                  >
                    {col.label}
                  </button>
                ))}
                {FILTERABLE_COLUMNS.every(c => c.key in dynamicFilters) && (
                  <div className="px-4 py-2 font-montserrat text-[13px] text-[#7288A3]">No more filters available</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-row items-center gap-1 ml-auto bg-white rounded px-1.5 py-1.5">
          <ColumnSettingsButton onClick={() => setShowColumnPanel(v => !v)} />
          <ImportButton scope="Documents" />
          <button
            title="REFRESH ALL"
            onClick={async () => { setRefreshing(true); await fetchDocs(); setRefreshing(false); }}
            className="p-0.5 rounded text-[#7288A3] hover:text-[#007EA7] transition-colors"
          >
            <RefreshCw size={16} className={`text-[#7288A3] transition-transform ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div ref={tableRef} className="flex flex-col gap-0 overflow-x-auto scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-6 w-6 text-[#007EA7]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
        <>
        {/* Column headers */}
        <div className="flex flex-row items-center gap-0 pl-3 pr-2 py-0 mb-1 min-w-max">
          <div className="flex-shrink-0 w-[30px] flex items-center">
            <input
              type="checkbox"
              checked={pageDocs.length > 0 && pageDocs.every(d => selectedIds.has(d.id))}
              onChange={toggleAll}
              className="w-[18px] h-[18px] rounded border border-[#A1B6C6] accent-[#007EA7] cursor-pointer"
            />
          </div>
          {visibleColumns.map((col) => {
            const colIdx = activeColumns.findIndex(c => c.key === col.key);
            return (
            <div key={col.key} className="flex flex-row items-center flex-shrink-0">
              <div style={{ width: col.width, position: 'relative' }} className="flex items-center gap-1">
                <span className={`font-montserrat font-medium text-[12px] leading-[18px] truncate ${directionFor(col.key) ? 'text-[#10233A]' : 'text-[#7288A3]'}`}>
                  {col.label}
                </span>
                <ColumnSortButton columnLabel={col.label} direction={directionFor(col.key)} onDirectionChange={direction => { changeSort(col.key, direction); setCurrentPage(1); }} />
                <ResizeHandle onMouseDown={(e) => startResize(colIdx, e)} />
              </div>
            </div>
            );
          })}
          <div className="flex-shrink-0 w-[160px]" />
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-0 min-w-max">
          {pageDocs.map((doc, i) => {
            const isSelected = selectedIds.has(doc.id);
            const isEven = i % 2 === 0;
            return (
              <div
                key={doc.id}
                className={`flex flex-row items-center gap-0 pl-3 pr-2 rounded-lg transition-colors group ${
                  isSelected ? 'bg-[#EEF6FA]' : isEven ? 'bg-[#F8FDFF]' : 'bg-white'
                } hover:bg-[#EEF6FA]`}
              >
                <div className="flex-shrink-0 w-[30px] flex items-center py-[9px]">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRow(doc.id)}
                    className="w-[18px] h-[18px] rounded border border-[#A1B6C6] accent-[#007EA7] cursor-pointer"
                  />
                </div>
                {visibleColumns.map((col, ci) => (
                  <div key={col.key} className="flex flex-row items-center flex-shrink-0">
                    <div style={{ width: col.width }} className="py-[9px]">
                      {col.key === 'status' ? (
                        <div className="relative">
                          <button
                            onClick={e => { e.stopPropagation(); setStatusDropdownDocId(prev => prev === doc.id ? null : doc.id); }}
                            className="flex flex-row items-center gap-1 hover:opacity-75 transition-opacity"
                          >
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[doc.status] }} />
                            <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{doc.status}</span>
                          </button>
                          {statusDropdownDocId === doc.id && (
                            <div
                              className="absolute top-full mt-1 left-0 bg-white border border-[#D3E1EC] rounded-lg shadow-lg z-30 overflow-hidden"
                              style={{ minWidth: 160 }}
                              onClick={e => e.stopPropagation()}
                            >
                              {STATUSES.map(s => (
                                <button
                                  key={s}
                                  onClick={() => handleStatusChange(doc, s)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 font-montserrat text-[12px] hover:bg-[#F0F7FA] transition-colors text-left ${doc.status === s ? 'text-[#007EA7] font-semibold' : 'text-[#10233A]'}`}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s] }} />
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : col.key === 'fileCase' ? (
                        <a href="#" className="font-montserrat font-normal text-[12px] leading-[18px] text-[#007EA7] underline block truncate">
                          {doc[col.key as keyof Document] as string}
                        </a>
                      ) : LOOKUP_COL_MAP[col.key as keyof Document] ? (
                        <LookupCellDropdown
                          docId={doc.id}
                          colKey={col.key}
                          value={doc[col.key as keyof Document] as string}
                          lookupType={LOOKUP_COL_MAP[col.key as keyof Document]!}
                          width={col.width}
                          onSave={updateDocField}
                        />
                      ) : (
                        <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A] block truncate">
                          {doc[col.key as keyof Document] as string}
                        </span>
                      )}
                    </div>
                    {ci < visibleColumns.length - 1 && (
                      <div className="w-px h-full bg-transparent flex-shrink-0 mx-2" />
                    )}
                  </div>
                ))}
                <div className="flex flex-row items-center gap-1 ml-2 flex-shrink-0 w-[200px]">
                  <button
                    onClick={() => setOpenDoc(doc)}
                    className="flex items-center justify-center px-2 py-1 border-2 border-[#D3E1EC] rounded bg-white hover:border-[#007EA7] transition-colors">
                    <span className="font-montserrat font-semibold text-[12px] leading-4 text-[#7288A3] whitespace-nowrap">Open document</span>
                  </button>
                  <button
                    title="Duplicate document"
                    onClick={() => { setDuplicateSource(doc); setShowCreateModal(true); }}
                    className="flex items-center justify-center p-1 border-2 border-[#D3E1EC] rounded bg-white hover:border-[#007EA7] hover:text-[#007EA7] transition-colors"
                  >
                    <Copy size={13} className="text-[#7288A3]" />
                  </button>
                  <button className="flex items-center justify-center px-2 py-1 border-2 border-[#D3E1EC] rounded bg-white">
                    <span className="font-montserrat font-semibold text-[12px] leading-4 text-[#7288A3] whitespace-nowrap">Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}
      </div>

      <HorizontalTableScrollbar scrollRef={tableRef} />

      {/* Pagination */}
      <div className="flex flex-row items-center justify-between mt-2">
        {/* Page numbers */}
        <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={totalDocs} itemsPerPage={itemsPerPage} onPageChange={goToPage} />

        {/* Items info + per page selector */}
        <div className="flex flex-row items-center gap-3.5">
          <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap">
            {startIdx + 1}–{endIdx} from {totalDocs} items
          </span>
          {itemsPerPage === 8 ? (
            <button
              onClick={() => changeItemsPerPage(15)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 border-2 border-[#D3E1EC] rounded-md bg-white hover:border-[#007EA7] transition-colors"
            >
              <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">
                Show more
              </span>
            </button>
          ) : (
            <button
              onClick={() => changeItemsPerPage(8)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 border-2 border-[#D3E1EC] rounded-md bg-white hover:border-[#007EA7] transition-colors"
            >
              <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">
                Default
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Column settings overlay + panel */}
      {showColumnPanel && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowColumnPanel(false)}
          />
          <ColumnSettingsPanel
            columns={activeColumns}
            onSave={cols => setActiveColumns(cols)}
            onClose={() => setShowColumnPanel(false)}
          />
        </>
      )}

      {/* Upload document panel */}
      {showUploadPanel && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10"
            onClick={() => setShowUploadPanel(false)}
          />
          <div
            className="fixed top-0 right-0 h-full z-50 flex flex-col bg-white overflow-y-auto"
            style={{ width: 340, boxShadow: '-2px 0px 0px #E5EDF9', padding: '24px 24px 32px', gap: 24, display: 'flex' }}
          >
            {/* Header */}
            <div className="flex flex-row justify-between items-center gap-2 flex-shrink-0">
              <div className="flex flex-row items-center gap-1">
                <span className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">Upload new file</span>
                <AlertCircle size={24} className="text-[#A1B6C6] flex-shrink-0" />
              </div>
              <button onClick={() => setShowUploadPanel(false)}>
                <X size={24} className="text-[#7288A3] hover:text-[#10233A] transition-colors" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-8 flex-1">
              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  const files = Array.from(e.dataTransfer.files);
                  if (files.length) setUploadFiles(prev => [...prev, ...files]);
                }}
                className="flex flex-col items-center justify-center gap-6 rounded-lg cursor-pointer transition-colors"
                style={{
                  padding: 32,
                  border: `1px dashed ${dragOver ? '#007EA7' : '#7288A3'}`,
                  background: dragOver ? '#F0F9FF' : '#FFFFFF',
                  minHeight: 164,
                }}
              >
                <Upload size={28} className="text-[#7288A3] flex-shrink-0" />
                <span className="font-montserrat font-medium italic text-[16px] leading-6 text-[#7288A3] text-center">
                  {uploadFiles.length > 0
                    ? uploadFiles.map(f => f.name).join(', ')
                    : 'Click to browse files or drag & drop files here'}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) setUploadFiles(prev => [...prev, ...files]);
                  e.target.value = '';
                }}
              />

              {/* Selects */}
              <div className="flex flex-col gap-6">
                {/* Document type */}
                <div className="flex flex-col gap-2">
                  <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#10233A]">Document type</span>
                  <div className="flex flex-row justify-between items-center px-[14px] py-[11px] border border-[#D3E1EC] rounded-lg bg-white cursor-pointer">
                    <span className={`font-montserrat font-medium text-[14px] leading-5 ${uploadDocType ? 'text-[#10233A]' : 'text-[#A1B6C6]'}`}>
                      {uploadDocType || 'Select document type'}
                    </span>
                    <ChevronDown size={16} className="text-[#7288A3] flex-shrink-0" />
                  </div>
                </div>

                {/* Company */}
                <div className="flex flex-col gap-2">
                  <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#10233A]">Company</span>
                  <div className="flex flex-row justify-between items-center px-[14px] py-[11px] border border-[#D3E1EC] rounded-lg bg-white cursor-pointer">
                    <span className={`font-montserrat font-medium text-[14px] leading-5 ${uploadCompany ? 'text-[#10233A]' : 'text-[#A1B6C6]'}`}>
                      {uploadCompany || 'Select company'}
                    </span>
                    <ChevronDown size={16} className="text-[#7288A3] flex-shrink-0" />
                  </div>
                </div>

                {/* Date period */}
                <div className="flex flex-col gap-2">
                  <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#10233A]">Operation type</span>
                  <div className="flex flex-row justify-between items-center px-[14px] py-[11px] border border-[#D3E1EC] rounded-lg bg-white cursor-pointer">
                    <span className={`font-montserrat font-medium text-[14px] leading-5 ${uploadDatePeriod ? 'text-[#10233A]' : 'text-[#A1B6C6]'}`}>
                      {uploadDatePeriod || 'Select operation type'}
                    </span>
                    <ChevronDown size={16} className="text-[#7288A3] flex-shrink-0" />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-4 mt-auto">
                <button
                  disabled={uploadFiles.length === 0}
                  className="flex flex-row justify-center items-center px-4 py-[9px] rounded-lg font-montserrat font-semibold text-[16px] leading-6 transition-colors"
                  style={{
                    background: uploadFiles.length > 0 ? '#007EA7' : '#F5F5F5',
                    color: uploadFiles.length > 0 ? '#FFFFFF' : '#B4B6B8',
                  }}
                >
                  Upload document
                </button>
                <button
                  onClick={() => setShowUploadPanel(false)}
                  className="flex flex-row justify-center items-center px-4 py-[9px] rounded-lg font-montserrat font-semibold text-[16px] leading-6 border-2 border-[#D3E1EC] bg-white text-[#7288A3] hover:border-[#7288A3] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {openDoc && (
        <DocumentDetailPanel
          doc={openDoc}
          onClose={() => setOpenDoc(null)}
          onImageUpload={(docId, imageUrl) => {
            setDocs(prev => prev.map(d => d.id === docId ? { ...d, imageUrl } : d));
            setOpenDoc(prev => prev && prev.id === docId ? { ...prev, imageUrl } : prev);
          }}
        />
      )}

      {/* Export drawer */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setExportOpen(false)}>
          <div
            className="relative h-full w-[340px] bg-white flex flex-col gap-6 px-6 pt-6 pb-8 overflow-y-auto"
            style={{ boxShadow: '-2px 0px 0px #E5EDF9' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-row justify-between items-center">
              <span className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">IMPORT</span>
              <button onClick={() => setExportOpen(false)} className="text-[#7288A3] hover:text-[#10233A] transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 bg-[#F2F5F9] rounded-lg p-3">
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Records to export', value: sortedDocs.length.toLocaleString() },
                    { label: 'Visible columns', value: visibleColumns.length.toLocaleString() },
                  ].map(item => (
                    <div key={item.label} className="flex flex-col">
                      <span className="font-montserrat font-semibold text-[12px] leading-[140%] text-[#10233A]">{item.label}</span>
                      <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A] mt-[2px]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">File format type <span className="text-red-500">*</span></span>
                <div className="relative">
                  <select
                    value={exportFormat}
                    onChange={e => setExportFormat(e.target.value)}
                    className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg appearance-none font-montserrat font-medium text-[14px] leading-[140%] text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                  >
                    <option value="" disabled>Select format</option>
                    <option value="csv">CSV</option>
                    <option value="xlsx">XLSX</option>
                    <option value="pdf">PDF</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#7288A3] pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-auto">
              <button data-system-action="true"
                className="w-full h-[42px] flex items-center justify-center bg-[#007EA7] rounded-lg hover:bg-[#006b8f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleExport}
                disabled={!exportFormat}
              >
                <span className="font-montserrat font-semibold text-[16px] leading-6 text-white">IMPORT</span>
              </button>
              <button onClick={() => setExportOpen(false)} className="w-full h-[42px] flex items-center justify-center bg-white border-2 border-[#D3E1EC] rounded-lg hover:border-[#007EA7] transition-colors">
                <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#7288A3]">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateDocumentModal
          companyId={companyId}
          initialData={duplicateSource ? {
            status: 'Draft',
            clientCounterparty: duplicateSource.clientCounterparty,
            documentType: duplicateSource.documentType,
            source: '',
            totalAmount: duplicateSource.totalAmount,
            dueEndDate: duplicateSource.dueEndDate,
            orderNo: '',
            number: '',
            type: duplicateSource.type,
            documentDate: duplicateSource.documentDate,
            documentPurpose: duplicateSource.documentPurpose,
            invoiceContractDate: duplicateSource.invoiceContractDate,
            operationDate: duplicateSource.operationDate,
            expenseAccount: duplicateSource.expenseAccount,
            vatClassifier: duplicateSource.vatClassifier,
            currency: duplicateSource.currency,
            amountWithoutVat: duplicateSource.amountWithoutVat,
            vat: duplicateSource.vat,
            vatPercent: duplicateSource.vatPercent,
            departmentCode: duplicateSource.departmentCode,
            objectProject: duplicateSource.objectProject,
            validForm: duplicateSource.validForm,
            accountableResponsible: duplicateSource.accountableResponsible,
            costCenter: duplicateSource.costCenter,
            series: duplicateSource.series,
          } : undefined}
          onClose={() => { setShowCreateModal(false); setDuplicateSource(null); }}
          onCreated={() => {
            setShowCreateModal(false);
            setDuplicateSource(null);
            supabase
              .from('documents')
              .select('*')
              .eq('company_id', companyId)
              .then(({ data }) => {
                if (data) setDocs(data.map(mapRow));
              });
          }}
        />
      )}
    </div>
  );
}
