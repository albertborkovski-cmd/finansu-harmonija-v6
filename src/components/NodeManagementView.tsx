import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Columns, Download, RefreshCw, RotateCw, Trash2, X,
  ChevronLeft, ChevronRight, ChevronDown, ArrowLeft, Power,
  Users, Activity, CheckCircle2, Map, AlignLeft, Copy,
  Maximize2, Minimize2, ExternalLink
} from 'lucide-react';
import { useColumnResize, ResizeHandle } from './useColumnResize';
import { NodeMetricsTab } from './NodeDetailView';
import ColumnSettingsPanel, { type ColConfig } from './ColumnSettingsPanel';
import { PageActionButton, PageHeader } from './PageHeader';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import OcrSearchField from './OcrSearchField';
import { BulkDeleteButton, RowDeleteButton } from './DeleteButtons';
import { ColumnSettingsButton } from './ScopedActionButtons';
import RefreshAllButton from './RefreshAllButton';
import ImportButton from './ImportButton';
import MultiSelectField from './MultiSelectField';
import StopButton from './StopButton';
import RecordRefreshButton from './RecordRefreshButton';
import RedoAllButton from './RedoAllButton';
import StopAllButton from './StopAllButton';
import ColumnSortButton, { useMultiColumnSort } from './ColumnSortButton';
import { saveNodeNames } from './nodeRecordsStore';
import type { SecurityAccessTarget } from './ResourceSecurityAccessView';
import { matchesTextSearch } from '../utils/textSearch';
import AutomationProcessDetailView, { AlertsTab, NodesTab, RunsTab, type AlertRecord, type OcrProcess } from './AutomationProcessDetailView';
import {
  deleteAggregatedRuns,
  getAggregatedRuns,
  updateAggregatedRun,
  type RunRecord,
} from './automationRunsStore';
import {
  createLocalNodeMonitoring,
  getNodeFeatures,
  getNodeMonitoring,
  redoNodeFeatures,
  updateNodeFeatureConfiguration as saveNodeFeatureConfiguration,
  updateNodeFeatureStatus,
  type NodeAvailabilityStatus,
  type NodeFeatureMonitoring,
  type NodeFeatureStatus,
  type NodeMonitoringData,
} from '../services/nodeMonitoringService';

interface NodeRow {
  id: string;
  name: string;
  description: string;
  capabilities: string;
  workingDirectory?: string;
  dedicated?: boolean;
  lastSeen: string;
  status: NodeAvailabilityStatus;
  createdBy: string;
  creationDate: string;
}

const SAMPLE_NODES: NodeRow[] = [
  { id: '1', name: 'LX 1', description: 'AP_RUN SELENIUM DESKTOP', capabilities: 'Selenium, Desktop', lastSeen: '10.04.2026 12:22', status: 'Available', createdBy: 'John Brick', creationDate: '10.04.2026' },
  { id: '2', name: 'LX 2', description: 'AP_RUN SELENIUM DESKTOP', capabilities: 'Selenium, Desktop', lastSeen: '10.04.2026 12:22', status: 'Available', createdBy: 'Jane Smith', creationDate: '10.04.2026' },
  { id: '3', name: 'LX 3', description: 'AP_RUN SELENIUM DESKTOP', capabilities: 'Selenium, Desktop', lastSeen: '10.04.2026 12:22', status: 'Available', createdBy: 'John Brick', creationDate: '09.04.2026' },
  { id: '4', name: 'LX 4', description: 'AP_RUN SELENIUM DESKTOP', capabilities: 'Selenium, Desktop', lastSeen: '10.04.2026 12:22', status: 'Inactive', createdBy: 'Jane Smith', creationDate: '08.04.2026' },
  { id: '5', name: 'LX 5', description: 'AP_DATA_EXTRACT', capabilities: 'Data Extract', lastSeen: '09.04.2026 15:10', status: 'Available', createdBy: 'John Brick', creationDate: '07.04.2026' },
  { id: '6', name: 'LX 6', description: 'AP_REPORT_GEN', capabilities: 'Report Gen', lastSeen: '09.04.2026 11:45', status: 'Available', createdBy: 'Jane Smith', creationDate: '06.04.2026' },
  { id: '7', name: 'LX 7', description: 'AP_RUN SELENIUM DESKTOP', capabilities: 'Selenium, Desktop', lastSeen: '08.04.2026 09:30', status: 'Inactive', createdBy: 'John Brick', creationDate: '05.04.2026' },
  { id: '8', name: 'LX 8', description: 'AP_DATA_EXTRACT', capabilities: 'Data Extract', lastSeen: '08.04.2026 08:15', status: 'Available', createdBy: 'Jane Smith', creationDate: '04.04.2026' },
];

interface ColumnDef {
  id: string;
  label: string;
  width: number;
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'name', label: 'Name', width: 166, visible: true },
  { id: 'description', label: 'Description', width: 200, visible: true },
  { id: 'capabilities', label: 'Capabilities', width: 160, visible: true },
  { id: 'lastSeen', label: 'Last seen', width: 140, visible: true },
  { id: 'status', label: 'Status', width: 100, visible: true },
  { id: 'createdBy', label: 'Created by', width: 130, visible: true },
  { id: 'creationDate', label: 'Creation date', width: 120, visible: true },
];

const DETAIL_TABS = ['Details', 'Configuration parameters', 'Runs', 'Features', 'Logs', 'Metrics', 'Notifications'] as const;
type StaticDetailTab = typeof DETAIL_TABS[number];
type FeatureLogTab = `feature-logs:${string}`;
type DetailTab = StaticDetailTab | FeatureLogTab;

const FEATURE_LOG_TAB_PREFIX = 'feature-logs:';

function getFeatureLogTabId(featureName: string): FeatureLogTab {
  return `${FEATURE_LOG_TAB_PREFIX}${featureName}`;
}

function getFeatureNameFromLogTab(tab: DetailTab): string | null {
  return tab.startsWith(FEATURE_LOG_TAB_PREFIX) ? tab.slice(FEATURE_LOG_TAB_PREFIX.length) : null;
}

function getFeatureLogTabLabel(featureName: string): string {
  const words = featureName.split(/[_\s-]+/).filter(Boolean);
  const formatted = words.map((word, index) => {
    if (index === 0 && word.length <= 3) return word.toUpperCase();
    const lower = word.toLowerCase();
    return index === 0 ? `${lower.charAt(0).toUpperCase()}${lower.slice(1)}` : lower;
  });
  return `${formatted.join(' ')} logs`;
}

const FEATURE_ORDER = ['SELENIUM_DIRECT', 'SELENIUM_STANDALONE', 'AP_RUN'];

function orderNodeFeatures(features: NodeFeatureMonitoring[]): NodeFeatureMonitoring[] {
  return features
    .map(feature => ({ ...feature }))
    .sort((left, right) => {
      const leftIndex = FEATURE_ORDER.indexOf(left.name);
      const rightIndex = FEATURE_ORDER.indexOf(right.name);
      return (leftIndex < 0 ? FEATURE_ORDER.length : leftIndex) - (rightIndex < 0 ? FEATURE_ORDER.length : rightIndex);
    });
}

export default function NodeManagementView({
  onNavigateToAutomationProcess,
  onNavigateToSecurityAccess,
}: {
  onNavigateToAutomationProcess?: (process: OcrProcess, run?: RunRecord) => void;
  onNavigateToSecurityAccess?: (target: SecurityAccessTarget) => void;
}) {
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [detailNode, setDetailNode] = useState<NodeRow | null>(null);
  const [automationProcessFromRun, setAutomationProcessFromRun] = useState<OcrProcess | null>(null);
  const [automationRunIdFromNode, setAutomationRunIdFromNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('Details');
  const [showNewPanel, setShowNewPanel] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [currentPage, setCurrentPage] = useState(1);
  const [nodes, setNodes] = useState<NodeRow[]>(SAMPLE_NODES);
  const [query, setQuery] = useState('');
  const filteredNodes = useMemo(() => nodes.filter(node => matchesTextSearch(node, query)), [nodes, query]);
  const { sortedRows: sortedNodes, changeSort, directionFor } = useMultiColumnSort(filteredNodes, (node, key) => node[key as keyof NodeRow] as string | number | undefined);
  const totalPages = 10;

  useEffect(() => {
    saveNodeNames(nodes.map(node => node.name));
  }, [nodes]);

  const [newNode, setNewNode] = useState({ name: '', description: '', connectionString: '', licenseKey: '', capabilities: [] as string[], dedicated: false });
  const [capInput, setCapInput] = useState('');

  const exportNode = (node: NodeRow) => {
    const blob = new Blob([JSON.stringify(node, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${node.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === nodes.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(nodes.map(n => n.id)));
  };

  const visibleCols = columns.filter(c => c.visible);

  // Adapter for useColumnResize hook
  const colConfigs: ColConfig[] = visibleCols.map(c => ({ key: c.id, label: c.label, width: c.width, visible: c.visible }));
  const setColConfigs = useCallback((cols: ColConfig[]) => {
    setColumns(prev => prev.map(c => {
      const updated = cols.find(uc => uc.key === c.id);
      return updated ? { ...c, width: updated.width } : c;
    }));
  }, []);
  const { startResize } = useColumnResize(colConfigs, setColConfigs);

  const openColumnSettings = () => {
    setShowColumnSettings(true);
  };

  const saveColumnSettings = (nextColumns: ColConfig[]) => {
    setColumns(nextColumns.map(column => ({
      id: column.key,
      label: column.label,
      width: column.width,
      visible: column.visible,
    })));
    setShowColumnSettings(false);
  };

  const handleNewPanelClose = () => {
    if (newNode.name || newNode.description || newNode.connectionString || newNode.licenseKey) {
      setShowConfirmClose(true);
    } else {
      setShowNewPanel(false);
    }
  };

  const addCapability = () => {
    if (capInput.trim() && !newNode.capabilities.includes(capInput.trim())) {
      setNewNode({ ...newNode, capabilities: [...newNode.capabilities, capInput.trim()] });
      setCapInput('');
    }
  };

  const removeCapability = (cap: string) => {
    setNewNode({ ...newNode, capabilities: newNode.capabilities.filter(c => c !== cap) });
  };

  const updateNodeStatus = useCallback((id: string, status: NodeAvailabilityStatus) => {
    setNodes(current => current.map(node => node.id === id ? { ...node, status } : node));
    setDetailNode(current => current?.id === id ? { ...current, status } : current);
  }, []);

  const updateNodeDetails = useCallback((id: string, updates: Partial<NodeRow>) => {
    setNodes(current => current.map(node => node.id === id ? { ...node, ...updates } : node));
    setDetailNode(current => current?.id === id ? { ...current, ...updates } : current);
  }, []);

  const openAutomationProcessRun = useCallback((run: RunRecord) => {
    const processName = run.processName?.trim() || 'Automation process';
    const process: OcrProcess = {
      id: run.processId || processName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'automation-process',
      name: processName,
      description: 'Automation process run',
      capabilities: '—',
      createdBy: run.node || 'RPA platform',
      creationDate: run.created,
      modifiedBy: run.node || 'RPA platform',
      modifiedDate: run.created,
    };

    if (onNavigateToAutomationProcess) {
      onNavigateToAutomationProcess(process, run);
      return;
    }
    setAutomationRunIdFromNode(run.id);
    setAutomationProcessFromRun(process);
  }, [onNavigateToAutomationProcess]);

  const openAutomationProcessRuns = useCallback((run: RunRecord) => {
    const processName = run.processName?.trim() || 'Automation process';
    const process: OcrProcess = {
      id: run.processId || processName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'automation-process',
      name: processName,
      description: 'Automation process run',
      capabilities: '—',
      createdBy: run.node || 'RPA platform',
      creationDate: run.created,
      modifiedBy: run.node || 'RPA platform',
      modifiedDate: run.created,
    };

    if (onNavigateToAutomationProcess) {
      onNavigateToAutomationProcess(process);
      return;
    }
    setAutomationRunIdFromNode(null);
    setAutomationProcessFromRun(process);
  }, [onNavigateToAutomationProcess]);

  if (showMonitoring) {
    return <MonitoringView onBack={() => setShowMonitoring(false)} />;
  }

  if (automationProcessFromRun) {
    return (
      <AutomationProcessDetailView
        process={automationProcessFromRun}
        initialRunId={automationRunIdFromNode ?? undefined}
        onBack={() => {
          setAutomationProcessFromRun(null);
          setAutomationRunIdFromNode(null);
        }}
      />
    );
  }

  if (detailNode) {
    return (
      <DetailView
        node={detailNode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBack={() => setDetailNode(null)}
        onMonitoring={() => setShowMonitoring(true)}
        onNodeStatusChange={updateNodeStatus}
        onNodeDetailsChange={updateNodeDetails}
        onOpenAutomationRun={openAutomationProcessRun}
        onOpenAutomationProcess={openAutomationProcessRuns}
      />
    );
  }

  return (
    <div className="relative flex min-h-full flex-col gap-8 bg-white px-9 py-14" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>
      {/* Header */}
      <PageHeader title="Node management" actions={<><PageActionButton onClick={() => setShowDownloadModal(true)}>Ping all</PageActionButton><PageActionButton onClick={() => { setNewNode({ name: '', description: '', connectionString: '', licenseKey: '', capabilities: [], dedicated: false }); setShowNewPanel(true); }}>Create new</PageActionButton></>} />

      {/* Filter bar */}
      <div className="flex flex-row items-center justify-between flex-shrink-0">
        <div className="flex flex-row items-center gap-1">
          <OcrSearchField ariaLabel="Search nodes" value={query} onChange={value => { setQuery(value); setCurrentPage(1); }} />
        </div>

        <div className="flex h-7 flex-row items-center gap-4 rounded bg-white p-[6px]">
          <BulkDeleteButton selectedCount={selectedRows.size} onDelete={() => { setNodes(current => current.filter(node => !selectedRows.has(node.id))); setSelectedRows(new Set()); }} />
          <ColumnSettingsButton onClick={openColumnSettings} />
          <button onClick={() => setNodes(current => current.map(node => ({ ...node })))} className="flex-none w-4 h-4 flex items-center justify-center text-[#7288A3] hover:text-[#007EA7] transition-colors" title="REFRESH ALL">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div ref={tableScrollRef} className="-mt-2 flex flex-col flex-1 overflow-x-auto scrollbar-hide">
        <div style={{ minWidth: visibleCols.reduce((sum, column) => sum + column.width, 0) + 206 }}>
          {/* Column headers */}
          <div className="system-table-header-row mb-2 flex h-5 flex-row items-center pl-3">
            <div className="system-table-select-cell flex w-5 flex-shrink-0 items-center">
              <button
                onClick={toggleAll}
                className="relative h-[18px] w-[18px] flex-shrink-0 rounded-[6px] transition-colors"
                style={selectedRows.size === nodes.length && nodes.length > 0 ? { backgroundColor: '#007EA7' } : { border: '1px solid #A1B6C6', backgroundColor: 'transparent' }}
              >
                {selectedRows.size === nodes.length && nodes.length > 0 && (
                  <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
            {visibleCols.map((column, index) => (
                <div key={column.id} className="relative flex h-5 flex-shrink-0 items-center px-2" style={{ width: column.width }}>
                  <span className={`truncate font-montserrat text-[12px] font-medium leading-[18px] ${index === 0 ? 'text-[#10233A]' : 'text-[#7288A3]'}`}>{column.label}</span>
                  <ColumnSortButton columnLabel={column.label} direction={directionFor(column.id)} onDirectionChange={direction => { changeSort(column.id, direction); setCurrentPage(1); }} />
                  <ResizeHandle onMouseDown={event => startResize(index, event)} />
                </div>
            ))}
            <div className="ml-auto h-5 w-[164px] flex-shrink-0" />
          </div>

          {/* Rows */}
          <div className="flex flex-col">
          {sortedNodes.map((row, rowIndex) => (
            <div
              key={row.id}
              className={`group flex h-10 flex-row items-center rounded transition-colors ${
                rowIndex % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'
              } hover:bg-[#E6F2F6]`}
            >
              {/* Checkbox */}
              <div className="system-table-select-cell flex w-8 flex-shrink-0 items-center pl-3">
                <button
                  onClick={e => { e.stopPropagation(); toggleRow(row.id); }}
                  className="flex-shrink-0 w-[18px] h-[18px] relative rounded-[6px] transition-colors"
                  style={selectedRows.has(row.id) ? { backgroundColor: '#007EA7' } : { border: '1px solid #A1B6C6', backgroundColor: 'transparent' }}
                >
                  {selectedRows.has(row.id) && (
                    <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
              {visibleCols.map((col, index) => {
                  let content: React.ReactNode;
                  if (col.id === 'name') {
                    content = (
                      <button
                        type="button"
                        onClick={() => setDetailNode(row)}
                        className="block min-w-0 truncate text-left font-montserrat text-[12px] font-medium leading-[18px] text-[#007EA7] hover:underline"
                        aria-label={`Open node ${row.name}`}
                      >
                        {row.name}
                      </button>
                    );
                  } else if (col.id === 'description') {
                    content = <span className="block truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{row.description}</span>;
                  } else if (col.id === 'capabilities') {
                    content = <span className="font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{row.capabilities}</span>;
                  } else if (col.id === 'lastSeen') {
                    content = <span className="font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{row.lastSeen}</span>;
                  } else if (col.id === 'status') {
                    content = (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-[6px] h-[6px] rounded-full ${row.status === 'Available' ? 'bg-[#43B54A]' : 'bg-[#A1B6C6]'}`} />
                        <span className="font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{row.status}</span>
                      </div>
                    );
                  } else if (col.id === 'createdBy') {
                    content = <span className="font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{row.createdBy}</span>;
                  } else {
                    content = <span className="font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{row.creationDate}</span>;
                  }
                  return (
                    <div key={col.id} className="contents">
                      {index > 0 && <div aria-hidden="true" className="h-10 w-px flex-shrink-0 bg-transparent" />}
                      <div className="flex h-10 flex-shrink-0 items-center overflow-hidden px-3" style={{ width: col.width }}>{content}</div>
                    </div>
                  );
                })}

              {/* Row action buttons */}
              <div data-row-actions="node-management" className="ml-auto flex w-[164px] flex-shrink-0 flex-row items-center justify-end gap-1.5 pr-3">
                <button
                  type="button"
                  data-button-family="export"
                  title="EXPORT"
                  aria-label={`EXPORT node ${row.name} ${row.id}`}
                  onClick={event => {
                    event.stopPropagation();
                    exportNode(row);
                  }}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-[#D3E1EC] bg-white text-[#7288A3] transition-colors hover:border-[#007EA7] hover:text-[#007EA7]"
                >
                  <Download size={14} />
                </button>
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    setNodes(current => current.map(node => node.id === row.id ? { ...node, status: 'Available', lastSeen: 'Just now' } : node));
                  }}
                  className="w-7 h-7 flex items-center justify-center border-2 border-[#D3E1EC] rounded text-[#7288A3] hover:text-[#007EA7] hover:border-[#007EA7] transition-colors"
                  title="REDO"
                  aria-label={`REDO node ${row.name} ${row.id}`}
                >
                  <RotateCw size={14} />
                </button>
                <button
                  type="button"
                  disabled={row.status === 'Inactive'}
                  onClick={event => {
                    event.stopPropagation();
                    setNodes(current => current.map(node => node.id === row.id ? { ...node, status: 'Inactive' } : node));
                  }}
                  className="w-7 h-7 flex items-center justify-center border-2 border-[#D3E1EC] rounded text-[#7288A3] hover:text-[#D64545] hover:border-[#D64545] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  title="IŠJUNGTI"
                  aria-label={`IŠJUNGTI node ${row.name} ${row.id}`}
                >
                  <Power size={14} />
                </button>
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    onNavigateToSecurityAccess?.({ module: 'Node management', resourceType: 'Node', id: row.id, name: row.name });
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded border-2 border-[#D3E1EC] text-[#7288A3] transition-colors hover:border-[#007EA7] hover:text-[#007EA7]"
                  title="SECURITY ACCESS"
                  aria-label={`SECURITY ACCESS for node ${row.name}`}
                >
                  <Users size={16} />
                </button>
                <RowDeleteButton label={`Delete ${row.name}`} onDelete={() => { setNodes(current => current.filter(node => node.id !== row.id)); setSelectedRows(current => { const next = new Set(current); next.delete(row.id); return next; }); }} />
              </div>
            </div>
          ))}
          </div>
        </div>

        <HorizontalTableScrollbar scrollRef={tableScrollRef} />

        {/* Bottom bar: item count + pagination + create new */}
        <div className="mt-6 flex flex-row items-center justify-between pt-4">
          <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3]">
            {nodes.length} items
          </span>

          {/* Pagination */}
          <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={SAMPLE_NODES.length} onPageChange={setCurrentPage} />

          <button
            onClick={() => { setNewNode({ name: '', description: '', connectionString: '', licenseKey: '', capabilities: [], dedicated: false }); setShowNewPanel(true); }}
            className="flex items-center justify-center gap-1 h-8 px-3 bg-[#007EA7] rounded-[6px] hover:bg-[#006b8f] transition-colors"
          >
            <span className="font-montserrat font-semibold text-[14px] leading-5 text-white">Create new</span>
          </button>
        </div>
      </div>

      {showNewPanel && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={handleNewPanelClose}>
          <div
            className="relative h-full bg-white flex flex-col px-6 pt-6 pb-8 overflow-y-auto"
            style={{ width: '340px', boxShadow: '-2px 0px 0px #E5EDF9' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-row justify-between items-center flex-shrink-0 mb-6">
              <span className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">New node</span>
              <button onClick={handleNewPanelClose} className="text-[#7288A3] hover:text-[#10233A] transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-5 flex-1">
              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Name <span className="text-red-500">*</span></span>
                <input
                  type="text"
                  value={newNode.name}
                  onChange={e => setNewNode({ ...newNode, name: e.target.value })}
                  placeholder="Enter node name"
                  className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-normal text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Description</span>
                <textarea
                  value={newNode.description}
                  onChange={e => setNewNode({ ...newNode, description: e.target.value })}
                  placeholder="Enter description"
                  className="w-full h-[80px] px-[14px] py-[11px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-normal text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors resize-y"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Working directory</span>
                <input
                  type="text"
                  value={newNode.connectionString}
                  onChange={e => setNewNode({ ...newNode, connectionString: e.target.value })}
                  placeholder="Enter working directory"
                  className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-normal text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                />
              </div>

              {/* Capabilities chips */}
              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Capabilities</span>
                <div className="flex flex-wrap gap-2 min-h-[42px] p-2 border border-[#D3E1EC] rounded-lg">
                  {newNode.capabilities.map(cap => (
                    <div key={cap} className="flex items-center gap-1 px-2 py-1 bg-[#E5EDF9] rounded">
                      <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{cap}</span>
                      <button onClick={() => removeCapability(cap)} className="text-[#7288A3] hover:text-[#10233A]">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    value={capInput}
                    onChange={e => setCapInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCapability(); } }}
                    placeholder={newNode.capabilities.length === 0 ? 'Add capability' : ''}
                    className="flex-1 min-w-[80px] h-6 bg-transparent font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none"
                  />
                </div>
              </div>

              {/* Dedicated toggle */}
              <div className="flex flex-row items-center justify-between">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Dedicated</span>
                <button
                  onClick={() => setNewNode({ ...newNode, dedicated: !newNode.dedicated })}
                  className={`relative w-[44px] h-[24px] rounded-full transition-colors ${newNode.dedicated ? 'bg-[#007EA7]' : 'bg-[#D3E1EC]'}`}
                >
                  <div className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow transition-transform ${newNode.dedicated ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-row justify-between items-center flex-shrink-0 mt-6 pt-4 border-t border-[#E5EDF9]">
              <div className="flex flex-row gap-2">
                <button
                  onClick={handleNewPanelClose}
                  className="h-[42px] flex items-center justify-center px-4 bg-white border-2 border-[#D3E1EC] rounded-lg hover:border-[#007EA7] transition-colors"
                >
                  <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#7288A3]">Cancel</span>
                </button>
                <button
                  onClick={() => setShowNewPanel(false)}
                  className="h-[42px] flex items-center justify-center px-4 bg-[#007EA7] rounded-lg hover:bg-[#006b8f] transition-colors"
                >
                  <span className="font-montserrat font-semibold text-[16px] leading-6 text-white">Create</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm close modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20">
          <div
            className="bg-white flex flex-col items-center justify-center gap-4"
            style={{ width: '530px', height: '170px', borderRadius: '16px', boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)' }}
          >
            <span className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A]">
              You have unsaved changes. Discard them?
            </span>
            <div className="flex flex-row gap-3">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="h-[36px] flex items-center justify-center px-4 border-2 border-[#D3E1EC] rounded-[6px] hover:border-[#007EA7] transition-colors"
              >
                <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">Cancel</span>
              </button>
              <button
                onClick={() => { setShowConfirmClose(false); setShowNewPanel(false); }}
                className="h-[36px] flex items-center justify-center px-4 bg-[#007EA7] rounded-[6px] hover:bg-[#006b8f] transition-colors"
              >
                <span className="font-montserrat font-semibold text-[14px] leading-5 text-white">Discard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowDownloadModal(false)}>
          <div
            className="bg-white flex flex-col items-center justify-center gap-4"
            style={{ width: '530px', height: '170px', borderRadius: '16px', boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <span className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A]">
              Export node data
            </span>
            <button
              onClick={() => setShowDownloadModal(false)}
              className="h-[36px] flex items-center justify-center px-6 bg-[#007EA7] rounded-[6px] hover:bg-[#006b8f] transition-colors"
            >
              <span className="font-montserrat font-semibold text-[14px] leading-5 text-white">Download</span>
            </button>
          </div>
        </div>
      )}

      {/* Column Settings Panel */}
      {showColumnSettings && (
        <ColumnSettingsPanel
          columns={columns.map(column => ({ key: column.id, label: column.label, width: column.width, visible: column.visible }))}
          defaultColumns={DEFAULT_COLUMNS.map(column => ({ key: column.id, label: column.label, width: column.width, visible: column.visible }))}
          onSave={saveColumnSettings}
          onClose={() => setShowColumnSettings(false)}
        />
      )}
    </div>
  );
}

function DetailView({
  node,
  activeTab,
  setActiveTab,
  onBack,
  onMonitoring,
  onNodeStatusChange,
  onNodeDetailsChange,
  onOpenAutomationRun,
  onOpenAutomationProcess,
}: {
  node: NodeRow;
  activeTab: DetailTab;
  setActiveTab: (t: DetailTab) => void;
  onBack: () => void;
  onMonitoring: () => void;
  onNodeStatusChange: (id: string, status: NodeAvailabilityStatus) => void;
  onNodeDetailsChange: (id: string, updates: Partial<NodeRow>) => void;
  onOpenAutomationRun: (run: RunRecord) => void;
  onOpenAutomationProcess: (run: RunRecord) => void;
}) {
  const [monitoring, setMonitoring] = useState<NodeMonitoringData>(() => createLocalNodeMonitoring(node));
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [monitoringError, setMonitoringError] = useState('');
  const [features, setFeatures] = useState<NodeFeatureMonitoring[]>(() => orderNodeFeatures(createLocalNodeMonitoring(node).features));
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresError, setFeaturesError] = useState('');
  const [configurationCreateSignal, setConfigurationCreateSignal] = useState(0);
  const [notificationCreateSignal, setNotificationCreateSignal] = useState(0);
  const [notifications, setNotifications] = useState<AlertRecord[]>([]);
  const [featureLogTabs, setFeatureLogTabs] = useState<string[]>([]);
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);

  const openFeatureLogs = useCallback((featureName: string) => {
    setFeatureLogTabs(current => current.includes(featureName) ? current : [...current, featureName]);
    setActiveTab(getFeatureLogTabId(featureName));
  }, [setActiveTab]);

  const closeFeatureLogs = useCallback((featureName: string) => {
    const tabId = getFeatureLogTabId(featureName);
    setFeatureLogTabs(current => current.filter(name => name !== featureName));
    if (activeTab === tabId) setActiveTab('Features');
  }, [activeTab, setActiveTab]);

  useEffect(() => {
    setFeatureLogTabs([]);
    if (getFeatureNameFromLogTab(activeTab)) setActiveTab('Details');
  }, [node.id]);

  const refreshMonitoring = useCallback(async (signal?: AbortSignal) => {
    setMonitoringLoading(true);
    setMonitoringError('');
    try {
      const next = await getNodeMonitoring({
        id: node.id,
        name: node.name,
        status: node.status,
        description: node.description,
        capabilities: node.capabilities,
      }, signal);
      setMonitoring(next);
      onNodeStatusChange(node.id, next.status);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMonitoringError(error instanceof Error ? error.message : 'Unable to refresh node monitoring data.');
    } finally {
      if (!signal?.aborted) setMonitoringLoading(false);
    }
  }, [node.capabilities, node.description, node.id, node.name, node.status, onNodeStatusChange]);

  const refreshFeatures = useCallback(async (signal?: AbortSignal) => {
    setFeaturesLoading(true);
    setFeaturesError('');
    try {
      const next = await getNodeFeatures({
        id: node.id,
        name: node.name,
        status: node.status,
        description: node.description,
        capabilities: node.capabilities,
      }, signal);
      setFeatures(orderNodeFeatures(next));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setFeaturesError(error instanceof Error ? error.message : 'Unable to refresh node features.');
    } finally {
      if (!signal?.aborted) setFeaturesLoading(false);
    }
  }, [node.capabilities, node.description, node.id, node.name, node.status]);

  useEffect(() => {
    const controller = new AbortController();
    void refreshMonitoring(controller.signal);
    const interval = window.setInterval(() => void refreshMonitoring(), 30_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [refreshMonitoring]);

  useEffect(() => {
    const controller = new AbortController();
    void refreshFeatures(controller.signal);
    const interval = window.setInterval(() => void refreshFeatures(), 30_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [refreshFeatures]);

  const changeFeatureStatus = useCallback(async (names: string[], status: NodeFeatureStatus) => {
    setFeaturesLoading(true);
    setFeaturesError('');
    const targetNames = new Set(names);
    setFeatures(current => current.map(feature => targetNames.has(feature.name)
      ? { ...feature, status, healthy: status === 'Enabled' }
      : feature));
    try {
      const updated = await Promise.all(names.map(name => updateNodeFeatureStatus(node.id, name, status)));
      const updatedByName = new Map(updated.map(feature => [feature.name, feature]));
      setFeatures(current => current.map(feature => {
        const next = updatedByName.get(feature.name);
        return next ? { ...feature, ...next } : feature;
      }));
    } catch (error) {
      setFeaturesError(error instanceof Error ? error.message : 'Unable to update node feature.');
    } finally {
      setFeaturesLoading(false);
    }
  }, [node.id]);

  const refreshFeatureRows = useCallback(async (_names: string[]) => {
    setFeaturesLoading(true);
    setFeaturesError('');
    try {
      await refreshFeatures();
    } catch (error) {
      setFeaturesError(error instanceof Error ? error.message : 'Unable to refresh node feature.');
      setFeaturesLoading(false);
    }
  }, [node.id, refreshFeatures]);

  const redoFeatureRows = useCallback(async (names: string[]) => {
    setFeaturesLoading(true);
    setFeaturesError('');
    try {
      await redoNodeFeatures(node.id, names);
      await refreshFeatures();
    } catch (error) {
      setFeaturesError(error instanceof Error ? error.message : 'Unable to redo selected node features.');
      setFeaturesLoading(false);
    }
  }, [node.id, refreshFeatures]);

  const updateFeatureConfiguration = useCallback(async (name: string, configuration: Record<string, unknown>) => {
    setFeaturesLoading(true);
    setFeaturesError('');
    try {
      const savedConfiguration = await saveNodeFeatureConfiguration(node.id, name, configuration);
      setFeatures(current => current.map(feature => feature.name === name ? { ...feature, configuration: savedConfiguration } : feature));
    } catch (error) {
      setFeaturesError(error instanceof Error ? error.message : 'Unable to update node feature configuration.');
      throw error;
    } finally {
      setFeaturesLoading(false);
    }
  }, [node.id]);

  const downloadNodeDetails = () => {
    const blob = new Blob([JSON.stringify({ ...node, monitoring: { ...monitoring, features } }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${node.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-node.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const refreshNodeDetails = () => {
    void Promise.all([refreshMonitoring(), refreshFeatures()]);
  };

  const redoNode = () => {
    onNodeStatusChange(node.id, 'Available');
    setMonitoring(current => ({ ...current, status: 'Available', updatedAt: new Date().toISOString() }));
  };

  const shutDownNode = () => {
    onNodeStatusChange(node.id, 'Down');
    setMonitoring(current => ({ ...current, status: 'Down', updatedAt: new Date().toISOString() }));
  };

  const submitVersionUpgrade = () => {
    setUpgradeSubmitted(true);
    window.setTimeout(() => setUpgradeSubmitted(false), 4000);
  };

  const nodeActions = (
    <div className="flex h-8 flex-shrink-0 items-center justify-end gap-4 rounded bg-white px-[6px]">
      <button type="button" aria-label="REFRESH" title="REFRESH" onClick={refreshNodeDetails} disabled={monitoringLoading || featuresLoading} className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7] disabled:cursor-not-allowed disabled:text-[#B4B6B8]"><RefreshCw size={16} /></button>
      <button type="button" aria-label="Download" title="Download" onClick={downloadNodeDetails} className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7]"><Download size={16} /></button>
      <button type="button" aria-label="REDO" title="REDO" onClick={redoNode} disabled={node.status === 'Available'} className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7] disabled:cursor-not-allowed disabled:text-[#B4B6B8]"><RotateCw size={16} /></button>
      <button type="button" aria-label="Shut down" title="Shut down" onClick={shutDownNode} disabled={node.status === 'Down'} className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-[#7288A3] transition-colors hover:text-[#D64545] disabled:cursor-not-allowed disabled:text-[#B4B6B8]"><Power size={16} /></button>
    </div>
  );

  const upgradeVersionAction = (
    <button
      type="button"
      onClick={submitVersionUpgrade}
      className="flex h-8 flex-shrink-0 items-center justify-center rounded border-2 border-[#D3E1EC] bg-white px-3 font-montserrat text-[12px] font-semibold leading-[18px] text-[#7288A3] transition-colors hover:border-[#A1B6C6] active:border-[#007EA7] active:bg-[#007EA7] active:text-white"
    >
      UPGRADE VERSION
    </button>
  );

  const contextualAction = activeTab === 'Notifications'
    ? (notifications.length > 0
      ? <PageActionButton onClick={() => setNotificationCreateSignal(signal => signal + 1)}>Create new</PageActionButton>
      : null)
    : activeTab === 'Configuration parameters'
      ? <PageActionButton onClick={() => setConfigurationCreateSignal(signal => signal + 1)}>Create new</PageActionButton>
      : null;

  const headerActions = activeTab === 'Details'
    ? upgradeVersionAction
    : contextualAction;

  return (
    <div className="flex flex-col bg-white min-h-full relative" style={{ padding: '56px 72px', gap: '32px' }}>
      {/* Breadcrumb */}
      <div className="flex flex-row items-center gap-2 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#7288A3] hover:text-[#007EA7] transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="font-montserrat font-medium text-[12px] leading-[18px]">Node management</span>
        </button>
        <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#D3E1EC]">/</span>
        <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">{node.name}</span>
      </div>

      {/* Header with action buttons */}
      <PageHeader
        title="Node details"
        actions={headerActions}
      />

      {upgradeSubmitted && createPortal(
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-lg border border-[#A9DEC0] bg-[#E7F7EE] px-5 py-3 shadow-lg"
        >
          <span className="font-montserrat text-[14px] font-medium leading-5 text-[#176C43]">
            The node agent version upgrade request is successfully submitted!
          </span>
        </div>,
        document.body,
      )}

      <div className="flex flex-1 flex-col">
        {/* Tabs */}
        <div className="flex flex-row items-center gap-0 overflow-x-auto border-b border-[#E5EDF9]">
        {DETAIL_TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-4 py-2.5 transition-colors"
            >
              <span
                className="font-montserrat font-medium text-[#10233A]"
                style={{ fontSize: '16px', lineHeight: '22px', color: isActive ? '#007EA7' : '#10233A' }}
              >
                {tab}
              </span>
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] transition-opacity"
                style={{ backgroundColor: '#007EA7', opacity: isActive ? 1 : 0 }}
              />
            </button>
          );
        })}
        {featureLogTabs.map(featureName => {
          const tabId = getFeatureLogTabId(featureName);
          const isActive = activeTab === tabId;
          return (
            <div key={tabId} className="relative flex flex-shrink-0 items-center pl-4 pr-2 py-2.5">
              <button type="button" onClick={() => setActiveTab(tabId)} className="font-montserrat font-medium text-[16px] leading-[22px] transition-colors" style={{ color: isActive ? '#007EA7' : '#10233A' }}>
                {getFeatureLogTabLabel(featureName)}
              </button>
              <button
                type="button"
                aria-label={`Close ${getFeatureLogTabLabel(featureName)}`}
                title="Close"
                onClick={() => closeFeatureLogs(featureName)}
                className="ml-2 flex h-6 w-6 items-center justify-center rounded text-[#7288A3] transition-colors hover:bg-[#E5EDF9] hover:text-[#10233A]"
              >
                <X size={14} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] transition-opacity" style={{ backgroundColor: '#007EA7', opacity: isActive ? 1 : 0 }} />
            </div>
          );
        })}
        </div>

        {/* Node-level actions belong only to the Details tab. */}
        {activeTab === 'Details' && (
          <div className="flex h-12 w-full flex-shrink-0 items-center justify-end">
            {nodeActions}
          </div>
        )}

        {/* Tab content */}
        <div className="flex-1">
          {getFeatureNameFromLogTab(activeTab) ? (
            <NodeFeatureLogsTab node={node} featureName={getFeatureNameFromLogTab(activeTab) as string} />
          ) : (
            <DetailTabContent
              tab={activeTab as StaticDetailTab}
              node={node}
              monitoring={monitoring}
              monitoringLoading={monitoringLoading}
              monitoringError={monitoringError}
              features={features}
              featuresLoading={featuresLoading}
              featuresError={featuresError}
              configurationCreateSignal={configurationCreateSignal}
              notificationCreateSignal={notificationCreateSignal}
              notifications={notifications}
              setNotifications={setNotifications}
              onNodeDetailsChange={updates => onNodeDetailsChange(node.id, updates)}
              onDisableNode={() => onNodeStatusChange(node.id, 'Inactive')}
              onChangeFeatureStatus={(names, status) => void changeFeatureStatus(names, status)}
              onRefreshFeatureRows={names => void refreshFeatureRows(names)}
              onRedoFeatureRows={names => void redoFeatureRows(names)}
              onUpdateFeatureConfiguration={updateFeatureConfiguration}
              onOpenFeatureLogs={openFeatureLogs}
              onOpenAutomationRun={onOpenAutomationRun}
              onOpenAutomationProcess={onOpenAutomationProcess}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function NodeAgentSummary({
  monitoring,
  features,
  featuresLoading,
  featuresError,
  loading,
  error,
}: {
  monitoring: NodeMonitoringData;
  features: NodeFeatureMonitoring[];
  featuresLoading: boolean;
  featuresError: string;
  loading: boolean;
  error: string;
}) {
  const agentValues = [
    { label: 'Node status', value: monitoring.status, status: true },
    { label: 'Version', value: monitoring.version },
    { label: 'CPU', value: String(monitoring.cpu) },
    { label: 'Total memory', value: `${monitoring.totalMemoryMb.toLocaleString('en-US')} MB` },
    { label: 'Free memory', value: `${monitoring.freeMemoryMb.toLocaleString('en-US', { maximumFractionDigits: 2 })} MB` },
    { label: 'IP addresses', value: monitoring.ipAddresses.join(', ') || '—' },
  ];

  return (
    <div className="grid min-w-0 flex-1 grid-cols-1 gap-8 rounded-lg border border-[#E5EDF9] bg-white p-6 xl:grid-cols-[240px_minmax(0,1fr)]">
      <section aria-label="Node Agent" className="min-w-0">
        <h2 className="mb-6 font-montserrat text-[22px] font-semibold leading-8 text-[#10233A]">Node Agent</h2>
        <dl className="flex flex-col gap-5">
          {agentValues.map(item => (
            <div key={item.label} className="grid grid-cols-[118px_minmax(0,1fr)] items-center gap-3">
              <dt className="font-montserrat text-[14px] font-medium leading-5 text-[#7288A3]">{item.label}</dt>
              <dd className="flex min-w-0 items-center gap-3 font-montserrat text-[14px] font-semibold leading-5 text-[#10233A]">
                {item.status && (
                  <span className={`h-3 w-3 flex-shrink-0 rounded-full ${
                    monitoring.status === 'Available'
                      ? 'bg-[#43B54A]'
                      : monitoring.status === 'Stopping'
                        ? 'bg-[#F2A93B]'
                        : monitoring.status === 'Down'
                          ? 'bg-[#D64545]'
                          : 'bg-[#A1B6C6]'
                  }`} />
                )}
                <span className="truncate">{item.value}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Features" className="min-w-0">
        <h2 className="mb-6 font-montserrat text-[22px] font-semibold leading-8 text-[#10233A]">Features</h2>
        <div className="flex flex-col gap-6">
          {features.map(feature => (
            <div key={feature.name}>
              <h3 className="font-montserrat text-[16px] font-semibold leading-6 text-[#10233A]">{feature.name}</h3>
              <div className="mt-3 grid grid-cols-[90px_minmax(0,1fr)] gap-x-5 gap-y-2">
                <span className="font-montserrat text-[14px] font-medium text-[#7288A3]">Status:</span>
                <span className="font-montserrat text-[14px] font-semibold text-[#10233A]">{feature.status}</span>
                {feature.healthy !== undefined && (
                  <>
                    <span className="font-montserrat text-[14px] font-medium text-[#7288A3]">Healthy:</span>
                    <span className="font-montserrat text-[14px] font-semibold text-[#10233A]">{feature.healthy ? 'yes' : 'no'}</span>
                  </>
                )}
              </div>
              {feature.description && <p className="mt-2 font-montserrat text-[12px] font-normal leading-5 text-[#7288A3]">{feature.description}</p>}
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-[#E5EDF9] pt-3 font-montserrat text-[11px] text-[#A1B6C6]">
          {featuresLoading
            ? 'Updating features…'
            : featuresError
              ? `Feature update failed: ${featuresError}`
              : loading
                ? 'Updating node data…'
                : error
                  ? `Last update failed: ${error}`
                  : 'Synchronized with Node details → Features'}
        </div>
      </section>
    </div>
  );
}

function FeatureCheckbox({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative flex h-[18px] w-[18px] flex-shrink-0 self-center items-center justify-center rounded-[6px] border transition-colors ${
        checked ? 'border-[#007EA7] bg-[#007EA7]' : 'border-[#A1B6C6] bg-white'
      }`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function NodeFeaturesTab({
  features,
  loading,
  error,
  onChangeStatus,
  onRefreshRows,
  onRedoRows,
  onUpdateConfiguration,
  onOpenLogs,
}: {
  features: NodeFeatureMonitoring[];
  loading: boolean;
  error: string;
  onChangeStatus: (names: string[], status: NodeFeatureStatus) => void;
  onRefreshRows: (names: string[]) => void;
  onRedoRows: (names: string[]) => void;
  onUpdateConfiguration: (name: string, configuration: Record<string, unknown>) => Promise<void>;
  onOpenLogs: (name: string) => void;
}) {
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [featureColumns, setFeatureColumns] = useState<ColConfig[]>([
    { key: 'type', label: 'Type', width: 420, visible: true },
    { key: 'status', label: 'Status', width: 220, visible: true },
  ]);
  const { startResize: startFeatureResize } = useColumnResize(featureColumns, setFeatureColumns);
  const [openedFeatureName, setOpenedFeatureName] = useState<string | null>(null);
  const [configurationText, setConfigurationText] = useState('');
  const [savedConfigurationText, setSavedConfigurationText] = useState('');
  const [treeView, setTreeView] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [configurationQuery, setConfigurationQuery] = useState('');
  const [wrapText, setWrapText] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [savingConfiguration, setSavingConfiguration] = useState(false);
  const [configurationCopied, setConfigurationCopied] = useState(false);

  useEffect(() => {
    setSelected(current => new Set([...current].filter(name => features.some(feature => feature.name === name))));
  }, [features]);

  const orderedFeatures = orderNodeFeatures(features);
  const filteredFeatures = orderedFeatures.filter(feature => feature.name.toLowerCase().includes(query.trim().toLowerCase()));
  type FeatureSortKey = 'type' | 'status';
  const {
    sortedRows: visibleFeatures,
    changeSort: changeFeatureSort,
    directionFor: featureSortDirection,
  } = useMultiColumnSort(filteredFeatures, (feature, key: FeatureSortKey) => key === 'type' ? feature.name : feature.status);
  const allVisibleSelected = visibleFeatures.length > 0 && visibleFeatures.every(feature => selected.has(feature.name));
  const selectedFeatures = orderedFeatures.filter(feature => selected.has(feature.name));
  const selectedNames = selectedFeatures.map(feature => feature.name);
  const featureGridTemplate = `54px ${featureColumns.map(column => `${column.width}px`).join(' ')} minmax(68px, 1fr)`;
  const featureTableWidth = featureColumns.reduce((total, column) => total + column.width, 122);
  const openedFeature = features.find(feature => feature.name === openedFeatureName) ?? null;
  let parsedConfiguration: Record<string, unknown> | null = null;
  let configurationError = '';
  try {
    const parsed = JSON.parse(configurationText || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Configuration must be a JSON object.');
    parsedConfiguration = parsed as Record<string, unknown>;
  } catch (error) {
    configurationError = error instanceof Error ? error.message : 'Invalid JSON configuration.';
  }
  const configurationDirty = Boolean(openedFeature) && configurationText !== savedConfigurationText;
  const configurationMatches = configurationQuery.trim()
    ? configurationText.toLowerCase().split(configurationQuery.trim().toLowerCase()).length - 1
    : 0;

  const openFeature = (feature: NodeFeatureMonitoring) => {
    const text = JSON.stringify(feature.configuration ?? {}, null, 2);
    setOpenedFeatureName(feature.name);
    setConfigurationText(text);
    setSavedConfigurationText(text);
    setTreeView(false);
    setSearchOpen(false);
    setConfigurationQuery('');
    setWrapText(true);
    setFullScreen(false);
  };

  const closeFeature = () => {
    setOpenedFeatureName(null);
    setConfigurationQuery('');
    setSearchOpen(false);
    setFullScreen(false);
  };

  const updateTreeValue = (key: string, value: string) => {
    if (!parsedConfiguration) return;
    let nextValue: unknown = value;
    try { nextValue = JSON.parse(value); } catch { /* Keep user-entered text as a string. */ }
    setConfigurationText(JSON.stringify({ ...parsedConfiguration, [key]: nextValue }, null, 2));
  };

  const copyConfiguration = async () => {
    try {
      await navigator.clipboard.writeText(configurationText);
    } catch {
      const copyArea = document.createElement('textarea');
      copyArea.value = configurationText;
      copyArea.style.position = 'fixed';
      copyArea.style.opacity = '0';
      document.body.appendChild(copyArea);
      copyArea.select();
      document.execCommand('copy');
      document.body.removeChild(copyArea);
    }
    setConfigurationCopied(true);
    window.setTimeout(() => setConfigurationCopied(false), 2500);
  };

  const updateConfiguration = async () => {
    if (!openedFeature || !parsedConfiguration || !configurationDirty || savingConfiguration) return;
    setSavingConfiguration(true);
    try {
      await onUpdateConfiguration(openedFeature.name, parsedConfiguration);
      const saved = JSON.stringify(parsedConfiguration, null, 2);
      setConfigurationText(saved);
      setSavedConfigurationText(saved);
    } finally {
      setSavingConfiguration(false);
    }
  };

  return (
    <div className="flex min-h-[520px] flex-1 flex-col py-4" style={{ gap: 24 }}>
      <div className="flex flex-row flex-wrap items-center justify-between gap-2">
        <OcrSearchField ariaLabel="Search features" value={query} onChange={setQuery} />
        <div className="flex h-7 flex-row items-center gap-4 rounded-[4px] bg-white p-[6px]">
          <RedoAllButton
            label="REDO ALL"
            disabled={loading || selectedFeatures.length === 0}
            onRedo={() => onRedoRows(selectedNames)}
          />
          <button type="button" disabled={loading || selectedFeatures.length === 0} onClick={() => onChangeStatus(selectedNames, 'Enabled')} className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7] disabled:cursor-not-allowed disabled:text-[#B4B6B8]" title="ENABLE" aria-label="ENABLE selected features">
            <CheckCircle2 size={16} />
          </button>
          <StopAllButton
            label="STOP ALL"
            disabled={loading || selectedFeatures.length === 0 || !selectedFeatures.some(feature => feature.status === 'Enabled')}
            onStop={() => onChangeStatus(selectedNames, 'Disabled')}
          />
          <RefreshAllButton
            disabled={loading || orderedFeatures.length === 0}
            onRefresh={() => onRefreshRows(orderedFeatures.map(feature => feature.name))}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div ref={tableScrollRef} className="flex flex-1 flex-col overflow-x-auto scrollbar-hide">
          <div className="flex w-full flex-col" style={{ minWidth: featureTableWidth }}>
            <div className="system-table-header-row grid h-5 items-center" style={{ gridTemplateColumns: featureGridTemplate }}>
              <div className="flex h-5 items-center px-[10px]">
                <FeatureCheckbox
                  checked={allVisibleSelected}
                  label="Select all visible features"
                  onChange={() => setSelected(current => {
                    const next = new Set(current);
                    visibleFeatures.forEach(feature => allVisibleSelected ? next.delete(feature.name) : next.add(feature.name));
                    return next;
                  })}
                />
              </div>
              {featureColumns.map((column, index) => (
                <div key={column.key} className="relative flex h-5 items-center gap-[6px] overflow-visible px-[10px]">
                  <span className="truncate font-montserrat text-[12px] font-medium leading-[18px] text-[#10233A]">{column.label}</span>
                  <ColumnSortButton
                    columnLabel={column.label}
                    direction={featureSortDirection(column.key as FeatureSortKey)}
                    onDirectionChange={direction => changeFeatureSort(column.key as FeatureSortKey, direction)}
                  />
                  <ResizeHandle onMouseDown={event => startFeatureResize(index, event)} />
                </div>
              ))}
              <span aria-hidden="true" />
            </div>

            {visibleFeatures.length > 0 && (
              <div className="mt-4 flex flex-col">
                {visibleFeatures.map((feature, index) => (
                  <div key={feature.name} className={`group grid h-9 w-full items-center rounded-lg transition-colors ${index % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'} hover:bg-[#E7F4F9] focus-within:bg-[#E7F4F9]`} style={{ gridTemplateColumns: featureGridTemplate }}>
                    <div className="flex h-9 items-center px-[10px]">
                      <FeatureCheckbox
                        checked={selected.has(feature.name)}
                        label={`Select ${feature.name}`}
                        onChange={() => setSelected(current => {
                          const next = new Set(current);
                          next.has(feature.name) ? next.delete(feature.name) : next.add(feature.name);
                          return next;
                        })}
                      />
                    </div>
                    <button type="button" aria-label={`Open ${feature.name} feature configuration`} onClick={() => openFeature(feature)} className="flex h-9 min-w-0 cursor-pointer items-center overflow-hidden rounded-lg px-[10px] text-left focus:outline-none">
                      <span className="truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{feature.name}</span>
                    </button>
                    <button type="button" aria-label={`Open ${feature.name} feature configuration from status`} onClick={() => openFeature(feature)} className="flex h-9 cursor-pointer items-center gap-[6px] overflow-hidden px-[10px] text-left focus:outline-none">
                      <span className={`h-[6px] w-[6px] flex-shrink-0 rounded-full ${feature.status === 'Enabled' ? 'bg-[#43B54A]' : 'bg-[#A1B6C6]'}`} />
                      <span className="truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{feature.status}</span>
                    </button>
                    <div className="sticky right-0 z-10 flex h-9 w-[68px] justify-self-end items-center justify-end gap-1 bg-inherit p-1 group-hover:bg-[#E7F4F9] group-focus-within:bg-[#E7F4F9]">
                      <StopButton
                        stopped={feature.status === 'Disabled' || loading}
                        label={`STOP ${feature.name}`}
                        onStop={() => onChangeStatus([feature.name], 'Disabled')}
                      />
                      <RecordRefreshButton
                        label={`REDO ${feature.name}`}
                        onRefresh={() => onRedoRows([feature.name])}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {visibleFeatures.length === 0 && (
            <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-2 text-center">
              <span className="font-montserrat text-[18px] font-semibold leading-6 text-[#10233A]">No features found</span>
              <span className="font-montserrat text-[14px] font-medium leading-5 text-[#10233A]">Try changing the search text</span>
            </div>
          )}
        </div>

        <HorizontalTableScrollbar scrollRef={tableScrollRef} />
        <div className="w-full">
          <TablePagination currentPage={1} totalPages={1} itemCount={visibleFeatures.length} onPageChange={() => undefined} />
        </div>
      </div>
      {error && <p role="alert" className="font-montserrat text-[12px] font-medium text-[#D64545]">{error}</p>}
      {openedFeature && createPortal((
        <div className="fixed inset-0 z-[140] flex justify-end bg-[#10233A]/20" onMouseDown={closeFeature}>
          <aside role="dialog" aria-modal="true" aria-label={`${openedFeature.name} feature configuration`} onMouseDown={event => event.stopPropagation()} className={`flex h-full flex-col gap-6 bg-white p-6 shadow-[-2px_0_0_#E5EDF9] transition-[width] ${fullScreen ? 'w-full' : 'w-[560px] max-w-[calc(100vw-24px)]'}`}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-montserrat text-[24px] font-semibold leading-8 text-[#10233A]">{openedFeature.name}</h2>
              <button type="button" title="Close" aria-label={`Close ${openedFeature.name} feature configuration`} onClick={closeFeature} className="text-[#7288A3] transition-colors hover:text-[#10233A]"><X size={28} /></button>
            </div>

            <button type="button" onClick={() => { closeFeature(); onOpenLogs(openedFeature.name); }} className="flex items-center gap-3 self-start font-montserrat text-[14px] font-semibold text-[#007EA7] transition-opacity hover:opacity-70">
              VIEW FEATURE LOGS <ExternalLink size={18} />
            </button>

            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <span className="font-montserrat text-[16px] font-semibold text-[#10233A]">Feature Configuration</span>
              {searchOpen && (
                <div className="flex h-9 items-center gap-2 rounded-md border border-[#D3E1EC] px-3">
                  <Search size={16} className="text-[#7288A3]" />
                  <input autoFocus value={configurationQuery} onChange={event => setConfigurationQuery(event.target.value)} placeholder="Search configuration" className="min-w-0 flex-1 font-montserrat text-[13px] text-[#10233A] outline-none" />
                  {configurationQuery && <span className="font-montserrat text-[12px] text-[#7288A3]">{configurationMatches} found</span>}
                </div>
              )}
              <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-lg border border-[#E5EDF9] bg-white">
                <div className="flex min-h-0 flex-1 overflow-auto bg-[#FCFDFE]">
                  {treeView && parsedConfiguration ? (
                    <div className="flex flex-1 flex-col gap-3 p-4 font-mono text-[14px]">
                      <div className="flex items-center gap-2 text-[#7288A3]"><ChevronDown size={16} /><span>{'{'}</span></div>
                      {Object.entries(parsedConfiguration).map(([key, value]) => (
                        <label key={key} className="grid grid-cols-[minmax(150px,auto)_1fr] items-center gap-3 pl-6">
                          <span className="text-[#A61B1B]">&quot;{key}&quot;:</span>
                          <input value={typeof value === 'string' ? value : JSON.stringify(value)} onChange={event => updateTreeValue(key, event.target.value)} className="min-w-0 rounded border border-[#D3E1EC] bg-white px-2 py-1 text-[#1459A6] outline-none focus:border-[#007EA7]" />
                        </label>
                      ))}
                      <div className="text-[#7288A3]">{'}'}</div>
                    </div>
                  ) : (
                    <>
                      <div className="flex w-12 flex-shrink-0 flex-col items-center bg-[#F8FAFC] py-4 font-mono text-[14px] leading-6 text-[#007EA7]">{configurationText.split('\n').map((_, index) => <span key={index} className="h-6 select-none">{index + 1}</span>)}</div>
                      <textarea value={configurationText} onChange={event => setConfigurationText(event.target.value)} className={`min-h-full flex-1 resize-none bg-[#FCFDFE] p-4 font-mono text-[15px] leading-6 text-[#10233A] outline-none ${wrapText ? 'whitespace-pre-wrap' : 'whitespace-pre'}`} spellCheck={false} wrap={wrapText ? 'soft' : 'off'} />
                    </>
                  )}
                </div>
                <div className="flex h-12 flex-shrink-0 items-center justify-between border-t border-[#E5EDF9] bg-[#F8FAFC] px-3">
                  <button type="button" role="switch" aria-label="Tree View" aria-checked={treeView} disabled={Boolean(configurationError)} onClick={() => setTreeView(value => !value)} className="flex items-center gap-3 font-montserrat text-[14px] font-medium text-[#10233A] disabled:opacity-40"><span className={`relative h-[20px] w-[36px] rounded-full border ${treeView ? 'border-[#007EA7] bg-[#007EA7]' : 'border-[#A1B6C6] bg-[#D3E1EC]'}`}><span className={`absolute left-[2px] top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform ${treeView ? 'translate-x-4' : ''}`} /></span>Tree View</button>
                  <div className="flex items-center gap-4 text-[#7288A3]">
                    <button type="button" title="TREE VIEW" aria-label="Open configuration tree view" disabled={Boolean(configurationError)} onClick={() => setTreeView(true)} className="transition-colors hover:text-[#007EA7] disabled:opacity-40"><Map size={18} /></button>
                    <button type="button" title="SEARCH" aria-label="Search feature configuration" onClick={() => setSearchOpen(value => !value)} className={searchOpen ? 'text-[#007EA7]' : 'transition-colors hover:text-[#007EA7]'}><Search size={18} /></button>
                    <button type="button" title="WRAP TEXT" aria-label="Wrap configuration text" onClick={() => setWrapText(value => !value)} className={wrapText ? 'text-[#007EA7]' : 'transition-colors hover:text-[#007EA7]'}><AlignLeft size={18} /></button>
                    <button type="button" title="COPY" aria-label="COPY feature configuration" onClick={() => void copyConfiguration()} className={configurationCopied ? 'text-[#007EA7]' : 'transition-colors hover:text-[#007EA7]'}><Copy size={18} /></button>
                    <button type="button" title={fullScreen ? 'EXIT FULL SCREEN' : 'FULL SCREEN'} aria-label={fullScreen ? 'EXIT FULL SCREEN' : 'FULL SCREEN'} onClick={() => setFullScreen(value => !value)} className="transition-colors hover:text-[#007EA7]">{fullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
                  </div>
                </div>
              </div>
              {configurationError && <span role="alert" className="font-montserrat text-[12px] font-medium text-[#D64545]">Invalid JSON: {configurationError}</span>}
            </div>

            <div className="mt-auto flex justify-end">
              <button type="button" data-system-action="true" disabled={!configurationDirty || Boolean(configurationError) || savingConfiguration} onClick={() => void updateConfiguration()} className="flex h-[42px] items-center justify-center rounded-lg border-2 border-[#D3E1EC] bg-white px-5 font-montserrat text-[16px] font-semibold text-[#7288A3] transition-colors enabled:active:border-[#007EA7] enabled:active:bg-[#007EA7] enabled:active:text-white disabled:cursor-not-allowed disabled:border-[#E5E7EB] disabled:bg-[#F5F5F5] disabled:text-[#B4B6B8]">{savingConfiguration ? 'UPDATING...' : 'UPDATE'}</button>
            </div>
          </aside>
        </div>
      ), document.body)}
      {configurationCopied && createPortal((
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[#2E8B57] px-5 py-3 font-montserrat text-[14px] font-semibold text-white shadow-lg"><CheckCircle2 size={18} />Feature configuration copied successfully</div>
      ), document.body)}
    </div>
  );
}

function NodeFeatureLogsTab({ node, featureName }: { node: NodeRow; featureName: string }) {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [severityOpen, setSeverityOpen] = useState(false);
  const [viewColumnsOpen, setViewColumnsOpen] = useState(false);
  const [visibleLogColumns, setVisibleLogColumns] = useState<Set<string>>(() => new Set(['timestamp', 'severity']));
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshNumber, setRefreshNumber] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const logs = [
    { time: '2026-07-30 09:25:50.998', severity: 'INFO', message: `Feature ${featureName} enabled` },
    { time: '2026-07-30 12:56:22.853', severity: 'INFO', message: `Configuration for ${featureName} loaded successfully` },
    { time: '2026-07-30 13:03:37.509', severity: 'INFO', message: `Feature ${featureName} connected to ${node.name}` },
    { time: '2026-08-03 08:52:38.149', severity: 'WARN', message: `${featureName} health check response was delayed` },
    { time: '2026-08-03 08:52:58.511', severity: 'INFO', message: `Feature ${featureName} enabled` },
  ];
  const normalizedQuery = query.trim().toLowerCase();
  const visibleLogs = logs.filter(log => (severity === 'ALL' || log.severity === severity) && (!normalizedQuery || `${log.time} ${log.severity} ${log.message}`.toLowerCase().includes(normalizedQuery)));
  const logColumnOptions = ['timestamp', 'severity', 'logger', 'thread'];
  const toggleLogColumn = (column: string) => {
    setVisibleLogColumns(current => {
      const next = new Set(current);
      next.has(column) ? next.delete(column) : next.add(column);
      return next;
    });
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = window.setInterval(() => setRefreshNumber(value => value + 1), 10_000);
    return () => window.clearInterval(interval);
  }, [autoRefresh]);

  const logText = visibleLogs.map(log => [
    visibleLogColumns.has('timestamp') ? `[${log.time}]` : '',
    visibleLogColumns.has('severity') ? `[${log.severity}]` : '',
    visibleLogColumns.has('logger') ? `[${node.name}]` : '',
    visibleLogColumns.has('thread') ? `[${featureName}]` : '',
    log.message,
  ].filter(Boolean).join(' ')).join('\n');
  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logText);
    } catch {
      const area = document.createElement('textarea');
      area.value = logText;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };
  const downloadLogs = () => {
    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${featureName.toLowerCase()}-logs.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`${fullScreen ? 'fixed inset-5 z-[260] rounded-2xl border border-[#D3E1EC] p-6 shadow-[0_16px_48px_rgba(16,35,58,0.18)]' : 'min-h-[560px] py-4'} flex flex-1 flex-col overflow-hidden bg-white`}>
      <div className="flex flex-wrap items-end gap-6 border-b border-[#E5EDF9] pb-4">
        <label className="flex min-w-[300px] flex-1 flex-col gap-1">
          <span className="font-montserrat text-[12px] font-medium text-[#7288A3]">Search query</span>
          <span className="flex h-9 items-center gap-2 border-b border-[#D3E1EC]">
            <Search size={16} className="text-[#7288A3]" />
            <input value={query} onChange={event => setQuery(event.target.value)} className="h-full flex-1 bg-transparent font-montserrat text-[13px] text-[#10233A] outline-none" placeholder={`Search ${featureName} logs`} />
          </span>
        </label>
        <div className="relative flex w-[235px] flex-col gap-1">
          <span className="font-montserrat text-[12px] font-medium text-[#7288A3]">View columns</span>
          <button type="button" aria-haspopup="listbox" aria-expanded={viewColumnsOpen} onClick={() => { setSeverityOpen(false); setViewColumnsOpen(open => !open); }} className={`flex h-8 items-center justify-between border-b-2 font-montserrat text-[13px] font-medium text-[#10233A] ${viewColumnsOpen ? 'border-[#007EA7]' : 'border-[#D3E1EC]'}`}>
            <span className="truncate">{visibleLogColumns.size ? logColumnOptions.filter(column => visibleLogColumns.has(column)).join(', ') : 'Choose columns'}</span><ChevronDown size={16} className={`ml-2 flex-shrink-0 text-[#7288A3] transition-transform ${viewColumnsOpen ? 'rotate-180' : ''}`} />
          </button>
          {viewColumnsOpen && (
            <div role="listbox" aria-label="View log columns" className="absolute left-0 right-0 top-[54px] z-30 overflow-hidden rounded-lg border border-[#D3E1EC] bg-white p-2 shadow-[0_10px_28px_rgba(16,35,58,0.16)]">
              {logColumnOptions.map(column => {
                const checked = visibleLogColumns.has(column);
                return (
                  <button key={column} type="button" role="option" aria-selected={checked} onClick={() => toggleLogColumn(column)} className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-left transition-colors hover:bg-[#F8FDFF] ${checked ? 'bg-[#EAF4FB]' : 'bg-white'}`}>
                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[6px] border transition-colors ${checked ? 'border-[#007EA7] bg-[#007EA7]' : 'border-[#A1B6C6] bg-white'}`}>
                      {checked && <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>
                    <span className="font-montserrat text-[14px] font-medium text-[#10233A]">{column}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="relative flex w-[185px] flex-col gap-1">
          <span className="font-montserrat text-[12px] font-medium text-[#7288A3]">Filter by severity</span>
          <button type="button" aria-haspopup="listbox" aria-expanded={severityOpen} onClick={() => { setViewColumnsOpen(false); setSeverityOpen(open => !open); }} className={`flex h-8 items-center justify-between border-b-2 font-montserrat text-[13px] font-medium text-[#10233A] ${severityOpen ? 'border-[#007EA7]' : 'border-[#D3E1EC]'}`}>
            <span>{severity}</span><ChevronDown size={16} className={`text-[#7288A3] transition-transform ${severityOpen ? 'rotate-180' : ''}`} />
          </button>
          {severityOpen && (
            <div role="listbox" aria-label="Filter logs by severity" className="absolute left-0 right-0 top-[54px] z-30 overflow-hidden rounded-lg border border-[#D3E1EC] bg-white p-2 shadow-[0_10px_28px_rgba(16,35,58,0.16)]">
              {['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'].map(option => {
                const checked = severity === option;
                return (
                  <button key={option} type="button" role="option" aria-selected={checked} onClick={() => { setSeverity(option); setSeverityOpen(false); }} className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-left transition-colors hover:bg-[#F8FDFF] ${checked ? 'bg-[#EAF4FB]' : 'bg-white'}`}>
                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[6px] border transition-colors ${checked ? 'border-[#007EA7] bg-[#007EA7]' : 'border-[#A1B6C6] bg-white'}`}>
                      {checked && <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>
                    <span className="font-montserrat text-[14px] font-medium text-[#10233A]">{option}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#FCFDFE] px-4 py-3 font-mono text-[12px] leading-6">
        {visibleLogs.map((log, index) => (
          <div key={`${refreshNumber}-${log.time}-${index}`} className="whitespace-nowrap">
            {visibleLogColumns.has('timestamp') && <><span className="text-[#7288A3]">[{log.time}]</span>{' '}</>}
            {visibleLogColumns.has('severity') && <><span className={log.severity === 'ERROR' ? 'text-[#E45858]' : log.severity === 'WARN' ? 'text-[#F2994A]' : 'text-[#A1B6C6]'}>[{log.severity}]</span>{' '}</>}
            {visibleLogColumns.has('logger') && <><span className="text-[#007EA7]">[{node.name}]</span>{' '}</>}
            {visibleLogColumns.has('thread') && <><span className="text-[#7288A3]">[{featureName}]</span>{' '}</>}
            <span className="text-[#10233A]">{log.message}</span>
          </div>
        ))}
        {!visibleLogs.length && <div className="py-16 text-center font-montserrat text-[13px] text-[#A1B6C6]">No matching events</div>}
      </div>

      <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-4 border-t border-[#E5EDF9] bg-[#F8FAFC] px-4 py-2">
        <div className="flex items-center gap-4">
          <button type="button" role="switch" aria-checked={autoRefresh} onClick={() => setAutoRefresh(value => !value)} className="flex items-center gap-2 font-montserrat text-[13px] font-medium text-[#10233A]">
            <span className={`relative h-5 w-9 rounded-full border transition-colors ${autoRefresh ? 'border-[#007EA7] bg-[#007EA7]' : 'border-[#A1B6C6] bg-[#E5EDF9]'}`}><span className={`absolute left-[2px] top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform ${autoRefresh ? 'translate-x-4' : ''}`} /></span>
            Autorefresh
          </button>
          <button type="button" title="REFRESH ALL" aria-label="Refresh feature logs" onClick={() => setRefreshNumber(value => value + 1)} className="text-[#7288A3] transition-colors hover:text-[#007EA7]"><RefreshCw size={18} /></button>
        </div>
        <div className="flex items-center gap-4 text-[#7288A3]">
          <button type="button" title="Download logs" aria-label="Download feature logs" onClick={downloadLogs} className="transition-colors hover:text-[#007EA7]"><Download size={18} /></button>
          <button type="button" title="COPY" aria-label="Copy feature logs" onClick={() => void copyLogs()} className="transition-colors hover:text-[#007EA7]"><Copy size={18} /></button>
          <button type="button" title={fullScreen ? 'Exit full screen' : 'FULL SCREEN'} aria-label={fullScreen ? 'Exit full screen' : 'Open full screen'} onClick={() => setFullScreen(value => !value)} className="transition-colors hover:text-[#007EA7]">{fullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
        </div>
      </div>
      {copied && createPortal(<div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-[320] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[#2E8B57] px-5 py-3 font-montserrat text-[14px] font-semibold text-white shadow-lg"><CheckCircle2 size={18} />Feature logs copied successfully</div>, document.body)}
    </div>
  );
}

function NodeLogsTab({ node }: { node: NodeRow }) {
  const normalizeNodeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const belongsToNode = useCallback((run: RunRecord) => {
    const aliases = new Set([
      normalizeNodeName(node.name),
      normalizeNodeName(`Node-${node.id}`),
      normalizeNodeName(`Node-${node.id.padStart(2, '0')}`),
    ]);
    return aliases.has(normalizeNodeName(run.node));
  }, [node.id, node.name]);
  const readLogs = useCallback(() => getAggregatedRuns().filter(belongsToNode), [belongsToNode]);
  const [runs, setRuns] = useState<RunRecord[]>(readLogs);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const logColumnOptions = ['Timestamp', 'Status', 'Node', 'Task'];
  const [visibleLogColumns, setVisibleLogColumns] = useState<string[]>(logColumnOptions);

  useEffect(() => {
    const reload = () => setRuns(readLogs());
    window.addEventListener('finansu-harmonija:runs-changed', reload);
    reload();
    return () => window.removeEventListener('finansu-harmonija:runs-changed', reload);
  }, [readLogs]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleRuns = runs.filter(run => {
    const matchesStatus = status === 'ALL' || run.status === status;
    const searchable = `${run.created} ${run.status} ${run.node} ${run.id} ${run.processName ?? ''} ${run.tasks}`.toLowerCase();
    return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
  });

  const statusColor = (runStatus: RunRecord['status']) => {
    if (runStatus === 'Failed') return 'text-[#E45858]';
    if (runStatus === 'Stopped' || runStatus === 'Stopped Idle' || runStatus === 'Stopping') return 'text-[#F2994A]';
    if (runStatus === 'Completed') return 'text-[#0A8F6A]';
    return 'text-[#007EA7]';
  };

  return (
    <div className="flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-lg border border-[#E5EDF9] bg-white">
      <div className="flex flex-wrap items-end gap-6 border-b border-[#E5EDF9] p-4">
        <OcrSearchField ariaLabel={`Search ${node.name} logs`} value={query} onChange={setQuery} />
        <div className="w-[260px]">
          <MultiSelectField
            label="View columns"
            options={logColumnOptions}
            value={visibleLogColumns}
            onChange={setVisibleLogColumns}
            placeholder="Choose columns"
          />
        </div>
        <div className="w-[220px]">
          <MultiSelectField
            label="Filter by status"
            options={['ALL', 'Submitted', 'Completed', 'Failed', 'In Progress', 'Stopped', 'Stopped Idle', 'Queued', 'Deploying on Node', 'Stopping']}
            value={[status]}
            onChange={values => setStatus(values.at(-1) ?? 'ALL')}
            placeholder="Choose status"
          />
        </div>
        <RefreshAllButton onRefresh={() => setRuns(readLogs())} />
      </div>

      <div className="flex-1 overflow-auto bg-[#FCFDFE] px-4 py-3 font-mono text-[12px] leading-6">
        {visibleRuns.map((run, index) => (
          <div key={`${run.processId ?? ''}-${run.id}-${index}`} className="whitespace-nowrap">
            {visibleLogColumns.includes('Timestamp') && <><span className="text-[#7288A3]">[{run.created}]</span>{' '}</>}
            {visibleLogColumns.includes('Status') && <><span className={statusColor(run.status)}>[{run.status.toUpperCase()}]</span>{' '}</>}
            {visibleLogColumns.includes('Node') && <><span className="text-[#007EA7]">[{run.node}]</span>{' '}</>}
            {visibleLogColumns.includes('Task') && <span className="text-[#10233A]">Task {run.id}: {run.processName ?? 'Automation process'} — {run.tasks} tasks</span>}
          </div>
        ))}
        {!visibleRuns.length && (
          <div className="py-16 text-center font-montserrat text-[13px] text-[#A1B6C6]">No matching task events</div>
        )}
      </div>
    </div>
  );
}

function DetailTabContent({
  tab,
  node,
  monitoring,
  monitoringLoading,
  monitoringError,
  features,
  featuresLoading,
  featuresError,
  configurationCreateSignal,
  notificationCreateSignal,
  notifications,
  setNotifications,
  onNodeDetailsChange,
  onDisableNode,
  onChangeFeatureStatus,
  onRefreshFeatureRows,
  onRedoFeatureRows,
  onUpdateFeatureConfiguration,
  onOpenFeatureLogs,
  onOpenAutomationRun,
  onOpenAutomationProcess,
}: {
  tab: StaticDetailTab;
  node: NodeRow;
  monitoring: NodeMonitoringData;
  monitoringLoading: boolean;
  monitoringError: string;
  features: NodeFeatureMonitoring[];
  featuresLoading: boolean;
  featuresError: string;
  configurationCreateSignal: number;
  notificationCreateSignal: number;
  notifications: AlertRecord[];
  setNotifications: (value: AlertRecord[] | ((current: AlertRecord[]) => AlertRecord[])) => void;
  onNodeDetailsChange: (updates: Partial<NodeRow>) => void;
  onDisableNode: () => void;
  onChangeFeatureStatus: (names: string[], status: NodeFeatureStatus) => void;
  onRefreshFeatureRows: (names: string[]) => void;
  onRedoFeatureRows: (names: string[]) => void;
  onUpdateFeatureConfiguration: (name: string, configuration: Record<string, unknown>) => Promise<void>;
  onOpenFeatureLogs: (name: string) => void;
  onOpenAutomationRun: (run: RunRecord) => void;
  onOpenAutomationProcess: (run: RunRecord) => void;
}) {
  const capabilityOptions = [
    'Selenium',
    'Desktop',
    'Chrome',
    'Data Extract',
    'Report Gen',
    'Operation type',
    'Python script',
    'Document processing',
    'OCR',
    'Text extraction',
    'RPA',
    'Java',
    'Validation',
    'Machine learning',
    'API',
  ];
  const [selectedCapabilities, setSelectedCapabilities] = useState(
    node.capabilities.split(',').map(capability => capability.trim()).filter(Boolean),
  );
  const [description, setDescription] = useState(node.description);
  const [workingDirectory, setWorkingDirectory] = useState(
    node.workingDirectory ?? `/opt/rpa/nodes/${node.name.toLowerCase().replace(/\s+/g, '-')}`,
  );
  const [dedicated, setDedicated] = useState(node.dedicated ?? true);
  const [detailsSaved, setDetailsSaved] = useState(false);

  const initialCapabilities = node.capabilities.split(',').map(capability => capability.trim()).filter(Boolean);
  const initialWorkingDirectory = node.workingDirectory ?? `/opt/rpa/nodes/${node.name.toLowerCase().replace(/\s+/g, '-')}`;
  const detailsChanged = description !== node.description
    || workingDirectory !== initialWorkingDirectory
    || dedicated !== (node.dedicated ?? true)
    || selectedCapabilities.join('|') !== initialCapabilities.join('|');

  const saveDetails = () => {
    onNodeDetailsChange({
      description: description.trim(),
      workingDirectory: workingDirectory.trim(),
      capabilities: selectedCapabilities.join(', '),
      dedicated,
    });
    setDetailsSaved(true);
    window.setTimeout(() => setDetailsSaved(false), 2200);
  };

  if (tab === 'Details') {
    return (
      <div className="flex w-full flex-col items-start gap-6 py-4 lg:flex-row">
        {/* Form card */}
        <div
          className="flex flex-shrink-0 flex-col gap-5 rounded-lg border border-[#D3E1EC] p-6"
          style={{ width: '380px' }}
        >
          <label className="flex flex-col gap-2">
            <span className="font-montserrat text-[14px] font-semibold leading-[140%] text-[#10233A]">Name</span>
            <input
              type="text"
              value={node.name}
              readOnly
              aria-readonly="true"
              className="h-[42px] w-full cursor-not-allowed rounded-lg border border-[#E5EDF9] bg-[#F8FDFF] px-[14px] font-montserrat text-[14px] font-normal leading-[140%] text-[#7288A3] outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-montserrat text-[14px] font-semibold leading-[140%] text-[#10233A]">Description</span>
            <textarea
              value={description}
              onChange={event => { setDescription(event.target.value); setDetailsSaved(false); }}
              rows={3}
              className="min-h-[78px] w-full resize-y rounded-lg border border-[#D3E1EC] bg-white px-[14px] py-[10px] font-montserrat text-[14px] font-normal leading-5 text-[#10233A] outline-none transition-colors placeholder:text-[#A1B6C6] focus:border-[#007EA7]"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-montserrat text-[14px] font-semibold leading-[140%] text-[#10233A]">Working Directory</span>
            <input
              type="text"
              value={workingDirectory}
              onChange={event => { setWorkingDirectory(event.target.value); setDetailsSaved(false); }}
              className="h-[42px] w-full rounded-lg border border-[#D3E1EC] bg-white px-[14px] font-montserrat text-[14px] font-normal leading-[140%] text-[#10233A] outline-none transition-colors placeholder:text-[#A1B6C6] focus:border-[#007EA7]"
            />
          </label>

          <MultiSelectField
            label="Capabilities"
            options={capabilityOptions}
            value={selectedCapabilities}
            onChange={value => { setSelectedCapabilities(value); setDetailsSaved(false); }}
            placeholder="Choose capabilities"
          />

          {/* Dedicated toggle */}
          <div className="flex flex-row items-center justify-between">
            <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Dedicated</span>
            <button
              type="button"
              role="switch"
              aria-checked={dedicated}
              aria-label="Dedicated"
              onClick={() => { setDedicated(value => !value); setDetailsSaved(false); }}
              className={`relative h-[24px] w-[44px] rounded-full transition-colors ${dedicated ? 'bg-[#007EA7]' : 'bg-[#D3E1EC]'}`}
            >
              <span className={`absolute left-[2px] top-[2px] h-[20px] w-[20px] rounded-full bg-white shadow transition-transform ${dedicated ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E5EDF9] pt-4">
            {detailsSaved && (
              <span role="status" className="font-montserrat text-[12px] font-medium text-[#258C51]">Changes saved</span>
            )}
            <button
              type="button"
              onClick={saveDetails}
              disabled={!detailsChanged}
              className={`flex h-[42px] items-center justify-center rounded-lg px-4 font-montserrat text-[16px] font-semibold leading-6 transition-colors ${
                detailsChanged
                  ? 'bg-[#007EA7] text-white hover:bg-[#006B8F]'
                  : 'cursor-not-allowed bg-[#F5F5F5] text-[#B4B6B8]'
              }`}
            >
              Update
            </button>
          </div>
        </div>
        <NodeAgentSummary
          monitoring={monitoring}
          features={features}
          featuresLoading={featuresLoading}
          featuresError={featuresError}
          loading={monitoringLoading}
          error={monitoringError}
        />
      </div>
    );
  }

  if (tab === 'Configuration parameters' || tab === 'Runs') {
    return (
      <NodeAutomationProcessDataTab
        tab={tab}
        node={node}
        configurationCreateSignal={configurationCreateSignal}
        onDisableNode={onDisableNode}
        onOpenAutomationRun={onOpenAutomationRun}
        onOpenAutomationProcess={onOpenAutomationProcess}
      />
    );
  }

  if (tab === 'Features') {
    return (
      <NodeFeaturesTab
        features={features}
        loading={featuresLoading}
        error={featuresError}
        onChangeStatus={onChangeFeatureStatus}
        onRefreshRows={onRefreshFeatureRows}
        onRedoRows={onRedoFeatureRows}
        onUpdateConfiguration={onUpdateFeatureConfiguration}
        onOpenLogs={onOpenFeatureLogs}
      />
    );
  }

  if (tab === 'Configuration parameters') {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-row items-center h-5 mb-1">
          <div className="flex-shrink-0" style={{ width: 180 }}>
            <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">Process name</span>
          </div>
          <div className="w-[4px] h-5 flex-shrink-0" style={{ background: 'linear-gradient(180deg, #E4F7FF 0%, transparent 100%)', opacity: 0.8 }} />
          <div className="flex-shrink-0 ml-6" style={{ width: 140 }}>
            <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Last run</span>
          </div>
          <div className="w-[4px] h-5 flex-shrink-0" style={{ background: 'linear-gradient(180deg, #E4F7FF 0%, transparent 100%)', opacity: 0.8 }} />
          <div className="flex-shrink-0 ml-6" style={{ width: 100 }}>
            <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Status</span>
          </div>
        </div>
        {[
          { name: 'AP_RUN SELENIUM', lastRun: '10.04.2026 12:22', status: 'Running' },
          { name: 'AP_DATA_EXTRACT', lastRun: '10.04.2026 11:05', status: 'Completed' },
          { name: 'AP_REPORT_GEN', lastRun: '09.04.2026 18:30', status: 'Idle' },
        ].map((proc, i) => (
          <div key={i} className={`flex flex-row items-center h-9 rounded-lg ${i % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'}`}>
            <div className="flex-shrink-0" style={{ width: 180 }}>
              <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{proc.name}</span>
            </div>
            <div className="w-[4px] h-5 flex-shrink-0 bg-transparent" />
            <div className="flex-shrink-0 ml-6" style={{ width: 140 }}>
              <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3]">{proc.lastRun}</span>
            </div>
            <div className="w-[4px] h-5 flex-shrink-0 bg-transparent" />
            <div className="flex-shrink-0 ml-6" style={{ width: 100 }}>
              <div className="flex items-center gap-1.5">
                <div className={`w-[6px] h-[6px] rounded-full ${proc.status === 'Running' ? 'bg-[#0ED8A8]' : proc.status === 'Completed' ? 'bg-[#007EA7]' : 'bg-[#A1B6C6]'}`} />
                <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3]">{proc.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'Runs') {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-row items-center h-5 mb-1">
          <div className="flex-shrink-0" style={{ width: 100 }}>
            <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">Run ID</span>
          </div>
          <div className="w-[4px] h-5 flex-shrink-0" style={{ background: 'linear-gradient(180deg, #E4F7FF 0%, transparent 100%)', opacity: 0.8 }} />
          <div className="flex-shrink-0 ml-6" style={{ width: 160 }}>
            <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Process</span>
          </div>
          <div className="w-[4px] h-5 flex-shrink-0" style={{ background: 'linear-gradient(180deg, #E4F7FF 0%, transparent 100%)', opacity: 0.8 }} />
          <div className="flex-shrink-0 ml-6" style={{ width: 140 }}>
            <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Started</span>
          </div>
          <div className="w-[4px] h-5 flex-shrink-0" style={{ background: 'linear-gradient(180deg, #E4F7FF 0%, transparent 100%)', opacity: 0.8 }} />
          <div className="flex-shrink-0 ml-6" style={{ width: 80 }}>
            <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Duration</span>
          </div>
          <div className="w-[4px] h-5 flex-shrink-0" style={{ background: 'linear-gradient(180deg, #E4F7FF 0%, transparent 100%)', opacity: 0.8 }} />
          <div className="flex-shrink-0 ml-6" style={{ width: 80 }}>
            <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Result</span>
          </div>
        </div>
        {[
          { id: '#1042', process: 'AP_RUN SELENIUM', started: '10.04.2026 12:22', duration: '2m 14s', result: 'Success' },
          { id: '#1041', process: 'AP_DATA_EXTRACT', started: '10.04.2026 11:05', duration: '45s', result: 'Success' },
          { id: '#1040', process: 'AP_REPORT_GEN', started: '09.04.2026 18:30', duration: '1m 02s', result: 'Failed' },
        ].map((run, i) => (
          <div key={i} className={`flex flex-row items-center h-9 rounded-lg ${i % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'}`}>
            <div className="flex-shrink-0" style={{ width: 100 }}>
              <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#007EA7]">{run.id}</span>
            </div>
            <div className="w-[4px] h-5 flex-shrink-0 bg-transparent" />
            <div className="flex-shrink-0 ml-6" style={{ width: 160 }}>
              <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{run.process}</span>
            </div>
            <div className="w-[4px] h-5 flex-shrink-0 bg-transparent" />
            <div className="flex-shrink-0 ml-6" style={{ width: 140 }}>
              <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3]">{run.started}</span>
            </div>
            <div className="w-[4px] h-5 flex-shrink-0 bg-transparent" />
            <div className="flex-shrink-0 ml-6" style={{ width: 80 }}>
              <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3]">{run.duration}</span>
            </div>
            <div className="w-[4px] h-5 flex-shrink-0 bg-transparent" />
            <div className="flex-shrink-0 ml-6" style={{ width: 80 }}>
              <span className={`font-montserrat font-normal text-[12px] leading-[18px] ${run.result === 'Success' ? 'text-[#0ED8A8]' : 'text-red-500'}`}>{run.result}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'Logs') {
    return <NodeLogsTab node={node} />;
  }

  if (tab === 'Metrics') {
    return <NodeMetricsTab />;
  }

  if (tab === 'Notifications') {
    return (
      <div className="flex flex-1 flex-col py-4">
        <AlertsTab createSignal={notificationCreateSignal} alerts={notifications} setAlerts={setNotifications} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <h2 className="font-montserrat font-semibold text-[18px] leading-6 text-[#10233A]">{tab}</h2>
      <p className="font-montserrat font-normal text-[14px] leading-5 text-[#7288A3]">
        No {tab.toLowerCase()} data available
      </p>
    </div>
  );
}

function NodeAutomationProcessDataTab({
  tab,
  node,
  configurationCreateSignal,
  onDisableNode,
  onOpenAutomationRun,
  onOpenAutomationProcess,
}: {
  tab: 'Configuration parameters' | 'Runs';
  node: NodeRow;
  configurationCreateSignal: number;
  onDisableNode: () => void;
  onOpenAutomationRun: (run: RunRecord) => void;
  onOpenAutomationProcess: (run: RunRecord) => void;
}) {
  const normalizeNodeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nodeAliases = new Set([
    normalizeNodeName(node.name),
    normalizeNodeName(`Node-${node.id}`),
    normalizeNodeName(`Node-${node.id.padStart(2, '0')}`),
  ]);
  const belongsToNode = useCallback(
    (run: RunRecord) => nodeAliases.has(normalizeNodeName(run.node)),
    [node.id, node.name],
  );
  const readNodeRuns = useCallback(
    () => getAggregatedRuns().filter(belongsToNode),
    [belongsToNode],
  );
  const [runs, setRunsState] = useState<RunRecord[]>(readNodeRuns);
  const runsRef = useRef<RunRecord[]>(runs);
  const [runsRefreshSignal, setRunsRefreshSignal] = useState(0);
  const [runsBulkDeleteSignal, setRunsBulkDeleteSignal] = useState(0);
  const [runsSelectedCount, setRunsSelectedCount] = useState(0);
  const [runDetailOpen, setRunDetailOpen] = useState(false);
  const [configurationRefreshSignal, setConfigurationRefreshSignal] = useState(0);
  const [configurationBulkDeleteSignal, setConfigurationBulkDeleteSignal] = useState(0);
  const [configurationSelectedCount, setConfigurationSelectedCount] = useState(0);
  const [, setConfigurationItemCount] = useState(1);
  const [showColumns, setShowColumns] = useState(false);
  const [detailColumns, setDetailColumns] = useState<ColConfig[]>([
    ...(tab === 'Runs'
      ? [
          { key: 'run_id', label: 'Run ID', width: 120, visible: true },
          { key: 'process_name', label: 'Process Name', width: 160, visible: true },
          { key: 'tasks_count', label: 'Tasks count', width: 100, visible: true },
          { key: 'status', label: 'Status', width: 130, visible: true },
          { key: 'created_by', label: 'Created by', width: 140, visible: true },
          { key: 'creation_date', label: 'Creation date', width: 170, visible: true },
        ]
      : [
          { key: 'key', label: 'Key', width: 200, visible: true },
          { key: 'value', label: 'Value', width: 320, visible: true },
        ]),
  ]);

  useEffect(() => {
    runsRef.current = runs;
  }, [runs]);

  useEffect(() => {
    const reloadNodeRuns = () => {
      const nextRuns = readNodeRuns();
      runsRef.current = nextRuns;
      setRunsState(nextRuns);
    };
    window.addEventListener('finansu-harmonija:runs-changed', reloadNodeRuns);
    reloadNodeRuns();
    return () => window.removeEventListener('finansu-harmonija:runs-changed', reloadNodeRuns);
  }, [readNodeRuns]);

  const setRuns = useCallback((value: RunRecord[] | ((current: RunRecord[]) => RunRecord[])) => {
    const current = runsRef.current;
    const next = typeof value === 'function' ? value(current) : value;
    const runKey = (run: RunRecord) => `${run.processId ?? ''}:${run.id}`;
    const nextByKey = new Map(next.map(run => [runKey(run), run]));
    const removed = current
      .filter(run => !nextByKey.has(runKey(run)) && run.processId)
      .map(run => ({ processId: run.processId as string, runId: run.id }));

    if (removed.length > 0) {
      deleteAggregatedRuns(removed);
    }

    current.forEach(run => {
      if (!run.processId) return;
      const updated = nextByKey.get(runKey(run));
      if (updated && updated.status !== run.status) {
        updateAggregatedRun(run.processId, run.id, stored => ({ ...stored, status: updated.status }));
      }
    });

    const refreshed = readNodeRuns();
    runsRef.current = refreshed;
    setRunsState(refreshed);
  }, [readNodeRuns]);

  const exportConfiguration = () => {
    const data = {
      nodeId: node.id,
      nodeName: node.name,
      type: 'configuration-parameters',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${node.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-configuration.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isConfiguration = tab === 'Configuration parameters';

  return (
    <div className="flex min-h-[520px] flex-1 flex-col gap-4 py-4">
      {!runDetailOpen && (
        <div className="flex flex-row justify-end">
          <div className="flex h-7 flex-row items-center gap-4 rounded bg-white px-[6px] py-[6px]">
            <BulkDeleteButton
              selectedCount={isConfiguration ? configurationSelectedCount : runsSelectedCount}
              onDelete={() => {
                if (isConfiguration) {
                  setConfigurationBulkDeleteSignal(signal => signal + 1);
                } else {
                  setRunsBulkDeleteSignal(signal => signal + 1);
                }
              }}
            />
            <ColumnSettingsButton onClick={() => setShowColumns(true)} />
            {isConfiguration && (
              <>
                <button
                  type="button"
                  data-button-family="export"
                  title="EXPORT"
                  aria-label={`EXPORT ${node.name} configuration parameters`}
                  onClick={exportConfiguration}
                  className="flex h-4 w-4 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7]"
                >
                  <Download size={16} />
                </button>
                <ImportButton scope={`Node ${node.name} configuration parameters`} />
              </>
            )}
            <RefreshAllButton
              onRefresh={() => {
                if (isConfiguration) {
                  setConfigurationRefreshSignal(signal => signal + 1);
                } else {
                  setRunsRefreshSignal(signal => signal + 1);
                }
              }}
            />
            {isConfiguration && (
              <button
                type="button"
                disabled={node.status === 'Inactive'}
                onClick={onDisableNode}
                className="flex h-4 w-4 items-center justify-center text-[#7288A3] transition-colors hover:text-[#D64545] disabled:cursor-not-allowed disabled:opacity-40"
                title="IŠJUNGTI"
                aria-label={`IŠJUNGTI node ${node.name}`}
              >
                <Power size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        {isConfiguration ? (
          <NodesTab
            refreshSignal={configurationRefreshSignal}
            createSignal={configurationCreateSignal}
            bulkDeleteSignal={configurationBulkDeleteSignal}
            onSelectionCountChange={setConfigurationSelectedCount}
            onItemCountChange={setConfigurationItemCount}
          />
        ) : (
          <RunsTab
            startSignal={0}
            refreshSignal={runsRefreshSignal}
            bulkDeleteSignal={runsBulkDeleteSignal}
            runs={runs}
            setRuns={setRuns}
            onDetailOpenChange={setRunDetailOpen}
            onSelectionCountChange={setRunsSelectedCount}
            onRunOpen={onOpenAutomationRun}
            onProcessOpen={onOpenAutomationProcess}
            showProcessName
          />
        )}
      </div>

      {showColumns && (
        <ColumnSettingsPanel
          columns={detailColumns}
          onSave={setDetailColumns}
          onClose={() => setShowColumns(false)}
        />
      )}
    </div>
  );
}

function MonitoringView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col bg-white min-h-full" style={{ padding: '56px 72px', gap: '32px' }}>
      {/* Header */}
      <div className="flex flex-row items-center gap-2 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-[#7288A3] hover:text-[#007EA7] transition-colors">
          <ArrowLeft size={16} />
          <span className="font-montserrat font-medium text-[12px] leading-[18px]">Back to node details</span>
        </button>
      </div>

      <h1 className="font-montserrat font-semibold text-[36px] leading-[46px] text-[#10233A]">
        Monitoring
      </h1>

      {/* Toolbar */}
      <div className="flex flex-row items-center gap-3 px-4 py-2 rounded-lg" style={{ backgroundColor: '#EFF7FF' }}>
        <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Time range:</span>
        <button className="h-7 px-3 bg-white border border-[#D3E1EC] rounded flex items-center">
          <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">Last 24 hours</span>
        </button>
        <button className="h-7 px-3 bg-white border border-[#D3E1EC] rounded flex items-center">
          <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">Last 7 days</span>
        </button>
        <button className="h-7 px-3 bg-white border border-[#D3E1EC] rounded flex items-center">
          <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">Last 30 days</span>
        </button>
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage */}
        <div className="flex flex-col gap-4 border border-[#E5EDF9] rounded-lg" style={{ padding: '24px' }}>
          <span className="font-montserrat font-semibold text-[18px] leading-6 text-[#10233A]">CPU Usage</span>
          <div className="h-[180px] relative flex items-end">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="w-full h-px bg-[#E5EDF9]" />
              ))}
            </div>
            <div className="relative z-10 flex items-end gap-2 w-full h-full px-2">
              {[65, 42, 78, 55, 90, 38, 72, 60, 85, 45, 68, 52].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end h-full">
                  <div
                    className="w-full rounded-t-sm bg-[#007EA7]"
                    style={{ height: `${val}%`, opacity: 0.7 }}
                  />
                </div>
              ))}
            </div>
            <span className="absolute bottom-2 right-3 font-montserrat font-normal text-[12px] text-[#10B981]">No data</span>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="flex flex-col gap-4 border border-[#E5EDF9] rounded-lg" style={{ padding: '24px' }}>
          <span className="font-montserrat font-semibold text-[18px] leading-6 text-[#10233A]">Memory Usage</span>
          <div className="h-[180px] relative flex items-end">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="w-full h-px bg-[#E5EDF9]" />
              ))}
            </div>
            <div className="relative z-10 flex items-end gap-2 w-full h-full px-2">
              {[30, 35, 42, 38, 45, 50, 48, 55, 52, 60, 58, 62].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end h-full">
                  <div
                    className="w-full rounded-t-sm bg-[#0ED8A8]"
                    style={{ height: `${val}%`, opacity: 0.7 }}
                  />
                </div>
              ))}
            </div>
            <span className="absolute bottom-2 right-3 font-montserrat font-normal text-[12px] text-[#10B981]">No data</span>
          </div>
        </div>

        {/* Automation processes */}
        <div className="flex flex-col gap-4 border border-[#E5EDF9] rounded-lg" style={{ padding: '24px' }}>
          <span className="font-montserrat font-semibold text-[18px] leading-6 text-[#10233A]">Automation processes</span>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Running', value: 3, color: '#0ED8A8', pct: 30 },
              { label: 'Queued', value: 5, color: '#007EA7', pct: 50 },
              { label: 'Failed', value: 1, color: '#E5484D', pct: 10 },
              { label: 'Completed', value: 12, color: '#D3E1EC', pct: 100 },
            ].map(item => (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex flex-row items-center justify-between">
                  <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{item.label}</span>
                  <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3]">{item.value}</span>
                </div>
                <div className="h-[6px] bg-[#E5EDF9] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks overview */}
        <div className="flex flex-col gap-4 border border-[#E5EDF9] rounded-lg" style={{ padding: '24px' }}>
          <span className="font-montserrat font-semibold text-[18px] leading-6 text-[#10233A]">Tasks (last 24h)</span>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total', value: '21', accent: '#10233A' },
              { label: 'Successful', value: '18', accent: '#0ED8A8' },
              { label: 'Failed', value: '2', accent: '#E5484D' },
              { label: 'Pending', value: '1', accent: '#007EA7' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col gap-2 items-center p-4 bg-[#F8FDFF] rounded-lg border border-[#E5EDF9]">
                <span className="font-montserrat font-semibold text-[28px] leading-9" style={{ color: stat.accent }}>{stat.value}</span>
                <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
