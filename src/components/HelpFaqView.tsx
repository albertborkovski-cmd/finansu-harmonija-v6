import React, { useMemo, useState } from 'react';
import { Search, Columns2, Download, RefreshCw, ChevronDown, ChevronRight, X, Plus, Copy } from 'lucide-react';
import ColumnSettingsPanel, { type ColConfig } from './ColumnSettingsPanel';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import OcrSearchField from './OcrSearchField';
import { useColumnResize, ResizeHandle } from './useColumnResize';
import ColumnSortButton, { useMultiColumnSort } from './ColumnSortButton';
import { ColumnSettingsButton } from './ScopedActionButtons';
import ImportButton from './ImportButton';
import { matchesTextSearch } from '../utils/textSearch';

interface ActionRow {
  id: string;
  date: string;
  user: string;
  role: string;
  actionType: string;
  objectType: string;
  objectId: string;
  status: 'Active' | 'Inactive';
  actionId: string;
}

const SAMPLE_ROWS: ActionRow[] = [
  { id: '1', date: '10.11.2025 - 12:15', user: 'John Brick', role: 'Client', actionType: 'Invoice creation', objectType: 'Invoice', objectId: '5478321996547', status: 'Active', actionId: 'ece861d8-aecc-44dd-8cef-fc8f34c06940' },
  { id: '2', date: '10.11.2025 - 12:15', user: 'John Brick', role: 'Client', actionType: 'Invoice creation', objectType: 'Invoice', objectId: '5478321996547', status: 'Active', actionId: 'f3a92b1c-7d4e-48f2-a5c1-9b2d6e8f4a71' },
  { id: '3', date: '10.11.2025 - 12:15', user: 'John Brick', role: 'Client', actionType: 'Invoice creation', objectType: 'Invoice', objectId: '5478321996547', status: 'Active', actionId: 'b7c45e2d-1a8f-4b3c-9d6e-2f5a8c7b4e91' },
  { id: '4', date: '10.11.2025 - 12:15', user: 'John Brick', role: 'Client', actionType: 'Invoice creation', objectType: 'Invoice', objectId: '5478321996547', status: 'Active', actionId: 'd4e72f9a-6b3c-41d8-8e5f-a9c2b7d6e3f1' },
];

interface FilterChip {
  id: string;
  label: string;
  width: number;
}

const FILTERS: FilterChip[] = [
  { id: 'direction', label: 'Direction', width: 104 },
  { id: 'type', label: 'Type', width: 64 },
  { id: 'range', label: 'Range amount', width: 107 },
  { id: 'subscription', label: 'Subscription', width: 108 },
  { id: 'status', label: 'Status', width: 75 },
];

const INITIAL_COLUMNS: ColConfig[] = [
  { key: 'date', label: 'Date', width: 142, visible: true },
  { key: 'user', label: 'User', width: 120, visible: true },
  { key: 'role', label: 'Role', width: 130, visible: true },
  { key: 'actionType', label: 'Action type', width: 120, visible: true },
  { key: 'objectType', label: 'Object type', width: 120, visible: true },
  { key: 'objectId', label: 'Object ID/No.', width: 120, visible: true },
  { key: 'status', label: 'Status', width: 120, visible: true },
];

export default function HelpFaqView() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;
  const [selectedRow, setSelectedRow] = useState<ActionRow | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columns, setColumns] = useState<ColConfig[]>(INITIAL_COLUMNS);
  const [query, setQuery] = useState('');
  const { startResize } = useColumnResize(columns, setColumns);
  const filteredRows = useMemo(() => SAMPLE_ROWS.filter(row => matchesTextSearch(row, query)), [query]);
  const { sortedRows, changeSort, directionFor } = useMultiColumnSort(filteredRows, (row, key) => row[key as keyof ActionRow] as string | number | undefined);

  return (
    <div className="flex flex-col bg-white px-9 py-14 gap-8 min-h-full relative" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>

      {/* Header */}
      <div className="flex flex-row items-center gap-4 flex-shrink-0">
        <h1 className="font-montserrat font-semibold text-[36px] leading-[46px] text-[#10233A] whitespace-nowrap">
          Help/FAQ
        </h1>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 flex-1">

        {/* Filter bar */}
        <div className="flex-shrink-0">
          <div className="flex flex-row flex-wrap justify-between items-center gap-2">
            <div className="flex flex-row items-center gap-1 flex-1 min-w-0 flex-wrap">
              {FILTERS.map((filter) => (
                <div
                  key={filter.id}
                  className="flex flex-row items-center px-2 py-[5px] gap-1 bg-[#E5EDF9] rounded h-7 cursor-pointer hover:bg-[#d8e6f5] transition-colors"
                  style={{ width: filter.width }}
                >
                  <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap truncate flex-1">
                    {filter.label}
                  </span>
                  <ChevronDown size={16} className="text-[#7288A3] flex-shrink-0" />
                </div>
              ))}

              {/* Add filter */}
              <button className="flex flex-row items-center px-2 py-[5px] gap-1 bg-[#E5EDF9] rounded h-7 hover:bg-[#d8e6f5] transition-colors">
                <Plus size={16} className="text-[#7288A3]" />
                <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap">Add filter</span>
              </button>

              {/* Search */}
              <OcrSearchField ariaLabel="Search FAQ" value={query} onChange={value => { setQuery(value); setCurrentPage(1); }} />
            </div>

            {/* Toolbar icons */}
            <div className="flex flex-row items-center p-[6px] gap-4 bg-white rounded flex-shrink-0">
              <ColumnSettingsButton onClick={() => setShowColumnSettings(true)} />
              <ImportButton scope="FAQ" />
              <button type="button" className="w-4 h-4 flex items-center justify-center text-[#7288A3] hover:text-[#007EA7] transition-colors" title="REFRESH ALL">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-col flex-1 gap-12">
          <div className="flex flex-col gap-0 overflow-x-auto scrollbar-hide">
            {/* Column headers */}
            <div className="flex flex-row items-center pl-3 gap-3 h-5 mb-2 min-w-fit">
              {columns.filter(c => c.visible).map((col, visIdx) => {
                const realIndex = columns.findIndex(c => c.key === col.key);
                const isFirst = visIdx === 0;
                return (
                  <React.Fragment key={col.key}>
                    <div className="relative flex-shrink-0 flex flex-row items-center gap-[6px]" style={{ width: col.width }}>
                      <span className={`font-montserrat font-medium text-[12px] leading-[18px] whitespace-nowrap ${isFirst ? 'text-[#10233A]' : 'text-[#7288A3]'}`}>{col.label}</span>
                      <ColumnSortButton columnLabel={col.label} direction={directionFor(col.key)} onDirectionChange={direction => { changeSort(col.key, direction); setCurrentPage(1); }} />
                      <ResizeHandle onMouseDown={(e) => startResize(realIndex, e)} />
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Rows */}
            <div className="flex flex-col">
              {sortedRows.map((row, rowIndex) => (
                <div
                  key={row.id}
                  className={`flex flex-row items-center pl-3 gap-3 h-9 rounded-lg min-w-fit ${
                    selectedRow?.id === row.id
                      ? 'bg-[#E7F4F9]'
                      : rowIndex % 2 === 0
                        ? 'bg-[#F8FDFF]'
                        : 'bg-white'
                  } group hover:bg-[#E7F4F9] transition-colors`}
                >
                  {columns.filter(column => column.visible).map((column, index) => (
                    <React.Fragment key={column.key}>
                      {index > 0 && <div className="h-9 w-px flex-shrink-0 bg-[#E4F7FF]" />}
                      <div className="flex flex-shrink-0 items-center gap-1.5 overflow-hidden" style={{ width: column.width }}>
                        {column.key === 'status' && <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${row.status === 'Active' ? 'bg-[#0ED8A8]' : 'bg-[#A1B6C6]'}`} />}
                        <span className="truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{String(row[column.key as keyof ActionRow] ?? '—')}</span>
                      </div>
                    </React.Fragment>
                  ))}

                  {/* Right gradient */}
                  <div className="w-1 h-9 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #E3EEFF 0%, rgba(227, 238, 255, 0) 100%)', opacity: 0.8, transform: 'matrix(-1, 0, 0, 1, 0, 0)' }} />

                  {/* Row action button */}
                  <div className="flex flex-row items-center px-1 flex-shrink-0">
                    <button
                      onClick={() => setSelectedRow(row)}
                      className="flex items-center justify-center px-2 py-[6px] border-2 border-[#D3E1EC] rounded bg-white hover:border-[#007EA7] transition-colors"
                      style={{ width: 91 }}
                    >
                      <span className="font-montserrat font-semibold text-[12px] leading-4 text-[#7288A3] whitespace-nowrap">View details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <HorizontalTableScrollbar />

          {/* Bottom bar */}
          <div className="flex flex-row justify-between items-center gap-4">
            {/* Pagination */}
            <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={SAMPLE_ROWS.length} onPageChange={setCurrentPage} />

            {/* Item count + export */}
            <div className="flex flex-row items-center gap-[14px] flex-shrink-0">
              <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap">
                14 from 15,000 items
              </span>
              <button className="flex items-center justify-center px-3 py-[6px] border-2 border-[#D3E1EC] rounded-md h-8 hover:border-[#007EA7] transition-colors">
                <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3] whitespace-nowrap">Export to CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Column Settings Panel */}
      {showColumnSettings && (
        <ColumnSettingsPanel
          columns={columns}
          onSave={(cols) => setColumns(cols)}
          onClose={() => setShowColumnSettings(false)}
        />
      )}

      {/* Action Details Side Panel */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedRow(null)}>
          <div
            className="relative h-full w-[340px] bg-white flex flex-col gap-6 px-6 pt-6 pb-8 overflow-y-auto"
            style={{ boxShadow: '-2px 0px 0px #E5EDF9' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-row justify-between items-center">
                <span className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">Action details</span>
                <button onClick={() => setSelectedRow(null)} className="text-[#7288A3] hover:text-[#10233A] transition-colors">
                  <X size={24} />
                </button>
              </div>
              <button className="flex items-center justify-center px-3 py-[6px] gap-1 border-2 border-[#D3E1EC] rounded-md h-8 hover:border-[#007EA7] transition-colors self-start">
                <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3] whitespace-nowrap">Copy link to clipboard</span>
                <Copy size={16} className="text-[#7288A3]" />
              </button>
            </div>

            {/* Details card */}
            <div className="flex flex-col gap-2 p-3 bg-[#F2F5F9] rounded-lg">
              <DetailField label="Action ID" value={selectedRow.actionId} />
              <DetailField label="Date" value={selectedRow.date.replace(' - ', ' ')} />
              <DetailField label="Action type" value={selectedRow.actionType} />
              <DetailField label="Object type" value={selectedRow.objectType} />
              <DetailField label="Object ID/No." value={selectedRow.objectId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-montserrat font-semibold text-[12px] leading-[18px] text-[#10233A]">{label}</span>
      <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{value}</span>
    </div>
  );
}
