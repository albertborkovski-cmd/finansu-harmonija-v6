import { useMemo, useRef, useState } from 'react';
import { Search, Download, RefreshCw, Trash2, X, Eye, EyeOff, ChevronLeft, ChevronRight, Users, Copy, AlignLeft, Maximize2, Minimize2, Map, ArrowLeft } from 'lucide-react';
import ColumnSettingsPanel, { type ColConfig } from './ColumnSettingsPanel';
import { PageActionButton, PageHeader } from './PageHeader';
import { useColumnResize, ResizeHandle } from './useColumnResize';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import OcrSearchField from './OcrSearchField';
import { ColumnSettingsButton } from './ScopedActionButtons';
import ColumnSortButton, { useMultiColumnSort } from './ColumnSortButton';
import { BulkDeleteButton, RowDeleteButton } from './DeleteButtons';
import ImportButton from './ImportButton';
import type { SecurityAccessTarget } from './ResourceSecurityAccessView';
import { matchesTextSearch } from '../utils/textSearch';

const MAIN_INITIAL_COLUMNS: ColConfig[] = [
  { key: 'alias', label: 'Alias', width: 280, visible: true },
  { key: 'createdBy', label: 'Created by', width: 220, visible: true },
  { key: 'creationDate', label: 'Creation Date', width: 180, visible: true },
];

const DETAIL_INITIAL_COLUMNS: ColConfig[] = [
  { key: 'name', label: 'Name', width: 280, visible: true },
  { key: 'description', label: 'Description', width: 220, visible: true },
  { key: 'permissions', label: 'Permissions', width: 320, visible: true },
];

interface VaultEntry {
  id: string;
  alias: string;
  createdBy: string;
  creationDate: string;
  value: string;
}

interface VaultDetailEntry {
  id: string;
  name: string;
  description: string;
  permissions: string;
}

const SAMPLE_ENTRIES: VaultEntry[] = [
  { id: '1', alias: 'demo.catering.mailbox', createdBy: 'RPA platform', creationDate: '10.04.2026 12:22', value: '{\n  "parent": [],\n  "variables": {},\n  "_id": "c487a18d-bb20-48e5-a327-09e4998c5870"\n}' },
  { id: '2', alias: 'demo.catering.mailbox', createdBy: 'RPA platform', creationDate: '10.04.2026 12:22', value: '{\n  "parent": [],\n  "variables": {},\n  "_id": "a291b32f-1c44-4d9e-b112-7e3f5a8c9012"\n}' },
  { id: '3', alias: 'demo.catering.mailbox', createdBy: 'RPA platform', creationDate: '10.04.2026 12:22', value: '{\n  "parent": [],\n  "variables": {},\n  "_id": "f8e21b4a-6d33-4a7c-9c45-2b1a8d6e4f90"\n}' },
  { id: '4', alias: 'demo.catering.mailbox', createdBy: 'RPA platform', creationDate: '10.04.2026 12:22', value: '{\n  "parent": [],\n  "variables": {},\n  "_id": "d4c7e891-3f22-4b6d-8a34-1c9e5f7b2d80"\n}' },
];

const DETAIL_ENTRIES: VaultDetailEntry[] = [
  { id: '1', name: 'MESO', description: 'Students', permissions: 'Create, Update, Delete, Read, Action' },
  { id: '2', name: 'MESO', description: 'Students', permissions: 'Create, Update, Delete, Read, Action' },
  { id: '3', name: 'MESO', description: 'Students', permissions: 'Create, Update, Delete, Read, Action' },
  { id: '4', name: 'MESO', description: 'Students', permissions: 'Create, Update, Delete, Read, Action' },
];

type PanelMode = null | 'edit' | 'import' | 'create';

export default function SecretVaultView({ onNavigateToAdministration }: { onNavigateToAdministration?: (target: SecurityAccessTarget) => void }) {
  const mainTableScrollRef = useRef<HTMLDivElement>(null);
  const detailTableScrollRef = useRef<HTMLDivElement>(null);
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showValue, setShowValue] = useState(false);
  const [jsonMode, setJsonMode] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailView, setDetailView] = useState<VaultEntry | null>(null);
  const [detailSelectedRows, setDetailSelectedRows] = useState<Set<string>>(new Set());
  const [newAlias, setNewAlias] = useState('');
  const [jsonValue, setJsonValue] = useState('');
  const [createFullScreen, setCreateFullScreen] = useState(false);
  const [showMainColSettings, setShowMainColSettings] = useState(false);
  const [showDetailColSettings, setShowDetailColSettings] = useState(false);
  const [mainColumns, setMainColumns] = useState<ColConfig[]>(MAIN_INITIAL_COLUMNS);
  const [detailColumns, setDetailColumns] = useState<ColConfig[]>(DETAIL_INITIAL_COLUMNS);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>(SAMPLE_ENTRIES);
  const [detailEntries, setDetailEntries] = useState<VaultDetailEntry[]>(DETAIL_ENTRIES);
  const [query, setQuery] = useState('');
  const [detailQuery, setDetailQuery] = useState('');
  const { startResize: startResizeMain } = useColumnResize(mainColumns, setMainColumns);
  const { startResize: startResizeDetail } = useColumnResize(detailColumns, setDetailColumns);
  const filteredEntries = useMemo(() => vaultEntries.filter(entry => matchesTextSearch(entry, query)), [vaultEntries, query]);
  const filteredDetailEntries = useMemo(() => detailEntries.filter(entry => matchesTextSearch(entry, detailQuery)), [detailEntries, detailQuery]);
  const { sortedRows: sortedEntries, changeSort: changeMainSort, directionFor: mainDirectionFor } = useMultiColumnSort(filteredEntries, (entry, key) => entry[key as keyof VaultEntry]);
  const { sortedRows: sortedDetailEntries, changeSort: changeDetailSort, directionFor: detailDirectionFor } = useMultiColumnSort(filteredDetailEntries, (entry, key) => entry[key as keyof VaultDetailEntry]);
  const totalPages = Math.max(1, Math.ceil(vaultEntries.length / 8));

  const openEdit = (entry: VaultEntry) => {
    setSelectedEntry(entry);
    setNewAlias(entry.alias);
    setJsonValue(entry.value);
    setJsonMode(true);
    setCreateFullScreen(false);
    setPanelMode('edit');
  };

  const openDetail = (entry: VaultEntry) => {
    setDetailView(entry);
  };

  const closePanel = () => {
    setPanelMode(null);
    setSelectedEntry(null);
    setNewAlias('');
    setJsonValue('');
    setJsonMode(true);
    setCreateFullScreen(false);
  };

  const openCreatePanel = () => {
    setSelectedEntry(null);
    setNewAlias('');
    setJsonValue('');
    setJsonMode(true);
    setCreateFullScreen(false);
    setPanelMode('create');
  };

  const createVaultEntry = () => {
    if (!newAlias.trim() || !jsonValue.trim()) return;
    const now = new Date().toLocaleString('lt-LT');
    setVaultEntries(current => [{
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
      alias: newAlias.trim(),
      createdBy: 'Local user',
      creationDate: now,
      value: jsonValue,
    }, ...current]);
    setCurrentPage(1);
    closePanel();
  };

  const updateVaultEntry = () => {
    if (!selectedEntry || !newAlias.trim() || !jsonValue.trim()) return;
    setVaultEntries(current => current.map(entry => entry.id === selectedEntry.id
      ? { ...entry, alias: newAlias.trim(), value: jsonValue }
      : entry));
    closePanel();
  };

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === vaultEntries.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(vaultEntries.map(e => e.id)));
    }
  };

  const toggleDetailRow = (id: string) => {
    setDetailSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllDetail = () => {
    if (detailSelectedRows.size === detailEntries.length) {
      setDetailSelectedRows(new Set());
    } else {
      setDetailSelectedRows(new Set(detailEntries.map(e => e.id)));
    }
  };

  if (detailView) {
    return (
      <div className="flex flex-col bg-white px-9 py-14 gap-8 min-h-full relative" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>
        {/* Header with back + title */}
        <div className="flex flex-col gap-4 flex-shrink-0">
          <PageHeader title="Secret vault" leading={<button onClick={() => setDetailView(null)} className="flex items-center justify-center py-[9px] px-[1px]"><ArrowLeft size={16} className="text-[#7288A3]" strokeWidth={2} /></button>} actions={<><PageActionButton disabled>Edit</PageActionButton><PageActionButton disabled>Create new</PageActionButton></>} />

          {/* Breadcrumbs */}
          <div className="flex flex-row items-center gap-2">
            <button onClick={() => setDetailView(null)} className="flex flex-col items-start">
              <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#7288A3]">Secret vault</span>
            </button>
            <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#A1B6C6]">/</span>
            <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#A1B6C6]">{detailView.alias}</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-row flex-wrap justify-between items-center gap-2 flex-shrink-0">
          <div className="flex flex-row items-center gap-1 flex-1 min-w-0">
            <OcrSearchField ariaLabel="Search secret vault details" value={detailQuery} onChange={setDetailQuery} />
          </div>
          <div className="flex flex-row items-center p-[6px] gap-4 bg-white rounded flex-shrink-0">
            <BulkDeleteButton selectedCount={detailSelectedRows.size} onDelete={() => { setDetailEntries(current => current.filter(row => !detailSelectedRows.has(row.id))); setDetailSelectedRows(new Set()); }} />
            <ColumnSettingsButton onClick={() => setShowDetailColSettings(true)} />
            <ImportButton scope={`Secret vault ${detailView?.name ?? 'details'}`} />
            <button onClick={() => setDetailEntries(current => current.map(entry => ({ ...entry })))} className="w-4 h-4 flex items-center justify-center text-[#7288A3] hover:text-[#007EA7] transition-colors" title="REFRESH ALL">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {showDetailColSettings && (
          <ColumnSettingsPanel
            columns={detailColumns}
            onSave={cols => setDetailColumns(cols)}
            onClose={() => setShowDetailColSettings(false)}
          />
        )}

        {/* Detail table */}
        <div ref={detailTableScrollRef} className="flex flex-col gap-4 flex-1 overflow-x-auto scrollbar-hide">
          {/* Column headers */}
          <div className="flex flex-row items-center pl-3 gap-3 h-5">
            {detailColumns.filter(c => c.visible).map((col) => (
              <div key={col.key} className="flex flex-row items-center gap-3 flex-shrink-0">
                <div className="relative flex flex-row items-center gap-[6px] flex-shrink-0" style={{ width: col.width }}>
                  {col.key === 'name' && (
                    <>
                      <button
                        onClick={toggleAllDetail}
                        className="flex-shrink-0 w-[18px] h-[18px] relative rounded-[6px] mr-1"
                        style={
                          detailSelectedRows.size === detailEntries.length && detailEntries.length > 0
                            ? { backgroundColor: '#007EA7' }
                            : { border: '1px solid #A1B6C6', backgroundColor: 'transparent' }
                        }
                      >
                        {detailSelectedRows.size === detailEntries.length && detailEntries.length > 0 && (
                          <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">{col.label}</span>
                      <ColumnSortButton columnLabel={col.label} direction={detailDirectionFor(col.key)} onDirectionChange={direction => { changeDetailSort(col.key, direction); setCurrentPage(1); }} />
                    </>
                  )}
                  {col.key !== 'name' && <><span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">{col.label}</span><ColumnSortButton columnLabel={col.label} direction={detailDirectionFor(col.key)} onDirectionChange={direction => { changeDetailSort(col.key, direction); setCurrentPage(1); }} /></>}
                  <ResizeHandle onMouseDown={(e) => startResizeDetail(detailColumns.findIndex(item => item.key === col.key), e)} />
                </div>
              </div>
            ))}
          </div>

          {/* Detail rows */}
          <div className="flex flex-col">
            {sortedDetailEntries.map((entry, idx) => (
              <div
                key={entry.id}
                className={`flex flex-row items-center pl-3 gap-3 h-9 rounded-lg transition-colors group ${
                  idx % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'
                } hover:bg-[#E7F4F9]`}
              >
                {detailColumns.filter(column => column.visible).map((column, columnIndex) => (
                  <div key={column.key} className="contents">
                    {columnIndex > 0 && <div className="h-9 w-px flex-shrink-0 bg-[#E4F7FF]" />}
                    <div className="flex flex-shrink-0 items-center gap-[6px] overflow-hidden" style={{ width: column.width }}>
                      {column.key === 'name' && <button onClick={() => toggleDetailRow(entry.id)} className="relative h-[18px] w-[18px] flex-shrink-0 rounded-[6px]" style={detailSelectedRows.has(entry.id) ? { backgroundColor: '#007EA7' } : { border: '1px solid #A1B6C6' }}>{detailSelectedRows.has(entry.id) && <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}</button>}
                      <span className="truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{String(entry[column.key as keyof VaultDetailEntry] ?? '—')}</span>
                    </div>
                  </div>
                ))}
                <div className="w-1 h-9 opacity-80" style={{ background: 'linear-gradient(180deg, rgba(228, 247, 255, 0) 0%, #E4F7FF 100%)' }} />
                <div className="flex flex-row items-center gap-1 ml-auto pr-2">
                  <RowDeleteButton label={`Delete ${entry.name}`} onDelete={() => { setDetailEntries(current => current.filter(item => item.id !== entry.id)); setDetailSelectedRows(current => { const next = new Set(current); next.delete(entry.id); return next; }); }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <HorizontalTableScrollbar scrollRef={detailTableScrollRef} />

        {/* Pagination */}
        <div className="flex flex-row items-center justify-between flex-shrink-0 pt-2">
          <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3]">
            14 from 15,000 items
          </span>
          <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={DETAIL_ENTRIES.length} onPageChange={setCurrentPage} />
          <button className="flex items-center justify-center px-3 py-[6px] gap-1 border-2 border-[#D3E1EC] rounded-md h-8 hover:border-[#007EA7] transition-colors">
            <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">Create new</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white px-9 py-14 gap-8 min-h-full relative" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>
      {/* Header */}
      <PageHeader title="Secret vault" actions={<PageActionButton onClick={openCreatePanel}>Create new</PageActionButton>} />

      {/* Filter bar */}
      <div className="flex flex-row flex-wrap justify-between items-center gap-2 flex-shrink-0">
        <div className="flex flex-row items-center gap-1 flex-1 min-w-0">
          <OcrSearchField ariaLabel="Search secret vault" value={query} onChange={value => { setQuery(value); setCurrentPage(1); }} />
        </div>
        <div className="flex flex-row items-center p-[6px] gap-4 bg-white rounded flex-shrink-0">
          <BulkDeleteButton selectedCount={selectedRows.size} onDelete={() => { setVaultEntries(current => current.filter(row => !selectedRows.has(row.id))); setSelectedRows(new Set()); }} />
          <ColumnSettingsButton onClick={() => setShowMainColSettings(true)} />
          <ImportButton scope="Secret vault" />
          <button onClick={() => setVaultEntries(current => current.map(entry => ({ ...entry })))} className="w-4 h-4 flex items-center justify-center text-[#7288A3] hover:text-[#007EA7] transition-colors" title="REFRESH ALL">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {showMainColSettings && (
        <ColumnSettingsPanel
          columns={mainColumns}
          onSave={cols => setMainColumns(cols)}
          onClose={() => setShowMainColSettings(false)}
        />
      )}

      {/* Unified records table */}
      <div ref={mainTableScrollRef} className="-mt-2 flex min-h-0 flex-1 flex-col overflow-x-auto scrollbar-hide">
        <div style={{ minWidth: mainColumns.filter(column => column.visible).reduce((sum, column) => sum + column.width + 13, 82) }}>
          <div className="system-table-header-row mb-2 flex h-5 flex-row items-center gap-3 pl-3">
            {mainColumns.filter(column => column.visible).map((column, index) => (
              <div key={column.key} className="flex flex-row items-center gap-3">
                <div className="relative flex h-5 flex-shrink-0 items-center gap-[6px]" style={{ width: column.width }}>
                  {column.key === 'alias' && (
                    <button
                      type="button"
                      aria-label="Select all secret vault records"
                      aria-pressed={selectedRows.size === vaultEntries.length && vaultEntries.length > 0}
                      onClick={toggleAll}
                      className="relative mr-1 h-[18px] w-[18px] flex-shrink-0 rounded-[6px] border transition-colors"
                      style={selectedRows.size === vaultEntries.length && vaultEntries.length > 0
                        ? { backgroundColor: '#007EA7', borderColor: '#007EA7' }
                        : { backgroundColor: '#FFFFFF', borderColor: '#A1B6C6' }}
                    >
                      {selectedRows.size === vaultEntries.length && vaultEntries.length > 0 && (
                        <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  )}
                  <span className={`truncate font-montserrat text-[12px] font-medium leading-[18px] ${index === 0 ? 'text-[#10233A]' : 'text-[#7288A3]'}`}>{column.label}</span>
                  <ColumnSortButton columnLabel={column.label} direction={mainDirectionFor(column.key)} onDirectionChange={direction => { changeMainSort(column.key, direction); setCurrentPage(1); }} />
                  <ResizeHandle onMouseDown={event => startResizeMain(mainColumns.findIndex(item => item.key === column.key), event)} />
                </div>
              </div>
            ))}
            <div className="h-5 w-[82px] flex-shrink-0" />
          </div>

          {sortedEntries.map((entry, rowIndex) => (
            <div
              key={entry.id}
              onClick={() => openEdit(entry)}
              className={`flex h-10 cursor-pointer flex-row items-center gap-3 rounded pl-3 transition-colors ${
                rowIndex % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'
              } hover:bg-[#E6F2F6]`}
            >
              {mainColumns.filter(column => column.visible).map((column, columnIndex) => (
                <div key={column.key} className="flex flex-row items-center gap-3">
                  <div className="flex h-10 flex-shrink-0 items-center gap-[6px] overflow-hidden" style={{ width: column.width }}>
                    {column.key === 'alias' && (
                      <button
                        type="button"
                        aria-label={`Select secret vault record ${entry.alias} ${entry.id}`}
                        aria-pressed={selectedRows.has(entry.id)}
                        onClick={event => {
                          event.stopPropagation();
                          toggleRow(entry.id);
                        }}
                        className="relative h-[18px] w-[18px] flex-shrink-0 rounded-[6px] border transition-colors"
                        style={selectedRows.has(entry.id)
                          ? { backgroundColor: '#007EA7', borderColor: '#007EA7' }
                          : { backgroundColor: '#FFFFFF', borderColor: '#A1B6C6' }}
                      >
                        {selectedRows.has(entry.id) && (
                          <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    )}
                    <span className="block w-full truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">
                      {String(entry[column.key as keyof VaultEntry] ?? '—')}
                    </span>
                  </div>
                  {columnIndex < mainColumns.filter(item => item.visible).length - 1 && <div className="h-5 w-0 border-l border-transparent" />}
                </div>
              ))}
              <div className="ml-auto flex w-[82px] flex-shrink-0 items-center justify-end gap-1 pr-2">
                <button
                  type="button"
                  title="SECURITY ACCESS"
                  aria-label={`SECURITY ACCESS for secret vault ${entry.alias} ${entry.id}`}
                  onClick={event => {
                    event.stopPropagation();
                    onNavigateToAdministration?.({ module: 'Secret vault', resourceType: 'Secret vault entry', id: entry.id, name: entry.alias });
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded border-2 border-[#D3E1EC] bg-white text-[#7288A3] transition-colors hover:border-[#007EA7] hover:text-[#007EA7]"
                >
                  <Users size={16} />
                </button>
                <RowDeleteButton label={`Delete ${entry.alias}`} onDelete={() => { setVaultEntries(current => current.filter(item => item.id !== entry.id)); setSelectedRows(current => { const next = new Set(current); next.delete(entry.id); return next; }); }} />
              </div>
            </div>
          ))}

          {sortedEntries.length === 0 && (
            <div className="flex min-h-[340px] flex-col items-center justify-center gap-6">
              <div className="flex w-[320px] flex-col items-center gap-4">
                <span className="w-full text-center font-montserrat text-[18px] font-semibold leading-6 text-[#10233A]">Empty collection</span>
                <span className="w-full text-center font-montserrat text-[14px] font-medium leading-5 text-[#10233A]">Press "Create new" button to start your work</span>
              </div>
              <PageActionButton onClick={openCreatePanel}>Create new</PageActionButton>
            </div>
          )}
        </div>
      </div>

      <HorizontalTableScrollbar scrollRef={mainTableScrollRef} />
      <div className="flex h-8 w-full items-center">
        <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={vaultEntries.length} onPageChange={setCurrentPage} />
      </div>

      {/* Edit Panel */}
      {false && panelMode === 'edit' && selectedEntry && (
        <div className="absolute inset-y-0 right-0 z-40 flex">
          <div className="w-[440px] bg-white flex flex-col h-full" style={{ boxShadow: '-2px 0px 0px #E5EDF9' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 flex-shrink-0">
              <span className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">Edit secret vault entry</span>
              <button onClick={closePanel} className="w-6 h-6 flex items-center justify-center hover:opacity-70">
                <X size={16} className="text-[#7288A3]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="flex flex-col gap-6">
                {/* Alias field */}
                <div className="flex flex-col gap-2">
                  <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Alias <span className="text-red-500">*</span></span>
                  <div className="flex items-center h-[42px] px-[14px] border border-[#D3E1EC] rounded-lg bg-white">
                    <span className="font-montserrat font-medium text-[14px] leading-[140%] text-[#A1B6C6]">Enter alias...</span>
                  </div>
                </div>

                {/* Value field with JSON editor */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Value <span className="text-red-500">*</span></span>
                    <button onClick={() => setShowValue(!showValue)} className="hover:opacity-70">
                      {showValue ? <Eye size={16} className="text-[#7288A3]" /> : <EyeOff size={16} className="text-[#7288A3]" />}
                    </button>
                  </div>

                  {/* JSON Editor */}
                  <div className="flex flex-col border border-[#E5EDF9] rounded-lg overflow-hidden">
                    {/* Editor area */}
                    <div className="flex flex-row h-[392px]">
                      {/* Line numbers */}
                      <div className="flex flex-col items-center py-4 w-12 bg-[#F8FAFC] flex-shrink-0">
                        {selectedEntry.value.split('\n').map((_, i) => (
                          <span key={i} className="font-roboto font-medium text-[14px] leading-5 text-[#A1B6C6] tracking-[0.5px]">{i + 1}</span>
                        ))}
                      </div>
                      {/* Code content */}
                      <div className="flex-1 p-4 overflow-auto">
                        <pre className="font-roboto font-medium text-[14px] leading-5 text-[#10233A] tracking-[0.5px] whitespace-pre-wrap">
                          {showValue ? selectedEntry.value : selectedEntry.value.replace(/[^\s{}[\]:,"]/g, '*')}
                        </pre>
                      </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-3 py-3 bg-[#F8FAFC] border-t border-[#E5EDF9]">
                      <div className="flex items-center gap-2">
                        {/* Tree view toggle */}
                        <div className="flex items-center gap-2">
                          <div className={`w-[30px] h-[18px] rounded-[13px] relative cursor-pointer ${!jsonMode ? 'bg-[#007EA7]' : 'bg-[#A1B6C6]'}`} onClick={() => setJsonMode(!jsonMode)}>
                            <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${!jsonMode ? 'left-[14px]' : 'left-[2px]'}`} />
                          </div>
                          <span className="font-montserrat font-medium text-[14px] leading-5 text-[#7288A3]">Tree View</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button className="hover:opacity-70"><Map size={16} className="text-[#7288A3]" /></button>
                        <button className="hover:opacity-70"><Search size={16} className="text-[#7288A3]" /></button>
                        <button className="hover:opacity-70"><WrapText size={16} className="text-[#7288A3]" /></button>
                        <button className="hover:opacity-70"><Copy size={16} className="text-[#7288A3]" /></button>
                        <button className="hover:opacity-70"><Focus size={16} className="text-[#7288A3]" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-[30px] h-[18px] rounded-[13px] relative cursor-pointer ${jsonMode ? 'bg-[#007EA7]' : 'bg-[#A1B6C6]'}`} onClick={() => setJsonMode(!jsonMode)}>
                          <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${jsonMode ? 'left-[14px]' : 'left-[2px]'}`} />
                        </div>
                        <span className="font-montserrat font-medium text-[14px] leading-5 text-[#7288A3]">JSON</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-6 py-6 flex-shrink-0">
              <button
                onClick={closePanel}
                className="flex-1 flex items-center justify-center h-[42px] border-2 border-[#D3E1EC] rounded-lg font-montserrat font-semibold text-[16px] leading-6 text-[#7288A3] hover:border-[#007EA7] transition-colors"
              >
                Cancel
              </button>
              <button data-system-action="true" className="flex-1 flex items-center justify-center h-[42px] bg-[#007EA7] rounded-lg font-montserrat font-semibold text-[16px] leading-6 text-white hover:bg-[#006b8f] transition-colors">
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Panel */}
      {(panelMode === 'create' || panelMode === 'edit') && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-[#10233A]/20" onMouseDown={closePanel}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={panelMode === 'edit' ? `Edit secret vault entry ${selectedEntry?.alias ?? ''}` : 'Create secret vault entry'}
            className={`flex h-full flex-col gap-6 bg-white p-6 shadow-[-2px_0_0_#E5EDF9] transition-[width] ${createFullScreen ? 'w-full' : 'w-[520px] max-w-[calc(100vw-24px)]'}`}
            onMouseDown={event => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-montserrat text-[24px] font-semibold leading-8 text-[#10233A]">{panelMode === 'edit' ? 'Edit secret vault entry' : 'Create secret vault entry'}</h2>
              <button type="button" title="Close" aria-label={`Close ${panelMode === 'edit' ? 'edit' : 'create'} secret vault entry`} onClick={closePanel} className="text-[#7288A3] hover:text-[#10233A]">
                <X size={28} />
              </button>
            </div>

            <label className="flex flex-col gap-2">
              <span className="font-montserrat text-[14px] font-semibold text-[#10233A]">Alias <span className="text-[#E45858]">*</span></span>
              <input
                value={newAlias}
                onChange={event => setNewAlias(event.target.value)}
                placeholder="Enter alias"
                className="h-[42px] border-b border-[#A1B6C6] bg-white px-0 font-montserrat text-[16px] font-medium text-[#10233A] outline-none focus:border-[#007EA7]"
              />
            </label>

            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <span className="font-montserrat text-[14px] font-semibold text-[#10233A]">Value <span className="text-[#E45858]">*</span></span>
              <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-lg border border-[#E5EDF9] bg-white">
                <div className="flex min-h-0 flex-1 overflow-auto">
                  {!jsonMode ? (
                    <div className="flex flex-1 flex-col gap-2 p-4 font-mono text-[14px] text-[#10233A]">
                      <div className="flex items-center gap-2">
                        <ChevronRight size={16} className="rotate-90 text-[#7288A3]" />
                        <span className="text-[#A61B1B]">value</span>
                        <span className="text-[#A1A1A1]">:</span>
                        <input
                          value={jsonValue}
                          onChange={event => setJsonValue(event.target.value)}
                          placeholder="Enter value"
                          className="min-w-0 flex-1 rounded border border-[#D3E1EC] px-2 py-1 font-mono text-[#1459A6] outline-none focus:border-[#007EA7]"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex w-12 flex-shrink-0 flex-col items-center bg-[#F8FAFC] py-4 font-mono text-[14px] leading-6 text-[#7288A3]">
                        {jsonValue.split('\n').map((_, index) => <span key={index} className="h-6 select-none">{index + 1}</span>)}
                      </div>
                      <textarea
                        value={jsonValue}
                        onChange={event => setJsonValue(event.target.value)}
                        placeholder="Enter value"
                        className="min-h-full flex-1 resize-none p-4 font-mono text-[15px] leading-6 text-[#10233A] outline-none"
                        spellCheck={false}
                      />
                    </>
                  )}
                </div>
                <div className="flex h-11 flex-shrink-0 items-center justify-between border-t border-[#E5EDF9] bg-[#F8FAFC] px-3">
                  <button type="button" role="switch" aria-checked={!jsonMode} onClick={() => setJsonMode(value => !value)} className="flex items-center gap-3 font-montserrat text-[14px] font-medium text-[#10233A]">
                    <span className={`relative h-[20px] w-[36px] rounded-full border ${!jsonMode ? 'border-[#007EA7] bg-[#007EA7]' : 'border-[#A1B6C6] bg-[#E5EDF9]'}`}>
                      <span className={`absolute left-[2px] top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform ${!jsonMode ? 'translate-x-4' : ''}`} />
                    </span>
                    Tree View
                  </button>
                  <div className="flex items-center gap-4 text-[#7288A3]">
                    <button type="button" title="MAP"><Map size={18} /></button>
                    <button type="button" title="SEARCH"><Search size={18} /></button>
                    <button type="button" title="WRAP TEXT"><AlignLeft size={18} /></button>
                    <button type="button" title="COPY" aria-label="COPY secret vault value" onClick={() => navigator.clipboard?.writeText(jsonValue)}><Copy size={18} /></button>
                    <button type="button" title="FULL SCREEN" onClick={() => setCreateFullScreen(value => !value)}>{createFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
                  </div>
                </div>
              </div>
            </div>

            <button type="button" role="switch" aria-checked={jsonMode} onClick={() => setJsonMode(value => !value)} className="flex items-center gap-3 self-start font-montserrat text-[14px] font-medium text-[#10233A]">
              <span className={`relative h-[20px] w-[36px] rounded-full border ${jsonMode ? 'border-[#007EA7] bg-[#007EA7]' : 'border-[#A1B6C6] bg-[#E5EDF9]'}`}>
                <span className={`absolute left-[2px] top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform ${jsonMode ? 'translate-x-4' : ''}`} />
              </span>
              JSON
            </button>

            <div className="mt-auto flex justify-end">
              <button
                type="button"
                data-system-action="true"
                disabled={!newAlias.trim() || !jsonValue.trim()}
                onClick={panelMode === 'edit' ? updateVaultEntry : createVaultEntry}
                className="flex h-[42px] items-center justify-center rounded-lg border-2 border-[#D3E1EC] bg-white px-4 font-montserrat text-[16px] font-semibold text-[#7288A3] enabled:active:border-[#007EA7] enabled:active:bg-[#007EA7] enabled:active:text-white disabled:cursor-not-allowed disabled:border-[#E5E7EB] disabled:bg-[#F5F5F5] disabled:text-[#B4B6B8]"
              >
                {panelMode === 'edit' ? 'UPDATE' : 'CREATE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {panelMode === 'import' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-2xl p-6 flex flex-col gap-6 w-[429px]" style={{ boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#10233A]">Please provide secure entries</span>
              <button onClick={closePanel} className="w-6 h-6 flex items-center justify-center hover:opacity-70">
                <X size={16} className="text-[#7288A3]" />
              </button>
            </div>

            {/* Description + upload */}
            <div className="flex flex-col items-center gap-4">
              <span className="font-montserrat font-medium text-[14px] leading-5 text-[#7288A3]">
                Please, provide CSV file with columns: Alias, Value.
              </span>
              <button data-system-action="true" className="flex items-center justify-center px-3 py-[6px] bg-[#007EA7] rounded-md h-8 hover:bg-[#006b8f] transition-colors">
                <span className="font-montserrat font-semibold text-[14px] leading-5 text-white">Add</span>
              </button>
            </div>

            {/* Selects / dropdown */}
            <div className="flex flex-col gap-2">
              <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Selects</span>
              <div className="flex items-center justify-between h-[42px] px-[14px] border border-[#D3E1EC] rounded-lg bg-white cursor-pointer">
                <span className="font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A]">Select...</span>
                <ChevronRight size={12} className="text-[#7288A3] rotate-90" />
              </div>
            </div>

            {/* Override checkbox */}
            <div className="flex items-center gap-3">
              <div className="w-[18px] h-[18px] rounded-md border border-[#A1B6C6] flex items-center justify-center" />
              <span className="font-montserrat font-medium text-[14px] leading-[140%] text-[#7288A3]">Override existing keys</span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={closePanel}
                className="flex items-center justify-center px-4 h-[42px] border-2 border-[#D3E1EC] rounded-lg font-montserrat font-semibold text-[16px] leading-6 text-[#7288A3] hover:border-[#007EA7] transition-colors"
              >
                Cancel
              </button>
              <button onClick={() => setPanelMode('create')} className="flex items-center justify-center px-4 h-[42px] bg-[#007EA7] rounded-lg font-montserrat font-semibold text-[16px] leading-6 text-white hover:bg-[#006b8f] transition-colors">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
