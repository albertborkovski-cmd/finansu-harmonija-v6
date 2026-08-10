import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useColumnResize, ResizeHandle } from './useColumnResize';
import ColumnSettingsPanel, { type ColConfig } from './ColumnSettingsPanel';
import { PageActionButton, PageHeader } from './PageHeader';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import OcrSearchField from './OcrSearchField';
import { BulkDeleteButton, RowDeleteButton } from './DeleteButtons';
import ColumnSortButton, { type SortDirection } from './ColumnSortButton';
import { ColumnSettingsButton } from './ScopedActionButtons';
import StopButton from './StopButton';
import StopAllButton from './StopAllButton';
import RecordRefreshButton from './RecordRefreshButton';
import RefreshAllButton from './RefreshAllButton';
import { RunDetailCard } from './AutomationProcessDetailView';
import {
  deleteAggregatedRuns,
  getAggregatedRuns,
  RUN_STATUSES,
  updateAggregatedRun,
  type AggregatedRun,
  type RunStatus,
} from './automationRunsStore';

interface ColumnDef {
  id: string;
  label: string;
  width: number;
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'runId', label: 'Run ID', width: 180 },
  { id: 'processName', label: 'Process name', width: 260 },
  { id: 'tasksCount', label: 'Tasks count', width: 120 },
  { id: 'status', label: 'Status', width: 130 },
  { id: 'createdBy', label: 'Created by', width: 160 },
  { id: 'createdDate', label: 'Creation date', width: 150 },
  { id: 'updatedBy', label: 'Updated by', width: 160 },
  { id: 'lastUpdate', label: 'Last update', width: 150 },
];

const DEFAULT_VISIBLE = ['runId', 'processName', 'tasksCount', 'status', 'createdBy', 'createdDate'];
const ROWS_PER_PAGE = 20;

function rowKey(run: AggregatedRun) {
  return `${run.processId}:${run.id}`;
}

function RowCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={event => { event.stopPropagation(); onChange(); }} className={`relative flex h-[18px] w-[18px] flex-shrink-0 self-center items-center justify-center rounded-[6px] border ${checked ? 'border-[#007EA7] bg-[#007EA7]' : 'border-[#A1B6C6] bg-white'}`}>
      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  );
}

function StatusCell({ status }: { status: RunStatus }) {
  const color = status === 'In Progress' || status === 'Submitted' || status === 'Queued' || status === 'Deploying on Node'
    ? '#007EA7'
    : status === 'Completed'
      ? '#0ED8A8'
      : status === 'Failed'
        ? '#E45858'
        : status === 'Stopping'
          ? '#F2994A'
          : '#7288A3';
  return <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /><span>{status}</span></span>;
}

function cellValue(run: AggregatedRun, columnId: string) {
  switch (columnId) {
    case 'runId': return run.id;
    case 'processName': return run.processName;
    case 'tasksCount': return String(run.tasks);
    case 'status': return run.status;
    case 'createdBy': return run.node;
    case 'createdDate': return run.created;
    case 'updatedBy': return run.node;
    case 'lastUpdate': return run.created;
    default: return '—';
  }
}

export default function RunsManagementView() {
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columnOrder, setColumnOrder] = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE);
  const [runs, setRuns] = useState<AggregatedRun[]>(() => getAggregatedRuns());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [selectedRunKey, setSelectedRunKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<RunStatus>>(new Set());
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const reloadRuns = useCallback(() => setRuns(getAggregatedRuns()), []);
  useEffect(() => {
    const handleRunsChanged = () => reloadRuns();
    window.addEventListener('finansu-harmonija:runs-changed', handleRunsChanged);
    return () => window.removeEventListener('finansu-harmonija:runs-changed', handleRunsChanged);
  }, [reloadRuns]);

  const saveColumnSettings = (nextColumns: ColConfig[]) => {
    setColumnOrder(nextColumns.map(column => ({ id: column.key, label: column.label, width: column.width })));
    setVisibleColumns(nextColumns.filter(column => column.visible).map(column => column.key));
  };

  const orderedVisible = columnOrder.filter(column => visibleColumns.includes(column.id));
  const colConfigs: ColConfig[] = orderedVisible.map(column => ({ key: column.id, label: column.label, width: column.width, visible: true }));
  const setColConfigs = useCallback((columns: ColConfig[]) => {
    setColumnOrder(previous => previous.map(column => {
      const updated = columns.find(candidate => candidate.key === column.id);
      return updated ? { ...column, width: updated.width } : column;
    }));
  }, []);
  const { startResize } = useColumnResize(colConfigs, setColConfigs);

  const filteredRuns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? runs.filter(run => `${run.id} ${run.processName} ${run.tasks} ${run.status} ${run.node} ${run.created}`.toLowerCase().includes(normalizedQuery))
      : [...runs];
    const statusFiltered = selectedStatuses.size ? filtered.filter(run => selectedStatuses.has(run.status)) : filtered;
    if (sortDirection && sortColumn) statusFiltered.sort((left, right) => String(cellValue(left, sortColumn)).localeCompare(String(cellValue(right, sortColumn)), undefined, { numeric: true, sensitivity: 'base' }) * (sortDirection === 'asc' ? 1 : -1));
    return statusFiltered;
  }, [query, runs, selectedStatuses, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / ROWS_PER_PAGE));
  const pageRuns = filteredRuns.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const allPageSelected = pageRuns.length > 0 && pageRuns.every(run => selectedKeys.has(rowKey(run)));
  const selectedRun = runs.find(run => rowKey(run) === selectedRunKey);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const updateRun = (run: AggregatedRun, status: RunStatus) => {
    updateAggregatedRun(run.processId, run.id, current => ({ ...current, status }));
    reloadRuns();
  };

  const deleteRuns = (targets: AggregatedRun[]) => {
    deleteAggregatedRuns(targets.map(run => ({ processId: run.processId, runId: run.id })));
    const deletedKeys = new Set(targets.map(rowKey));
    setSelectedKeys(current => new Set([...current].filter(key => !deletedKeys.has(key))));
    if (selectedRunKey && deletedKeys.has(selectedRunKey)) setSelectedRunKey(null);
    reloadRuns();
  };

  if (selectedRun) {
    return (
      <div className="flex min-h-full flex-col bg-white px-9 py-14" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>
        <PageHeader title="Runs management" />
        <div className="mt-8 flex min-h-0 flex-1 flex-col">
          <RunDetailCard
            run={selectedRun}
            onBack={() => setSelectedRunKey(null)}
            onUpdate={status => updateRun(selectedRun, status)}
            onRefresh={() => updateRun(selectedRun, 'In Progress')}
            onDelete={() => deleteRuns([selectedRun])}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-col gap-8 bg-white px-9 py-14" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>
      <PageHeader title="Runs management" />

      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-row flex-wrap items-center justify-between gap-2">
          <OcrSearchField ariaLabel="Search runs" value={query} onChange={value => { setQuery(value); setPage(1); }} />
          <div className="flex flex-row items-center gap-4">
            <BulkDeleteButton selectedCount={selectedKeys.size} onDelete={() => deleteRuns(runs.filter(run => selectedKeys.has(rowKey(run))))} />
            <StopAllButton
              disabled={selectedKeys.size === 0 || !runs.some(run => selectedKeys.has(rowKey(run)) && run.status !== 'Stopped' && run.status !== 'Stopped Idle')}
              onStop={() => {
                runs.filter(run => selectedKeys.has(rowKey(run))).forEach(run => {
                  updateAggregatedRun(run.processId, run.id, current => ({ ...current, status: 'Stopped' }));
                });
                reloadRuns();
              }}
            />
            <ColumnSettingsButton onClick={() => setShowColumnSettings(true)} />
            <RefreshAllButton
              disabled={runs.length === 0}
              onRefresh={reloadRuns}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden bg-white">
          <div ref={tableScrollRef} className="min-h-[340px] max-h-[calc(100vh-360px)] overflow-auto bg-white scrollbar-hide">
            <div style={{ minWidth: pageRuns.length > 0 ? orderedVisible.reduce((sum, column) => sum + column.width, 0) + 140 : '100%' }}>
              <div className="system-table-header-row flex h-5 flex-row items-center pl-3">
                <div className="system-table-select-cell flex w-5 flex-shrink-0 items-center">
                  <RowCheckbox checked={allPageSelected} label="Select all runs on page" onChange={() => {
                    setSelectedKeys(current => {
                      const next = new Set(current);
                      pageRuns.forEach(run => allPageSelected ? next.delete(rowKey(run)) : next.add(rowKey(run)));
                      return next;
                    });
                  }} />
                </div>
                {orderedVisible.map((column, index) => (
                  <div key={column.id} className="flex flex-row items-center">
                    <div className="relative flex flex-shrink-0 items-center gap-[5px] px-2" style={{ width: column.width }}>
                      <span className={`font-montserrat text-[12px] font-medium leading-[18px] ${column.id === 'runId' ? 'text-[#10233A]' : 'text-[#7288A3]'}`}>{column.label}</span>
                      <ColumnSortButton columnLabel={column.label} direction={sortColumn === column.id ? sortDirection : null} onDirectionChange={direction => { setSortColumn(direction ? column.id : null); setSortDirection(direction); setPage(1); }} />
                      {column.id === 'status' && (
                        <>
                          <button type="button" aria-label="Filter Status" aria-haspopup="listbox" aria-expanded={statusFilterOpen} onClick={() => setStatusFilterOpen(open => !open)} className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${statusFilterOpen || selectedStatuses.size ? 'bg-[#E5EDF9] text-[#007EA7]' : 'text-[#7288A3] hover:bg-[#F8FDFF] hover:text-[#007EA7]'}`}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 3.5H13.5L9.5 8.1V12.2L6.5 13.5V8.1L2.5 3.5Z" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                          {statusFilterOpen && (
                            <div role="listbox" aria-label="Run statuses" className="absolute left-2 top-7 z-50 w-[250px] overflow-hidden rounded-lg border border-[#D3E1EC] bg-white p-2 shadow-[0_10px_28px_rgba(16,35,58,0.16)]">
                              <div className="flex items-center justify-between border-b border-[#E5EDF9] px-3 pb-2 pt-1">
                                <span className="font-montserrat text-[13px] font-semibold text-[#10233A]">Filter by status</span>
                                {selectedStatuses.size > 0 && <button type="button" onClick={() => { setSelectedStatuses(new Set()); setPage(1); }} className="font-montserrat text-[11px] font-semibold text-[#007EA7] hover:underline">Clear</button>}
                              </div>
                              <div className="max-h-[280px] overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
                                {RUN_STATUSES.map(status => {
                                  const checked = selectedStatuses.has(status);
                                  return (
                                    <button key={status} type="button" role="option" aria-selected={checked} onClick={() => { setSelectedStatuses(current => { const next = new Set(current); next.has(status) ? next.delete(status) : next.add(status); return next; }); setPage(1); }} className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left transition-colors hover:bg-[#F8FDFF] ${checked ? 'bg-[#EAF4FB]' : 'bg-white'}`}>
                                      <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[4px] border ${checked ? 'border-[#4056B5] bg-[#4056B5]' : 'border-[#7288A3] bg-white'}`}>{checked && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
                                      <span className="font-montserrat text-[14px] font-medium text-[#10233A]">{status}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      <ResizeHandle onMouseDown={event => startResize(index, event)} />
                    </div>
                  </div>
                ))}
                <div className="w-[104px] flex-shrink-0" />
              </div>

              <div className="mt-4 flex flex-col">
                {pageRuns.map((run, index) => (
                  <div key={rowKey(run)} className={`flex h-10 w-full flex-row items-center rounded-lg transition-colors ${index % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'} hover:bg-[#E7F4F9]`}>
                    <div className="system-table-select-cell flex w-8 flex-shrink-0 items-center pl-3">
                      <RowCheckbox checked={selectedKeys.has(rowKey(run))} label={`Select ${run.id} from ${run.processName}`} onChange={() => setSelectedKeys(current => { const next = new Set(current); next.has(rowKey(run)) ? next.delete(rowKey(run)) : next.add(rowKey(run)); return next; })} />
                    </div>
                    {orderedVisible.map(column => (
                      <div key={column.id} className="flex h-10 flex-shrink-0 items-center overflow-hidden px-2 font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]" style={{ width: column.width }}>
                        {column.id === 'runId'
                          ? <button type="button" onClick={() => setSelectedRunKey(rowKey(run))} className="truncate font-medium text-[#007EA7] hover:underline">{run.id}</button>
                          : column.id === 'status'
                            ? <StatusCell status={run.status} />
                            : <span className="truncate">{cellValue(run, column.id)}</span>}
                      </div>
                    ))}
                    <div className="ml-auto flex w-[104px] flex-shrink-0 items-center justify-end gap-1 pr-2">
                      <StopButton size={14} stopped={run.status === 'Stopped' || run.status === 'Stopped Idle'} label={`STOP ${run.id}`} onStop={() => updateRun(run, 'Stopped')} />
                      <RecordRefreshButton size={14} label={`REDO ${run.id}`} onRefresh={() => updateRun(run, 'In Progress')} />
                      <RowDeleteButton label={`DELETE ${run.id}`} onDelete={() => deleteRuns([run])} />
                    </div>
                  </div>
                ))}
                {!pageRuns.length && (
                  <div className="flex min-h-[340px] w-full flex-col items-center justify-center gap-4">
                    <span className="w-full text-center font-montserrat text-[18px] font-semibold leading-6 text-[#10233A]">{runs.length === 0 ? 'Empty collection' : 'No results found'}</span>
                    <span className="w-full max-w-[320px] text-center font-montserrat text-[14px] font-medium leading-5 text-[#10233A]">{runs.length === 0 ? 'There are no run records to display' : 'Try adjusting your search to find what you are looking for'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-20 flex-shrink-0 bg-white">
            <HorizontalTableScrollbar scrollRef={tableScrollRef} />
          </div>

          <div className="relative z-20 flex h-12 w-full flex-shrink-0 flex-row items-center justify-between bg-white pt-4">
            <TablePagination currentPage={page} totalPages={totalPages} itemCount={filteredRuns.length} onPageChange={setPage} />
            <div className="flex h-8 flex-row items-center gap-[14px]">
              <span className="whitespace-nowrap font-montserrat text-[12px] font-normal leading-[18px] text-[#7288A3]">{pageRuns.length} from {filteredRuns.length} items</span>
              <button className="flex h-8 min-w-[107px] items-center justify-center whitespace-nowrap rounded-[6px] border-2 border-[#D3E1EC] bg-white px-3 py-[6px]"><span className="font-montserrat text-[14px] font-semibold leading-5 text-[#7288A3]">Show more</span></button>
            </div>
          </div>
        </div>
      </div>

      {showColumnSettings && (
        <ColumnSettingsPanel
          columns={columnOrder.map(column => ({ key: column.id, label: column.label, width: column.width, visible: visibleColumns.includes(column.id) }))}
          defaultColumns={DEFAULT_COLUMNS.map(column => ({ key: column.id, label: column.label, width: column.width, visible: DEFAULT_VISIBLE.includes(column.id) }))}
          onSave={saveColumnSettings}
          onClose={() => setShowColumnSettings(false)}
        />
      )}
    </div>
  );
}
