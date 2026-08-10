import { useRef, useState } from 'react';
import { RefreshCw, ChevronDown, Paperclip } from 'lucide-react';
import InvoiceDetailView from './InvoiceDetailView';
import CreateInvoicePanel from './CreateInvoicePanel';
import ColumnSettingsPanel, { type ColConfig } from '../ColumnSettingsPanel';
import { PageActionButton, PageHeader } from '../PageHeader';
import HorizontalTableScrollbar from '../HorizontalTableScrollbar';
import TablePagination from '../TablePagination?v=4-footer';
import { useColumnResize, ResizeHandle } from '../useColumnResize';
import { ColumnSettingsButton } from '../ScopedActionButtons';
import ImportButton from '../ImportButton';
import ColumnSortButton, { useMultiColumnSort } from '../ColumnSortButton';
import OcrSearchField from '../OcrSearchField';

const DEFAULT_COLUMNS: ColConfig[] = [
  { key: 'date', label: 'Date', width: 100, visible: true },
  { key: 'number', label: 'Number', width: 110, visible: true },
  { key: 'type', label: 'Type', width: 80, visible: true },
  { key: 'series', label: 'Series', width: 60, visible: true },
  { key: 'buyer', label: 'Buyer', width: 160, visible: true },
  { key: 'seller', label: 'Seller', width: 140, visible: true },
  { key: 'netAmount', label: 'Net', width: 100, visible: true },
  { key: 'vatAmount', label: 'VAT', width: 90, visible: true },
  { key: 'totalAmount', label: 'Total', width: 110, visible: true },
  { key: 'status', label: 'Status', width: 80, visible: true },
  { key: 'hasAttachment', label: 'Attachment', width: 40, visible: true },
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
}

const SAMPLE_INVOICES: InvoiceRow[] = [
  { id: '1', date: '2024-01-15', number: 'INV-001', type: 'Sales', series: 'SER', buyer: 'UAB Baltic Group', seller: 'SDK Finance', netAmount: 1250.00, vatAmount: 262.50, totalAmount: 1512.50, currency: 'EUR', dueDate: '2024-02-15', status: 'Processed', hasAttachment: true, paymentMethod: 'Bank transfer', notes: '' },
  { id: '2', date: '2024-01-18', number: 'INV-002', type: 'Sales', series: 'SER', buyer: 'MB Digital Solutions', seller: 'SDK Finance', netAmount: 3400.00, vatAmount: 714.00, totalAmount: 4114.00, currency: 'EUR', dueDate: '2024-02-18', status: 'Pending', hasAttachment: false, paymentMethod: 'Bank transfer', notes: 'Waiting for approval' },
  { id: '3', date: '2024-01-20', number: 'INV-003', type: 'Purchase', series: 'PUR', buyer: 'SDK Finance', seller: 'Office Supplies Ltd', netAmount: 450.00, vatAmount: 94.50, totalAmount: 544.50, currency: 'EUR', dueDate: '2024-02-20', status: 'Processed', hasAttachment: true, paymentMethod: 'Card', notes: '' },
  { id: '4', date: '2024-01-22', number: 'INV-004', type: 'Sales', series: 'SER', buyer: 'UAB TechVision', seller: 'SDK Finance', netAmount: 8900.00, vatAmount: 1869.00, totalAmount: 10769.00, currency: 'EUR', dueDate: '2024-02-22', status: 'Draft', hasAttachment: false, paymentMethod: 'Bank transfer', notes: 'Draft version' },
  { id: '5', date: '2024-01-25', number: 'INV-005', type: 'Purchase', series: 'PUR', buyer: 'SDK Finance', seller: 'CloudHost Services', netAmount: 199.00, vatAmount: 41.79, totalAmount: 240.79, currency: 'EUR', dueDate: '2024-02-25', status: 'Declined', hasAttachment: false, paymentMethod: 'Bank transfer', notes: 'Incorrect amount' },
  { id: '6', date: '2024-01-28', number: 'INV-006', type: 'Sales', series: 'SER', buyer: 'AB Fintech Group', seller: 'SDK Finance', netAmount: 5600.00, vatAmount: 1176.00, totalAmount: 6776.00, currency: 'EUR', dueDate: '2024-02-28', status: 'Processed', hasAttachment: true, paymentMethod: 'Bank transfer', notes: '' },
  { id: '7', date: '2024-02-01', number: 'INV-007', type: 'Sales', series: 'SER', buyer: 'UAB Marketing Pro', seller: 'SDK Finance', netAmount: 2100.00, vatAmount: 441.00, totalAmount: 2541.00, currency: 'EUR', dueDate: '2024-03-01', status: 'Pending', hasAttachment: false, paymentMethod: 'Bank transfer', notes: '' },
  { id: '8', date: '2024-02-05', number: 'INV-008', type: 'Purchase', series: 'PUR', buyer: 'SDK Finance', seller: 'Legal Advisors LLP', netAmount: 1800.00, vatAmount: 378.00, totalAmount: 2178.00, currency: 'EUR', dueDate: '2024-03-05', status: 'Processed', hasAttachment: true, paymentMethod: 'Bank transfer', notes: '' },
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
  const totalPages = 5;
  const visibleColumns = columns.filter(column => column.visible);
  const { sortedRows, changeSort, directionFor } = useMultiColumnSort(SAMPLE_INVOICES, (invoice, key) => invoice[key as keyof InvoiceRow] as string | number | boolean);

  if (selectedInvoice) {
    return <InvoiceDetailView invoice={selectedInvoice} onBack={() => setSelectedInvoice(null)} />;
  }

  const salesTotal = SAMPLE_INVOICES.filter(i => i.type === 'Sales').reduce((sum, i) => sum + i.totalAmount, 0);
  const purchaseTotal = SAMPLE_INVOICES.filter(i => i.type === 'Purchase').reduce((sum, i) => sum + i.totalAmount, 0);

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
    if (key === 'status') return <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[invoice.status] }} /><span>{invoice.status}</span></div>;
    if (key === 'hasAttachment') return invoice.hasAttachment ? <Paperclip size={12} className="text-[#7288A3]" /> : null;
    if (key === 'netAmount' || key === 'vatAmount' || key === 'totalAmount') return invoice[key].toFixed(2);
    return String(invoice[key as keyof InvoiceRow] ?? '—');
  };

  return (
    <div className="relative flex min-h-full min-w-0 flex-col gap-8 bg-white px-4 py-14 sm:px-8 lg:px-[72px]">
      {/* Header */}
      <PageHeader title="Invoices" actions={<PageActionButton onClick={() => setShowCreatePanel(true)}>Create VAT invoice</PageActionButton>} />

      {/* Summary cards */}
      <div className="flex flex-row gap-4 flex-shrink-0">
        <div className="flex min-w-[200px] flex-col gap-1 rounded-2xl border border-[#E6F2F6] bg-white px-5 py-4">
          <span className="font-montserrat font-medium text-[11px] leading-4 text-[#7288A3] uppercase tracking-wide">Sales invoices</span>
          <span className="font-montserrat font-semibold text-[20px] leading-7 text-[#10233A]">{salesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} EUR</span>
        </div>
        <div className="flex min-w-[200px] flex-col gap-1 rounded-2xl border border-[#E6F2F6] bg-white px-5 py-4">
          <span className="font-montserrat font-medium text-[11px] leading-4 text-[#7288A3] uppercase tracking-wide">Purchase invoices</span>
          <span className="font-montserrat font-semibold text-[20px] leading-7 text-[#10233A]">{purchaseTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} EUR</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-row flex-wrap justify-between items-center gap-2 flex-shrink-0">
        <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
          <OcrSearchField ariaLabel="Search invoices" />
          <button className="flex items-center gap-1 px-2 py-[5px] h-7 bg-[#E5EDF9] rounded">
            <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Type</span>
            <ChevronDown size={12} className="text-[#7288A3]" />
          </button>
          <button className="flex items-center gap-1 px-2 py-[5px] h-7 bg-[#E5EDF9] rounded">
            <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Status</span>
            <ChevronDown size={12} className="text-[#7288A3]" />
          </button>
          <button className="flex items-center gap-1 px-2 py-[5px] h-7 bg-[#E5EDF9] rounded">
            <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Date range</span>
            <ChevronDown size={12} className="text-[#7288A3]" />
          </button>
        </div>
        <div className="flex flex-row items-center p-[6px] gap-4 flex-shrink-0">
          <ColumnSettingsButton onClick={() => setShowColumnSettings(true)} />
          <ImportButton scope="Invoices" />
          <button type="button" className="w-4 h-4 flex items-center justify-center text-[#7288A3] hover:text-[#007EA7] transition-colors" title="REFRESH ALL">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div ref={tableScrollRef} className="flex flex-1 flex-col overflow-x-auto scrollbar-hide">
        <div className="min-w-max">
          <div className="mb-1 flex h-5 items-center gap-0 pl-3 pr-2">
            <div className="flex w-[30px] flex-shrink-0 items-center">
              <input type="checkbox" checked={selectedRows.size === SAMPLE_INVOICES.length} onChange={toggleAll} className="h-[18px] w-[18px] cursor-pointer rounded border border-[#A1B6C6] accent-[#007EA7]" />
            </div>
            {visibleColumns.map((column, index) => {
              const realIndex = columns.findIndex(item => item.key === column.key);
              return <div key={column.key} className="relative flex flex-shrink-0 items-center gap-1 font-montserrat text-[12px] font-medium text-[#7288A3]" style={{ width: column.width }}>{column.key === 'hasAttachment' ? <Paperclip size={14} /> : column.label}<ColumnSortButton columnLabel={column.label} direction={directionFor(column.key)} onDirectionChange={direction => { changeSort(column.key, direction); setCurrentPage(1); }} /><ResizeHandle onMouseDown={(event) => startResize(realIndex, event)} /></div>;
            })}
          </div>
          {sortedRows.map((row, rowIndex) => (
            <div key={row.id} onClick={() => setSelectedInvoice(row)} className={`group flex h-9 cursor-pointer items-center gap-0 rounded-lg pl-3 pr-2 transition-colors hover:bg-[#EEF6FA] ${rowIndex % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'}`}>
              <div className="flex w-[30px] flex-shrink-0 items-center">
                <input type="checkbox" checked={selectedRows.has(row.id)} onClick={event => event.stopPropagation()} onChange={() => toggleRow(row.id)} className="h-[18px] w-[18px] cursor-pointer rounded border border-[#A1B6C6] accent-[#007EA7]" />
              </div>
              {visibleColumns.map(column => <div key={column.key} className="flex flex-shrink-0 items-center overflow-hidden font-montserrat text-[12px] text-[#10233A]" style={{ width: column.width }}><div className="min-w-0 truncate">{invoiceCell(row, column.key)}</div></div>)}
            </div>
          ))}
        </div>
      </div>

      <HorizontalTableScrollbar scrollRef={tableScrollRef} />

      {/* Pagination */}
      <div className="flex flex-row items-center justify-between flex-shrink-0 pt-2">
        <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={SAMPLE_INVOICES.length} onPageChange={setCurrentPage} />
        <div className="flex flex-row items-center gap-3.5">
          <span className="whitespace-nowrap font-montserrat text-[12px] font-normal leading-[18px] text-[#7288A3]">
            1–{SAMPLE_INVOICES.length} from {SAMPLE_INVOICES.length * totalPages} items
          </span>
          <button type="button" className="flex items-center justify-center gap-1.5 rounded-md border-2 border-[#D3E1EC] bg-white px-3 py-1.5 transition-colors hover:border-[#007EA7]">
            <span className="font-montserrat text-[14px] font-semibold leading-5 text-[#7288A3]">Show more</span>
          </button>
        </div>
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
