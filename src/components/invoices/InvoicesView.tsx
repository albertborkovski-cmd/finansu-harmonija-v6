import { useRef, useState } from 'react';
import { RefreshCw, ChevronDown, MoreVertical, Paperclip, Plus, Upload } from 'lucide-react';
import InvoiceDetailView from './InvoiceDetailView';
import CreateInvoicePanel from './CreateInvoicePanel';
import ColumnSettingsPanel, { type ColConfig } from '../ColumnSettingsPanel';
import { PageActionButton, PageHeader } from '../PageHeader';
import HorizontalTableScrollbar from '../HorizontalTableScrollbar';
import TablePagination from '../TablePagination?v=4-footer';
import { useColumnResize, ResizeHandle } from '../useColumnResize';
import { ColumnSettingsButton } from '../ScopedActionButtons';
import ColumnSortButton, { useMultiColumnSort } from '../ColumnSortButton';
import OcrSearchField from '../OcrSearchField';

const DEFAULT_COLUMNS: ColConfig[] = [
  { key: 'date', label: 'Invoice date', width: 112, visible: true },
  { key: 'invoiceType', label: 'Invoice type', width: 105, visible: true },
  { key: 'number', label: 'Number', width: 105, visible: true },
  { key: 'createdBy', label: 'Created by', width: 120, visible: true },
  { key: 'receivedBy', label: 'Received by', width: 105, visible: true },
  { key: 'client', label: 'Client', width: 145, visible: true },
  { key: 'netAmount', label: 'Subtotal', width: 92, visible: true },
  { key: 'vatAmount', label: 'VAT', width: 82, visible: true },
  { key: 'vatPercent', label: 'VAT %', width: 72, visible: true },
  { key: 'totalAmount', label: 'Total', width: 92, visible: true },
  { key: 'dueDate', label: 'Due date', width: 82, visible: true },
  { key: 'orderNumber', label: 'Order Number', width: 108, visible: true },
  { key: 'division', label: 'Division', width: 90, visible: true },
  { key: 'object', label: 'Object', width: 90, visible: true },
  { key: 'series', label: 'Series', width: 90, visible: true },
  { key: 'center', label: 'Center', width: 90, visible: true },
  { key: 'accountablePerson', label: 'Accountable person', width: 125, visible: true },
  { key: 'gl', label: 'GL', width: 85, visible: true },
  { key: 'vatCode', label: 'VAT Code', width: 90, visible: true },
  { key: 'fileName', label: 'File', width: 120, visible: true },
  { key: 'status', label: 'Status', width: 135, visible: true },
  { key: 'actions', label: '', width: 115, visible: true },
];

type InvoiceStatus = 'Processed' | 'Pending' | 'Draft' | 'Declined';

interface InvoiceRow {
  id: string;
  date: string;
  number: string;
  type: 'Sales' | 'Purchase';
  series: string;
  buyer: string;
  seller: string;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  dueDate: string;
  status: InvoiceStatus;
  hasAttachment: boolean;
  paymentMethod: string;
  notes: string;
  invoiceType: string;
  createdBy: string;
  receivedBy: string;
  client: string;
  vatPercent: string;
  orderNumber: string;
  division: string;
  object: string;
  center: string;
  accountablePerson: string;
  gl: string;
  vatCode: string;
  fileName: string;
}

const SAMPLE_INVOICES: InvoiceRow[] = [
  { id: '1', date: '11.12.2025', number: 'TTP0009470', type: 'Sales', invoiceType: 'VAT Invoice', series: '—', buyer: 'Clairelita, UAB', seller: 'Name Surname', createdBy: 'Name Surname', receivedBy: 'Email', client: 'Clairelita, UAB', netAmount: 1816, vatAmount: 381.36, vatPercent: '21%', totalAmount: 2197.36, currency: 'EUR', dueDate: '—', orderNumber: '—', division: '—', object: '—', center: '—', accountablePerson: '—', gl: 'Kita', vatCode: 'PVM1', fileName: 'TTP0009470.pdf', status: 'Pending', hasAttachment: true, paymentMethod: 'Bank transfer', notes: '' },
  { id: '2', date: '11.12.2025', number: 'TTP0009470', type: 'Sales', invoiceType: 'VAT Invoice', series: '—', buyer: 'Clairelita, UAB', seller: 'Name Surname', createdBy: 'Name Surname', receivedBy: 'Email', client: 'Clairelita, UAB', netAmount: 1816, vatAmount: 381.36, vatPercent: '21%', totalAmount: 2197.36, currency: 'EUR', dueDate: '—', orderNumber: '—', division: '—', object: '—', center: '—', accountablePerson: '—', gl: 'Kita', vatCode: 'PVM1', fileName: 'TTP0009470.pdf', status: 'Pending', hasAttachment: true, paymentMethod: 'Bank transfer', notes: '' },
];

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  Processed: '#0ED8A8',
  Pending: '#EEB648',
  Draft: '#D3E1EC',
  Declined: '#FF4550',
};

export default function InvoicesView() {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columns, setColumns] = useState<ColConfig[]>(DEFAULT_COLUMNS);
  const { startResize } = useColumnResize(columns, setColumns);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.ceil(15000 / 14);
  const visibleColumns = columns.filter(column => column.visible);
  const { sortedRows, changeSort, directionFor } = useMultiColumnSort(SAMPLE_INVOICES, (invoice, key) => invoice[key as keyof InvoiceRow] as string | number | boolean);

  if (selectedInvoice) {
    return <InvoiceDetailView invoice={selectedInvoice} onBack={() => setSelectedInvoice(null)} />;
  }

  const salesTotal = 10894;
  const purchaseTotal = 10894;

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === SAMPLE_INVOICES.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(SAMPLE_INVOICES.map(i => i.id)));
    }
  };

  const invoiceCell = (invoice: InvoiceRow, key: string) => {
    if (key === 'status') return <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[invoice.status] }} /><span>Pending payment</span></div>;
    if (key === 'hasAttachment') return invoice.hasAttachment ? <Paperclip size={12} className="text-[#7288A3]" /> : null;
    if (key === 'netAmount' || key === 'vatAmount' || key === 'totalAmount') return `${invoice[key].toLocaleString('en-US', { minimumFractionDigits: 2 })} €`;
    if (key === 'division' || key === 'object' || key === 'series' || key === 'center' || key === 'accountablePerson' || key === 'gl' || key === 'vatCode') {
      return <button type="button" onClick={event => event.stopPropagation()} className="flex h-7 w-[calc(100%-8px)] items-center justify-between rounded-md border border-[#D3E1EC] bg-white px-2 text-[#10233A]"><span className="truncate">{String(invoice[key])}</span><ChevronDown size={12} className="flex-shrink-0 text-[#7288A3]" /></button>;
    }
    if (key === 'number' || key === 'fileName') return <button type="button" onClick={event => event.stopPropagation()} className="truncate text-[#007EA7] underline decoration-[#007EA7]/40 underline-offset-2">{String(invoice[key])}</button>;
    if (key === 'actions') return <div className="flex items-center gap-1"><button type="button" onClick={event => { event.stopPropagation(); setSelectedInvoice(invoice); }} className="h-7 rounded-md border border-[#D3E1EC] bg-white px-2 text-[#7288A3] hover:border-[#007EA7]">View invoice</button><button type="button" aria-label="Invoice actions" onClick={event => event.stopPropagation()} className="flex h-7 w-7 items-center justify-center rounded-md border border-[#D3E1EC] bg-white text-[#7288A3]"><MoreVertical size={14} /></button></div>;
    return String(invoice[key as keyof InvoiceRow] ?? '—');
  };

  return (
    <div className="relative flex min-h-full min-w-0 flex-col gap-5 bg-white px-4 py-10 sm:px-8 lg:px-[56px]">
      {/* Header */}
      <PageHeader
        title="Invoices"
        className="!min-h-[42px]"
        actions={<><PageActionButton onClick={() => setShowCreatePanel(true)}>Create invoice</PageActionButton><PageActionButton onClick={() => setShowCreatePanel(true)}>Create credit note</PageActionButton></>}
      />

      {/* Summary */}
      <div className="flex h-[74px] flex-shrink-0 items-center rounded-lg border border-[#D3E1EC] bg-white px-3">
        <div className="flex h-[44px] w-full items-center gap-10 rounded bg-[#F3F6FC] px-3">
          <div className="flex flex-col">
            <span className="font-montserrat text-[11px] font-medium leading-4 text-[#10233A]">Sales invoices</span>
            <span className="font-montserrat text-[11px] leading-4 text-[#10233A]">€{salesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-montserrat text-[11px] font-medium leading-4 text-[#10233A]">Purchase invoices</span>
            <span className="font-montserrat text-[11px] leading-4 text-[#10233A]">€{purchaseTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-shrink-0 flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-row flex-wrap items-center gap-1.5">
          <FilterChip label="Show: All invoices" removable />
          <FilterChip label="Period" />
          <FilterChip label="Company" />
          <FilterChip label="Currency" />
          <FilterChip label="Status" />
          <OcrSearchField ariaLabel="Search invoices" className="!w-[220px] !min-w-[220px] !max-w-[220px]" />
          <button type="button" className="flex h-7 items-center gap-1 rounded bg-[#E5EDF9] px-2 font-montserrat text-[12px] font-medium text-[#7288A3]"><Plus size={13} />Add filter</button>
          <button type="button" className="h-7 px-2 font-montserrat text-[12px] font-medium text-[#7288A3]">Clear filters</button>
        </div>
        <div className="flex flex-shrink-0 flex-row items-center gap-4 p-[6px]">
          <ColumnSettingsButton onClick={() => setShowColumnSettings(true)} />
          <button type="button" title="EXPORT" className="flex h-4 w-4 items-center justify-center text-[#7288A3] hover:text-[#007EA7]"><Upload size={16} /></button>
          <button type="button" className="w-4 h-4 flex items-center justify-center text-[#7288A3] hover:text-[#007EA7] transition-colors" title="REFRESH ALL">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div ref={tableScrollRef} className="flex flex-1 flex-col overflow-x-auto scrollbar-hide">
        <div className="min-w-max">
          <div className="mb-1 flex h-7 items-center gap-0 border-b border-[#E5EDF9] pl-3 pr-2">
            <div className="flex w-[30px] flex-shrink-0 items-center">
              <input type="checkbox" checked={selectedRows.size === SAMPLE_INVOICES.length} onChange={toggleAll} className="h-[18px] w-[18px] cursor-pointer rounded border border-[#A1B6C6] accent-[#007EA7]" />
            </div>
            {visibleColumns.map((column, index) => {
              const realIndex = columns.findIndex(item => item.key === column.key);
              return <div key={column.key} className="relative flex flex-shrink-0 items-center gap-1 whitespace-nowrap pr-3 font-montserrat text-[11px] font-medium text-[#7288A3]" style={{ width: column.width }}>{column.label && <>{column.label}<ColumnSortButton columnLabel={column.label} direction={directionFor(column.key)} onDirectionChange={direction => { changeSort(column.key, direction); setCurrentPage(1); }} /></>}<ResizeHandle onMouseDown={(event) => startResize(realIndex, event)} /></div>;
            })}
          </div>
          {sortedRows.map((row, rowIndex) => (
            <div key={row.id} className={`group flex h-9 items-center gap-0 rounded-lg pl-3 pr-2 transition-colors hover:bg-[#EEF6FA] ${rowIndex % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'}`}>
              <div className="flex w-[30px] flex-shrink-0 items-center">
                <input type="checkbox" checked={selectedRows.has(row.id)} onClick={event => event.stopPropagation()} onChange={() => toggleRow(row.id)} className="h-[18px] w-[18px] cursor-pointer rounded border border-[#A1B6C6] accent-[#007EA7]" />
              </div>
              {visibleColumns.map(column => <div key={column.key} className="flex flex-shrink-0 items-center overflow-hidden pr-1 font-montserrat text-[11px] text-[#10233A]" style={{ width: column.width }}><div className="min-w-0 w-full truncate">{invoiceCell(row, column.key)}</div></div>)}
            </div>
          ))}
        </div>
      </div>

      <HorizontalTableScrollbar scrollRef={tableScrollRef} />

      {/* Pagination */}
      <div className="flex flex-row items-center justify-between flex-shrink-0 pt-2">
        <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={15000} itemsPerPage={14} onPageChange={setCurrentPage} />
      </div>

      {/* Create Invoice Panel */}
      {showCreatePanel && (
        <CreateInvoicePanel onClose={() => setShowCreatePanel(false)} />
      )}

      {/* Column Settings Panel */}
      {showColumnSettings && (
        <ColumnSettingsPanel
          columns={columns}
          onSave={(cols) => setColumns(cols)}
          onClose={() => setShowColumnSettings(false)}
        />
      )}
    </div>
  );
}

function FilterChip({ label, removable = false }: { label: string; removable?: boolean }) {
  return (
    <button type="button" className="flex h-7 items-center gap-1 rounded bg-[#E5EDF9] px-2 font-montserrat text-[12px] font-medium text-[#7288A3]">
      <span>{label}</span>
      {removable ? <span aria-hidden="true" className="text-[14px] leading-none">×</span> : <ChevronDown size={12} />}
    </button>
  );
}
