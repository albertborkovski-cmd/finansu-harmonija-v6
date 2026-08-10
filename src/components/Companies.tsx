import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronUp, X, Search, Download, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, type Company } from '../lib/supabase';
import { useColumnResize, ResizeHandle } from './useColumnResize';
import ColumnSettingsPanel, { type ColConfig } from './ColumnSettingsPanel';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import { ColumnSettingsButton, SaveButton } from './ScopedActionButtons';
import ColumnSortButton, { useMultiColumnSort } from './ColumnSortButton';
import { PageActionButton, PageHeader } from './PageHeader';
import ImportButton from './ImportButton';

const ROWS_PER_PAGE = 4;

const FALLBACK_COMPANIES: Company[] = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'John Brick', company_code: 'ec6940fg5698', vat_code: 'ec6940fg5698', client_since: 2019, action_required: 0 },
  { id: '00000000-0000-4000-8000-000000000002', name: 'Alice Stone', company_code: 'ab1234cd5678', vat_code: 'ab1234cd5678', client_since: 2021, action_required: 3 },
  { id: '00000000-0000-4000-8000-000000000003', name: 'Bob Morris', company_code: 'xy9876zw5432', vat_code: 'xy9876zw5432', client_since: 2020, action_required: 1 },
  { id: '00000000-0000-4000-8000-000000000004', name: 'Carol White', company_code: 'mn3456op7890', vat_code: 'mn3456op7890', client_since: 2022, action_required: 0 },
  { id: '00000000-0000-4000-8000-000000000005', name: 'David Lane', company_code: 'qr2345st6789', vat_code: 'qr2345st6789', client_since: 2018, action_required: 2 },
  { id: '00000000-0000-4000-8000-000000000006', name: 'Emma Clarke', company_code: 'gh5678ij9012', vat_code: 'gh5678ij9012', client_since: 2023, action_required: 0 },
  { id: '00000000-0000-4000-8000-000000000007', name: 'Frank Hughes', company_code: 'cd3456ef7890', vat_code: 'cd3456ef7890', client_since: 2017, action_required: 5 },
  { id: '00000000-0000-4000-8000-000000000008', name: 'Grace Kim', company_code: 'wx8901yz2345', vat_code: 'wx8901yz2345', client_since: 2022, action_required: 0 },
  { id: '00000000-0000-4000-8000-000000000009', name: 'Henry Ford', company_code: 'op4567qr8901', vat_code: 'op4567qr8901', client_since: 2020, action_required: 1 },
  { id: '00000000-0000-4000-8000-000000000010', name: 'Iris Taylor', company_code: 'ij0123kl4567', vat_code: 'ij0123kl4567', client_since: 2021, action_required: 0 },
  { id: '00000000-0000-4000-8000-000000000011', name: 'James Wilson', company_code: 'ef7890gh1234', vat_code: 'ef7890gh1234', client_since: 2019, action_required: 3 },
  { id: '00000000-0000-4000-8000-000000000012', name: 'Karen Scott', company_code: 'st2345uv6789', vat_code: 'st2345uv6789', client_since: 2023, action_required: 0 },
  { id: '00000000-0000-4000-8000-000000000013', name: 'Leo Nolan', company_code: 'uv6789wx0123', vat_code: 'uv6789wx0123', client_since: 2018, action_required: 2 },
  { id: '00000000-0000-4000-8000-000000000014', name: 'Mia Turner', company_code: 'yz4567ab8901', vat_code: 'yz4567ab8901', client_since: 2022, action_required: 0 },
  { id: '00000000-0000-4000-8000-000000000015', name: 'Noah Reed', company_code: 'bc8901de2345', vat_code: 'bc8901de2345', client_since: 2016, action_required: 7 },
];

interface ColumnDef {
  key: string;
  label: string;
  width: number;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'name',                label: 'Company name',        width: 128 },
  { key: 'company_code',        label: 'Company code',        width: 110 },
  { key: 'vat_code',            label: 'Company VAT code',    width: 130 },
  { key: 'client_since',        label: 'Client since',        width: 80  },
  { key: 'action_required',     label: 'Action required',     width: 110 },
  { key: 'company_status',      label: 'Company status',      width: 120 },
  { key: 'assigned_accountant', label: 'Assigned accountant', width: 150 },
  { key: 'company_type',        label: 'Company type',        width: 120 },
  { key: 'service_scope',       label: 'Service scope',       width: 120 },
  { key: 'phone',               label: 'Phone',               width: 120 },
  { key: 'email',               label: 'Email',               width: 160 },
  { key: 'registration_date',   label: 'Registration date',   width: 130 },
  { key: 'vat_status',          label: 'VAT status',          width: 100 },
  { key: 'country',             label: 'Country',             width: 100 },
  { key: 'address',             label: 'Address',             width: 160 },
];

const DEFAULT_VISIBLE = new Set(['name', 'company_code', 'vat_code', 'client_since', 'action_required']);
const DEFAULT_ORDER = ALL_COLUMNS.map(c => c.key);

const filterChips = [
  { label: 'Company status', hasValue: false },
  { label: 'Action required', hasValue: false },
  { label: 'Assigned accountant', hasValue: false },
  { label: 'Company type', hasValue: false },
  { label: 'Service scope', hasValue: false },
];

type SortDir = 'asc' | 'desc' | null;

function ColCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      className="w-[18px] h-[18px] rounded-[6px] flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors"
      style={{ background: checked ? '#007EA7' : '#FFFFFF', border: checked ? 'none' : '2px solid #D3E1EC' }}
      onClick={onChange}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function renderDataCell(key: string, row: Company) {
  const text = (val: string | number) => (
    <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{val}</span>
  );
  const dotCell = (val: string | number) => (
    <div className="flex flex-row items-center gap-1">
      <div className="w-[6px] h-[6px] rounded-full bg-[#FCC74D]" />
      <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{val}</span>
    </div>
  );
  switch (key) {
    case 'name':            return text(row.name);
    case 'company_code':    return text(row.company_code);
    case 'vat_code':        return text(row.vat_code);
    case 'client_since':    return dotCell(row.client_since);
    case 'action_required': return dotCell(row.action_required);
    default:                return <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3]">—</span>;
  }
}

interface CompaniesProps {
  onViewDetails?: (company: Company) => void;
}

export default function Companies({ onViewDetails }: CompaniesProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [colSettingsOpen, setColSettingsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', companyCode: '', vatCode: '', clientSince: String(new Date().getFullYear()), actionRequired: '0' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(DEFAULT_VISIBLE));
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_ORDER);
  const [columns, setColumns] = useState<ColConfig[]>(
    ALL_COLUMNS.map(c => ({ key: c.key, label: c.label, width: c.width, visible: DEFAULT_VISIBLE.has(c.key) }))
  );
  const { startResize } = useColumnResize(columns, setColumns);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('companies')
      .select('id, name, company_code, vat_code, client_since, action_required')
      .order('name', { ascending: true });
    if (fetchError) {
      setCompanies(FALLBACK_COMPANIES);
      setError(null);
    } else {
      setCompanies(data && data.length > 0 ? data : FALLBACK_COMPANIES);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleRefresh = async () => {
    if (refreshing || loading) return;
    setRefreshing(true);
    setPage(1);
    setSortDir(null);
    await fetchCompanies();
    setRefreshing(false);
  };

  const openColSettings = () => setColSettingsOpen(true);

  const createCompany = async () => {
    if (!newCompany.name.trim() || !newCompany.companyCode.trim()) {
      setCreateError('Name and company code are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    const { error: insertError } = await supabase.from('companies').insert({
      name: newCompany.name.trim(),
      company_code: newCompany.companyCode.trim(),
      vat_code: newCompany.vatCode.trim() || newCompany.companyCode.trim(),
      client_since: Number(newCompany.clientSince) || new Date().getFullYear(),
      action_required: Number(newCompany.actionRequired) || 0,
    });
    if (insertError) {
      setCreateError(insertError.message);
      setCreating(false);
      return;
    }
    await fetchCompanies();
    setCreating(false);
    setCreateOpen(false);
    setNewCompany({ name: '', companyCode: '', vatCode: '', clientSince: String(new Date().getFullYear()), actionRequired: '0' });
    setPage(1);
  };

  const saveColSettings = (nextColumns: ColConfig[]) => {
    setColumns(nextColumns);
    setColumnOrder(nextColumns.map(column => column.key));
    setVisibleColumns(new Set(nextColumns.filter(column => column.visible).map(column => column.key)));
  };

  const getCellText = (key: string, row: Company): string => {
    switch (key) {
      case 'name':            return row.name ?? '';
      case 'company_code':    return row.company_code ?? '';
      case 'vat_code':        return row.vat_code ?? '';
      case 'client_since':    return row.client_since ?? '';
      case 'action_required': return row.action_required ?? '';
      default:                return (row as Record<string, unknown>)[key]?.toString() ?? '';
    }
  };

  const handleExport = () => {
    if (!exportFormat) return;
    const cols = activeCols;
    const headers = cols.map(c => c.label);
    const dataRows = sorted.map(row => cols.map(c => getCellText(c.key, row)));

    if (exportFormat === 'csv') {
      const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const lines = [headers.map(escape).join(','), ...dataRows.map(r => r.map(escape).join(','))];
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'companies.csv'; a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'xlsx') {
      const tsv = [headers, ...dataRows].map(r => r.join('\t')).join('\n');
      const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'companies.xls'; a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'pdf') {
      const lines: string[] = [];
      lines.push('Companies Export');
      lines.push('');
      lines.push(headers.join(' | '));
      lines.push(headers.map(() => '---').join('-|-'));
      dataRows.forEach(r => lines.push(r.join(' | ')));
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'companies.txt'; a.click();
      URL.revokeObjectURL(url);
    }
    setExportOpen(false);
  };

  const scrollTable = (direction: 'left' | 'right') => {
    const el = tableScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  const handleTableScroll = () => {
    const el = tableScrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollRatio(max > 0 ? el.scrollLeft / max : 0);
  };

  const { sortedRows: sorted, changeSort, directionFor } = useMultiColumnSort(companies, (company, key) => company[key as keyof Company] as string | number | undefined);

  const totalPages = Math.ceil(sorted.length / ROWS_PER_PAGE);
  const rows = viewAll ? sorted : sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const isSpinning = refreshing || loading;
  const colMap = new Map(columns.map(c => [c.key, c]));
  const activeCols = columnOrder.map(k => colMap.get(k)!).filter(c => c && visibleColumns.has(c.key));

  return (
    <div className="flex flex-col bg-white px-9 py-14 gap-8 min-h-full" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>

      {/* Header */}
      <PageHeader title="Companies" actions={<PageActionButton onClick={() => { setCreateError(''); setCreateOpen(true); }}>Create new</PageActionButton>} />

      {/* Content */}
      <div className="flex flex-col gap-6 flex-1">

        {/* Filter bar */}
        <div className="flex-shrink-0">
          <div className="flex flex-row flex-wrap justify-between items-center gap-2">
            <div className="flex flex-row flex-wrap items-center gap-1 flex-1 min-w-0">
              {filterChips.map((chip, i) => (
                <div key={i} className="flex flex-row items-center px-2 py-[5px] gap-1 bg-[#E5EDF9] rounded h-7 flex-shrink-0">
                  <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap">
                    {chip.hasValue ? (
                      <>{chip.label} <span className="text-[#10233A]">{(chip as { value?: string }).value}</span></>
                    ) : chip.label}
                  </span>
                  {chip.hasValue
                    ? <X size={16} className="text-[#7288A3] flex-shrink-0" />
                    : <ChevronUp size={16} className="text-[#7288A3] flex-shrink-0 rotate-180" />}
                </div>
              ))}
              <div className="flex flex-row justify-between items-center px-2 py-[5px] gap-1 bg-[#E5EDF9] rounded h-7 min-w-[140px] flex-1 max-w-[260px]">
                <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Search</span>
                <Search size={16} className="text-[#7288A3] flex-shrink-0" />
              </div>
            </div>

            <div className="flex flex-row items-center p-[6px] gap-4 bg-white rounded flex-shrink-0 sticky right-0">
              <ColumnSettingsButton onClick={openColSettings} />
              <ImportButton scope="Companies" />
              <button
                className="w-4 h-4 flex items-center justify-center text-[#7288A3] hover:text-[#007EA7] transition-colors"
                onClick={handleRefresh}
                title="REFRESH ALL"
              >
                <RefreshCw size={16} className={isSpinning ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-col gap-12 flex-1">
          <div className="overflow-x-auto scrollbar-hide" ref={tableScrollRef} onScroll={handleTableScroll}>
            <div style={{ minWidth: `${activeCols.reduce((s, c) => s + c.width + 12, 0) + 2 + 119 + 12}px` }}>

              {/* Column headers */}
              <div className="flex flex-row items-center pl-3 gap-3 h-5 mb-4">
                {activeCols.map((col) => {
                  const colIdx = columns.findIndex(c => c.key === col.key);
                  return (
                    <div key={col.key} className="flex flex-row items-center flex-shrink-0">
                      <div className="relative flex flex-row items-center gap-[6px] flex-shrink-0" style={{ width: col.width }}>
                        <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">{col.key === 'name' ? 'Company name' : col.label}</span>
                        <ColumnSortButton columnLabel={col.label} direction={directionFor(col.key)} onDirectionChange={direction => { changeSort(col.key, direction); setPage(1); }} />
                        <ResizeHandle onMouseDown={(e) => startResize(colIdx, e)} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rows */}
              <div className="flex flex-col">
                {loading && !refreshing ? (
                  Array.from({ length: ROWS_PER_PAGE }).map((_, i) => (
                    <div key={i} className={`flex flex-row items-center w-full h-9 rounded-lg ${i % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'}`}>
                      <div className="flex-1 px-3 py-[9px]">
                        <div className="h-3 bg-[#E5EDF9] rounded animate-pulse" style={{ width: `${40 + (i * 15) % 40}%` }} />
                      </div>
                    </div>
                  ))
                ) : error ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="font-montserrat text-[13px] text-red-500">{error}</span>
                  </div>
                ) : rows.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="font-montserrat text-[13px] text-[#7288A3]">No companies found.</span>
                  </div>
                ) : (
                  rows.map((row, i) => (
                    <div key={row.id} className={`flex flex-row items-center w-full h-9 rounded-lg ${i % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'}`}>
                      <div className="w-1 h-9 flex-shrink-0 opacity-80" style={{ background: 'linear-gradient(90deg, #E4F7FF 0%, rgba(228,247,255,0) 100%)' }} />

                      <div className="flex flex-row items-center px-[10px] py-[9px] gap-6 flex-1 h-9 min-w-0">
                        {activeCols.map(col => (
                          <div key={col.key} className="flex-shrink-0" style={{ width: col.width }}>
                            {renderDataCell(col.key, row)}
                          </div>
                        ))}
                      </div>

                      <div className="w-1 h-9 flex-shrink-0" style={{ background: 'linear-gradient(270deg, #E4F7FF 0%, rgba(228,247,255,0) 100%)' }} />

                      <div className="flex flex-row items-center p-1 flex-shrink-0 h-9" style={{ width: 119 }}>
                        <button
                          onClick={() => onViewDetails?.(row)}
                          className="flex items-center justify-center px-2 py-[6px] bg-white border-2 border-[#D3E1EC] rounded h-7 hover:border-[#007EA7] transition-colors"
                          style={{ width: 111 }}
                        >
                          <span className="font-montserrat font-semibold text-[12px] leading-4 text-[#7288A3]">View details</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <HorizontalTableScrollbar scrollRef={tableScrollRef} />

          {/* Footer */}
          <div className="flex flex-row flex-wrap justify-between items-center gap-4 flex-shrink-0">
            {!viewAll && (
              <TablePagination currentPage={page} totalPages={totalPages} itemCount={sorted.length} itemsPerPage={ROWS_PER_PAGE} onPageChange={setPage} />
            )}
            {viewAll && <div />}

            <div className="flex flex-row items-center gap-[14px] flex-shrink-0">
              <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap">
                {loading ? '...' : `${rows.length} from ${companies.length.toLocaleString()} items`}
              </span>
              <button onClick={() => { setViewAll(v => !v); setPage(1); }} className="flex items-center justify-center px-3 py-[6px] gap-1 bg-white border-2 border-[#D3E1EC] rounded-md h-8 hover:border-[#007EA7] transition-colors whitespace-nowrap">
                <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">{viewAll ? 'Default' : 'View all'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Column settings drawer */}
      {colSettingsOpen && (
        <ColumnSettingsPanel
          columns={columnOrder.map(key => columns.find(column => column.key === key)!).filter(Boolean).map(column => ({ ...column, visible: visibleColumns.has(column.key) }))}
          defaultColumns={ALL_COLUMNS.map(column => ({ ...column, visible: DEFAULT_VISIBLE.has(column.key) }))}
          onSave={saveColSettings}
          onClose={() => setColSettingsOpen(false)}
        />
      )}

      {createOpen && (
        <div className="fixed inset-0 z-[130] flex justify-end bg-[#10233A]/10" onClick={() => setCreateOpen(false)}>
          <aside className="flex h-full w-[380px] flex-col gap-6 bg-white px-6 pb-8 pt-6 shadow-[-2px_0_0_#E5EDF9]" onClick={event => event.stopPropagation()} aria-label="Create new company">
            <div className="flex items-center justify-between">
              <h2 className="font-montserrat text-[22px] font-semibold leading-8 text-[#10233A]">Create new company</h2>
              <button type="button" aria-label="Close create company" onClick={() => setCreateOpen(false)} className="text-[#7288A3] hover:text-[#10233A]"><X size={24} /></button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { key: 'name', label: 'Name *', value: newCompany.name, type: 'text' },
                { key: 'companyCode', label: 'Company code *', value: newCompany.companyCode, type: 'text' },
                { key: 'vatCode', label: 'VAT code', value: newCompany.vatCode, type: 'text' },
                { key: 'clientSince', label: 'Client since', value: newCompany.clientSince, type: 'number' },
                { key: 'actionRequired', label: 'Action required', value: newCompany.actionRequired, type: 'number' },
              ].map(field => (
                <label key={field.key} className="flex flex-col gap-2 font-montserrat text-[14px] font-semibold text-[#10233A]">
                  {field.label}
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={event => setNewCompany(current => ({ ...current, [field.key]: event.target.value }))}
                    className="h-[42px] rounded-lg border border-[#D3E1EC] px-[14px] font-montserrat text-[14px] font-medium text-[#10233A] outline-none focus:border-[#007EA7]"
                  />
                </label>
              ))}
              {createError && <p className="font-montserrat text-[12px] text-red-500">{createError}</p>}
            </div>
            <div className="mt-auto flex flex-col gap-3">
              <SaveButton onClick={createCompany} disabled={creating || !newCompany.name.trim() || !newCompany.companyCode.trim()}>{creating ? 'Saving...' : 'Save'}</SaveButton>
              <button type="button" onClick={() => setCreateOpen(false)} className="h-[42px] rounded-lg border-2 border-[#D3E1EC] font-montserrat text-[16px] font-semibold text-[#7288A3] hover:border-[#007EA7]">Cancel</button>
            </div>
          </aside>
        </div>
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
                    { label: 'Period', value: '17 mar — 26 mar' },
                    { label: 'Transaction type', value: 'Web transaction' },
                    { label: 'Transaction status', value: null, dot: '#0ED8A8', dotLabel: 'Active' },
                    { label: 'Range amount', value: '49.99 — 60.00' },
                    { label: 'Currency', value: 'USD' },
                    { label: 'Records to export', value: sorted.length.toLocaleString() },
                  ].map(item => (
                    <div key={item.label} className="flex flex-col">
                      <span className="font-montserrat font-semibold text-[12px] leading-[140%] text-[#10233A]">{item.label}</span>
                      {item.dot ? (
                        <div className="flex flex-row items-center gap-1 mt-[2px]">
                          <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: item.dot }} />
                          <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{item.dotLabel}</span>
                        </div>
                      ) : (
                        <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A] mt-[2px]">{item.value}</span>
                      )}
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
                  <ChevronUp size={16} className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#7288A3] rotate-180 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-auto">
              <button data-system-action="true" className="w-full h-[42px] flex items-center justify-center bg-[#007EA7] rounded-lg hover:bg-[#006b8f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleExport} disabled={!exportFormat}>
                <span className="font-montserrat font-semibold text-[16px] leading-6 text-white">IMPORT</span>
              </button>
              <button onClick={() => setExportOpen(false)} className="w-full h-[42px] flex items-center justify-center bg-white border-2 border-[#D3E1EC] rounded-lg hover:border-[#007EA7] transition-colors">
                <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#7288A3]">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
