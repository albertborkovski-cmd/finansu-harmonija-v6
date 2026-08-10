import React, { useState, useRef } from 'react';
import ColumnSettingsPanel, { type ColConfig } from './ColumnSettingsPanel';
import { PageActionButton, PageHeader } from './PageHeader';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import OcrSearchField from './OcrSearchField';
import { useColumnResize, ResizeHandle } from './useColumnResize';
import { Search, Columns, Download, RefreshCw, Trash2, Users, ChevronLeft, ChevronRight, X, ArrowLeft, Clock, ZoomIn, ZoomOut, Settings, ChevronDown, Map, ListFilter, Code2, Copy, Maximize } from 'lucide-react';
import ColumnSortButton, { useMultiColumnSort } from './ColumnSortButton';
import { BulkDeleteButton, RowDeleteButton } from './DeleteButtons';
import { ColumnSettingsButton } from './ScopedActionButtons';
import ImportButton from './ImportButton';

interface DashboardEntry {
  id: string;
  name: string;
  description: string;
  platform: string;
  date: string;
}

const SAMPLE_DATA: DashboardEntry[] = [
  { id: '1', name: 'IDP Sample', description: '\u2014', platform: 'RPA platform', date: '10.04.2026 12:22' },
  { id: '2', name: 'IDP Sample', description: '\u2014', platform: 'RPA platform', date: '10.04.2026 12:22' },
  { id: '3', name: 'IDP Sample', description: '\u2014', platform: 'RPA platform', date: '10.04.2026 12:22' },
  { id: '4', name: 'IDP Sample', description: '\u2014', platform: 'RPA platform', date: '10.04.2026 12:22' },
];

const COLUMN_DEFS: ColConfig[] = [
  { key: 'name', label: 'Name', width: 280, visible: true },
  { key: 'description', label: 'Description', width: 220, visible: true },
  { key: 'platform', label: 'Created by', width: 220, visible: true },
  { key: 'date', label: 'Creation date', width: 220, visible: true },
  { key: 'updatedBy', label: 'Updated by', width: 220, visible: false },
  { key: 'lastUpdate', label: 'Last update', width: 220, visible: false },
];

const METRICS = [
  { label: 'Human task transactions' },
  { label: 'Average task time in seconds' },
  { label: 'Worker completions' },
  { label: 'Workers all time in seconds' },
];

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[6px] transition-colors"
      style={{ background: checked ? '#007EA7' : '#FFFFFF', border: checked ? 'none' : '1px solid #A1B6C6' }}
      onClick={event => { event.stopPropagation(); onChange(); }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export default function DashboardsView() {
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [detailEntry, setDetailEntry] = useState<DashboardEntry | null>(null);
  const [detailTitle, setDetailTitle] = useState('');
  const [columns, setColumns] = useState<ColConfig[]>(COLUMN_DEFS);
  const [entries, setEntries] = useState<DashboardEntry[]>(SAMPLE_DATA);
  const { startResize } = useColumnResize(columns, setColumns);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const filteredRows = entries.filter(row =>
    [row.name, row.description, row.platform, row.date]
      .some(value => value.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const { sortedRows, changeSort, directionFor } = useMultiColumnSort(filteredRows, (row, key) => {
    if (key === 'updatedBy' || key === 'lastUpdate') return '—';
    return row[key as keyof DashboardEntry] ?? '—';
  });
  const visibleColumns = columns.filter(column => column.visible);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / 8));

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const filteredIds = filteredRows.map(row => row.id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedRows.has(id));
    setSelectedRows(prev => {
      const next = new Set(prev);
      filteredIds.forEach(id => allFilteredSelected ? next.delete(id) : next.add(id));
      return next;
    });
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

  if (detailEntry) {
    return (
      <DashboardDetail
        title={detailTitle || detailEntry.name}
        onBack={() => {
          setDetailEntry(null);
          setDetailTitle('');
        }}
      />
    );
  }

  return (
    <div className="relative flex min-h-full flex-col gap-8 bg-white px-9 py-14" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>
      {/* Header */}
      <PageHeader title="Dashboards" actions={<PageActionButton onClick={() => setShowCreatePanel(true)}>Create new</PageActionButton>} />

      {/* Content */}
      <div className="flex flex-col gap-6 flex-1">
        {/* Filter bar */}
        <div className="flex-shrink-0">
          <div className="flex flex-row flex-wrap justify-between items-center gap-2">
            <div className="flex flex-row items-center gap-1 flex-1 min-w-0">
              <OcrSearchField ariaLabel="Search dashboards" value={search} onChange={setSearch} />
            </div>
            <div className="flex flex-row items-center p-[6px] gap-4 bg-white rounded flex-shrink-0">
              <BulkDeleteButton selectedCount={selectedRows.size} onDelete={() => { setEntries(current => current.filter(row => !selectedRows.has(row.id))); setSelectedRows(new Set()); }} />
              <ColumnSettingsButton onClick={() => setShowColumnSettings(true)} />
              <ImportButton scope="Dashboards" />
              <button onClick={() => setEntries(current => current.map(entry => ({ ...entry })))} className="w-4 h-4 flex items-center justify-center text-[#7288A3] hover:text-[#007EA7] transition-colors" title="REFRESH ALL">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-col gap-12 flex-1">
          <div className="overflow-x-auto scrollbar-hide" ref={tableScrollRef} onScroll={handleTableScroll}>
            <div style={{ minWidth: entries.length > 0 ? `${visibleColumns.reduce((sum, column) => sum + column.width, 0) + 120}px` : '100%' }}>
              {/* Column headers */}
              <div className="system-table-header-row mb-4 flex h-9 flex-row items-start gap-0 pl-3">
                {visibleColumns.map((col, index) => (
                    <div
                      key={col.key}
                      className={`relative flex h-9 flex-shrink-0 flex-row items-start gap-[6px] pr-4 ${index > 0 ? 'pl-3' : ''}`}
                      style={{ width: col.width }}
                    >
                      {col.key === 'name' && (
                        <Checkbox checked={filteredRows.length > 0 && filteredRows.every(row => selectedRows.has(row.id))} onChange={toggleAll} />
                      )}
                      <span className="min-w-0 whitespace-normal font-montserrat text-[12px] font-medium leading-[18px] text-[#10233A]">{col.label}</span>
                      <ColumnSortButton columnLabel={col.label} direction={directionFor(col.key)} onDirectionChange={direction => { changeSort(col.key, direction); setCurrentPage(1); }} />
                      <ResizeHandle onMouseDown={(e) => startResize(columns.findIndex(c => c.key === col.key), e)} />
                    </div>
                ))}
              </div>

              {/* Rows */}
              <div className="flex flex-col">
                {sortedRows.map((row, i) => (
                  <div
                    key={row.id}
                    onClick={() => {
                      setDetailTitle(row.name);
                      setDetailEntry(row);
                    }}
                    className={`flex flex-row items-center w-full h-9 rounded-lg group cursor-pointer ${i % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'} hover:bg-[#E7F4F9] transition-colors`}
                  >
                    {visibleColumns.map((column) => {
                      const value = column.key === 'updatedBy' ? '—' : column.key === 'lastUpdate' ? '—' : String(row[column.key as keyof DashboardEntry] ?? '—');
                      return (
                          <div
                            key={column.key}
                            className="system-table-select-cell flex flex-shrink-0 items-center gap-[6px] overflow-hidden px-3"
                            style={{ width: column.width }}
                            onClick={column.key === 'name' ? event => event.stopPropagation() : undefined}
                          >
                            {column.key === 'name' && <Checkbox checked={selectedRows.has(row.id)} onChange={() => toggleRow(row.id)} />}
                            {column.key === 'name' ? (
                              <button
                                type="button"
                                onClick={event => { event.stopPropagation(); setDetailTitle(row.name); setDetailEntry(row); }}
                                className="min-w-0 truncate text-left font-montserrat text-[12px] font-medium leading-[18px] text-[#007EA7] hover:underline"
                              >
                                {value}
                              </button>
                            ) : (
                              <span className="truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{value}</span>
                            )}
                          </div>
                      );
                    })}
                    <div className="ml-auto flex flex-row items-center p-1 gap-1 flex-shrink-0 h-9" onClick={e => e.stopPropagation()}>
                      <button
                        aria-label={`Open workers for ${row.name}`}
                        title="Open workers"
                        onClick={() => {
                          setDetailTitle('Worker');
                          setDetailEntry(row);
                        }}
                        className="w-7 h-7 flex items-center justify-center bg-white border-2 border-[#D3E1EC] rounded hover:border-[#007EA7] transition-colors"
                      >
                        <Users size={16} className="text-[#7288A3]" />
                      </button>
                      <RowDeleteButton label={`Delete ${row.name}`} onDelete={() => { setEntries(current => current.filter(item => item.id !== row.id)); setSelectedRows(current => { const next = new Set(current); next.delete(row.id); return next; }); }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <HorizontalTableScrollbar scrollRef={tableScrollRef} />

          {/* Footer */}
          <div className="flex flex-row flex-wrap justify-between items-center gap-4 flex-shrink-0">
            <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={filteredRows.length} onPageChange={setCurrentPage} />

            <div className="flex flex-row items-center gap-[14px] flex-shrink-0">
              <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap">
                {filteredRows.length} from {entries.length} items
              </span>
              <button className="flex h-8 min-w-[107px] items-center justify-center gap-1 whitespace-nowrap rounded-md border-2 border-[#D3E1EC] bg-white px-3 py-[6px] transition-colors hover:border-[#007EA7]">
                <span className="font-montserrat text-[14px] font-semibold leading-5 text-[#7288A3]">Show more</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Column Settings Panel */}
      {showColumnSettings && <ColumnSettingsPanel columns={columns} defaultColumns={COLUMN_DEFS} onSave={setColumns} onClose={() => setShowColumnSettings(false)} />}

      {/* Create Dashboard Panel */}
      {showCreatePanel && <CreateDashboardPanel onClose={() => setShowCreatePanel(false)} />}
    </div>
  );
}

function DashboardDetail({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex flex-col bg-white px-9 py-14 gap-8 min-h-full" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>
      {/* Header */}
      <div className="flex flex-col gap-4 flex-shrink-0">
        <div className="flex flex-row justify-between items-start">
          <div className="flex flex-row items-center gap-4">
            <button onClick={onBack} className="flex items-center justify-center py-[9px] px-[1px]">
              <ArrowLeft size={16} className="text-[#7288A3]" strokeWidth={2} />
            </button>
            <h1 className="font-montserrat font-semibold text-[36px] leading-[46px] text-[#10233A]">{title}</h1>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex flex-row items-center gap-2">
          <button onClick={onBack} className="flex flex-col items-start">
            <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#7288A3]">Dashboards</span>
          </button>
          <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#A1B6C6]">/</span>
          <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#A1B6C6]">{title}</span>
        </div>
      </div>

      {/* Chart container */}
      <div className="flex flex-col rounded-2xl overflow-hidden flex-1">
        {/* Toolbar */}
        <div className="flex flex-row justify-between items-center px-3 py-3 bg-[#EFF7FF]">
          <div className="flex flex-row items-center gap-6 flex-wrap">
            <div className="flex flex-row items-center gap-2 cursor-pointer">
              <span className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A]">Document type: All</span>
              <ChevronDown size={16} className="text-[#10233A]" />
            </div>
            <div className="flex flex-row items-center gap-2 cursor-pointer">
              <span className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A]">Worker: All</span>
              <ChevronDown size={16} className="text-[#10233A]" />
            </div>
            <div className="flex flex-row items-center gap-2 cursor-pointer">
              <Clock size={16} className="text-[#7288A3]" />
              <span className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A]">Last 1 hour</span>
              <ChevronDown size={16} className="text-[#10233A]" />
            </div>
            <div className="flex flex-row items-center gap-2 cursor-pointer">
              <span className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A]">1m</span>
              <ChevronDown size={16} className="text-[#10233A]" />
            </div>
          </div>
          <div className="flex flex-row items-center gap-4">
            <button className="hover:opacity-70"><ZoomOut size={16} className="text-[#7288A3]" /></button>
            <button className="hover:opacity-70"><ZoomIn size={16} className="text-[#7288A3]" /></button>
            <button type="button" title="REFRESH ALL" aria-label="Refresh all dashboard information" className="hover:opacity-70"><RefreshCw size={16} className="text-[#7288A3]" /></button>
            <button className="hover:opacity-70"><Settings size={16} className="text-[#7288A3]" /></button>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2 bg-[#EFF7FF]">
          {METRICS.map((metric) => (
            <div
              key={metric.label}
              className="flex flex-col border border-[#E5EDF9] rounded-lg bg-white p-6 gap-6"
            >
              <span className="font-montserrat font-semibold text-[18px] leading-6 text-[#10233A]">{metric.label}</span>
              <div className="flex flex-col justify-center items-center h-24 relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between opacity-30">
                  <div className="w-full h-0 border-b border-[#E2E8F0]" />
                  <div className="w-full h-0 border-b border-[#E2E8F0]" />
                  <div className="w-full h-0 border-b border-[#E2E8F0]" />
                </div>
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10B981] relative z-10">No data</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateDashboardPanel({ onClose }: { onClose: () => void }) {
  const [fromJson, setFromJson] = useState(true);

  return (
    <div className="absolute inset-y-0 right-0 z-40 flex">
      <div className="w-[440px] bg-white flex flex-col h-full" style={{ boxShadow: '-2px 0px 0px #E5EDF9' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <span className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">Create dashboard</span>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center hover:opacity-70">
            <X size={16} className="text-[#7288A3]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="flex flex-col gap-6">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Name <span className="text-red-500">*</span></span>
              <div className="flex items-center h-[42px] px-[14px] border border-[#D3E1EC] rounded-lg bg-white">
                <span className="font-montserrat font-medium text-[14px] leading-[140%] text-[#A1B6C6]">Enter name...</span>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Description</span>
              <div className="flex flex-col justify-between h-[80px] px-[14px] py-[11px] border border-[#D3E1EC] rounded-lg bg-white">
                <span className="font-montserrat font-medium text-[14px] leading-[140%] text-[#A1B6C6]">Enter description...</span>
                <div className="flex justify-end">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M0.75 7.25L7.25 0.75" stroke="#828588" strokeLinecap="round"/>
                    <path d="M4.75 7.25L7.25 4.75" stroke="#828588" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* From JSON toggle */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-row items-center gap-2">
                <div
                  className={`w-[30px] h-[18px] rounded-[13px] relative cursor-pointer ${fromJson ? 'bg-[#007EA7]' : 'bg-[#A1B6C6]'}`}
                  onClick={() => setFromJson(!fromJson)}
                >
                  <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${fromJson ? 'left-[14px]' : 'left-[2px]'}`} />
                </div>
                <span className="font-montserrat font-medium text-[14px] leading-5 text-[#7288A3]">From JSON</span>
              </div>

              {fromJson && (
                <button data-system-action="true" className="flex items-center justify-center px-2 py-[6px] gap-1 bg-[#007EA7] rounded h-7 w-[167px] hover:bg-[#006b8f] transition-colors">
                  <span className="font-montserrat font-semibold text-[12px] leading-4 text-white">Upload JSON configuration</span>
                </button>
              )}
            </div>

            {/* Settings JSON editor */}
            <div className="flex flex-col gap-2">
              <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Settings</span>
              <div className="flex flex-col border border-[#E5EDF9] rounded-lg overflow-hidden">
                <div className="flex flex-row h-[392px]">
                  <div className="flex flex-col items-center py-4 w-12 bg-[#F8FAFC] flex-shrink-0">
                    <span className="font-roboto font-medium text-[14px] leading-5 text-[#A1B6C6] tracking-[0.5px]">1</span>
                  </div>
                  <div className="flex-1 p-4 overflow-auto">
                    <pre className="font-roboto font-medium text-[14px] leading-5 text-[#10233A] tracking-[0.5px] whitespace-pre-wrap">
{`{}`}
                    </pre>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-3 bg-[#F8FAFC] border-t border-[#E5EDF9]">
                  <div className="flex items-center gap-2">
                    <div className="w-[30px] h-[18px] rounded-[13px] relative cursor-pointer bg-[#A1B6C6]">
                      <div className="absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white" />
                    </div>
                    <span className="font-montserrat font-medium text-[14px] leading-5 text-[#7288A3]">Tree View</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button aria-label="Tree map" title="Tree map" className="flex h-5 w-5 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7]">
                      <Map size={18} strokeWidth={1.8} />
                    </button>
                    <button aria-label="Search settings" title="Search" className="flex h-5 w-5 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7]">
                      <Search size={18} strokeWidth={1.8} />
                    </button>
                    <button aria-label="Filter settings" title="Filter" className="flex h-5 w-5 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7]">
                      <ListFilter size={18} strokeWidth={1.8} />
                    </button>
                    <button aria-label="Code view" title="Code view" className="flex h-5 w-5 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7]">
                      <Code2 size={18} strokeWidth={1.8} />
                    </button>
                    <button aria-label="Copy settings" title="Copy" className="flex h-5 w-5 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7]">
                      <Copy size={18} strokeWidth={1.8} />
                    </button>
                    <button aria-label="Fullscreen editor" title="Fullscreen" className="flex h-5 w-5 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7]">
                      <Maximize size={18} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-6 py-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center h-[42px] border-2 border-[#D3E1EC] rounded-lg font-montserrat font-semibold text-[16px] leading-6 text-[#7288A3] hover:border-[#007EA7] transition-colors"
          >
            Cancel
          </button>
          <button data-system-action="true" className="flex-1 flex items-center justify-center h-[42px] bg-[#007EA7] rounded-lg font-montserrat font-semibold text-[16px] leading-6 text-white hover:bg-[#006b8f] transition-colors">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
