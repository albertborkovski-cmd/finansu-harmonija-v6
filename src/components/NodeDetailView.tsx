import { useState } from 'react';
import { ArrowLeft, X, Search, Trash2, Columns3, Download, RefreshCw, RotateCw, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, Check, Clock3, ZoomOut, ZoomIn } from 'lucide-react';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import StopButton from './StopButton';
import RecordRefreshButton from './RecordRefreshButton';
import ImportButton from './ImportButton';

const TABS = ['Details', 'Configuration parameters', 'Runs', 'Features', 'Logs', 'Metrics', 'Notifications'] as const;
type Tab = typeof TABS[number];

interface Props {
  nodeName: string;
  memberName: string;
  onBack: () => void;
  onBackToNodeManagement: () => void;
}

export default function NodeDetailView({ nodeName, memberName, onBack, onBackToNodeManagement }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Details');

  const groupTitle = `Group Management (${nodeName} DataStore)`;

  return (
    <div className="flex flex-col bg-white min-h-full" style={{ padding: '56px 72px', gap: '32px', display: 'flex', flexDirection: 'column' }}>

      {/* Header section */}
      <div className="flex flex-col" style={{ gap: '16px' }}>

        {/* Title row */}
        <div className="flex flex-row justify-between items-start">
          {/* Left: back + title */}
          <div className="flex flex-row items-center" style={{ gap: '16px' }}>
            <button
              onClick={onBack}
              className="flex items-center justify-center flex-shrink-0 text-[#7288A3] hover:text-[#007EA7] transition-colors"
              style={{ width: '18px', height: '18px', padding: '9px 1px' }}
            >
              <ArrowLeft size={16} />
            </button>
            <span className="font-montserrat font-semibold text-[#10233A]" style={{ fontSize: '36px', lineHeight: '46px' }}>
              Node details
            </span>
          </div>

          {/* Right: action buttons */}
          <div className="flex flex-row items-start" style={{ gap: '8px' }}>
            {/* Actions - active */}
            <button
              className="flex items-center justify-center border-2 border-[#D3E1EC] rounded-[6px] bg-white hover:border-[#007EA7] transition-colors"
              style={{ width: '80px', height: '32px', padding: '6px 12px' }}
            >
              <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">Redo</span>
            </button>
            {/* Standart - active */}
            <button
              className="flex items-center justify-center border-2 border-[#D3E1EC] rounded-[6px] bg-white hover:border-[#007EA7] transition-colors"
              style={{ width: '98px', height: '32px', padding: '6px 12px' }}
            >
              <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">Download</span>
            </button>
            {/* Delete - disabled */}
            <button
              disabled
              className="flex items-center justify-center rounded-[6px] bg-white cursor-not-allowed"
              style={{ width: '77px', height: '32px', padding: '6px 12px', border: '2px solid #F5F5F5' }}
            >
              <span className="font-montserrat font-semibold text-[14px] leading-5" style={{ color: '#B4B6B8' }}>Restart</span>
            </button>
            {/* Download - disabled */}
            <button
              disabled
              className="flex items-center justify-center rounded-[6px] bg-white cursor-not-allowed"
              style={{ width: '103px', height: '32px', padding: '6px 12px', border: '2px solid #F5F5F5' }}
            >
              <span className="font-montserrat font-semibold text-[14px] leading-5" style={{ color: '#B4B6B8' }}>Shut down</span>
            </button>
            {/* Download node - disabled */}
            <button
              disabled
              className="flex items-center justify-center rounded-[6px] cursor-not-allowed"
              style={{ width: '143px', height: '32px', padding: '6px 12px', background: '#F5F5F5' }}
            >
              <span className="font-montserrat font-semibold text-[14px] leading-5" style={{ color: '#B4B6B8' }}>Upgrade version</span>
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex flex-row items-start" style={{ gap: '8px' }}>
          <div className="flex flex-col items-start">
            <button
              onClick={onBackToNodeManagement}
              className="font-montserrat font-medium text-[12px] leading-[17px] text-[#7288A3] hover:text-[#007EA7] transition-colors whitespace-nowrap"
            >
              Node management
            </button>
          </div>
          <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#A1B6C6]">/</span>
          <div className="flex flex-col items-start">
            <button
              onClick={onBack}
              className="font-montserrat font-medium text-[12px] leading-[17px] text-[#7288A3] hover:text-[#007EA7] transition-colors whitespace-nowrap"
            >
              {groupTitle}
            </button>
          </div>
          <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#A1B6C6]">/</span>
          <div className="flex flex-col items-start">
            <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#A1B6C6]">
              Node details
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-row items-start border-b border-[#E5EDF9]" style={{ gap: '24px' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex flex-col items-start"
              style={{ gap: '16px', paddingBottom: '0px' }}
            >
              <span
                className="font-montserrat font-medium text-[16px] leading-[22px] whitespace-nowrap"
                style={{ color: isActive ? '#007EA7' : '#10233A' }}
              >
                {tab}
              </span>
              <div
                className="h-[2px] self-stretch"
                style={{ backgroundColor: '#007EA7', opacity: isActive ? 1 : 0 }}
              />
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex w-full flex-row" style={{ gap: '32px' }}>
        {activeTab === 'Details' && <GeneralTab memberName={memberName} />}
        {activeTab === 'Configuration parameters' && <ConfigurationParametersTab />}
        {activeTab === 'Runs' && <RunsTab />}
        {activeTab === 'Features' && <FeaturesTab />}
        {activeTab === 'Logs' && <LogsTab />}
        {activeTab === 'Metrics' && <NodeMetricsTab />}
        {activeTab === 'Notifications' && <NotificationsTab />}
      </div>
    </div>
  );
}

interface SearchQueryConstructorProps {
  ariaLabel: string;
  value: string;
  onSearch: (value: string) => void;
}

function SearchQueryConstructor({ ariaLabel, value, onSearch }: SearchQueryConstructorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [column, setColumn] = useState('All columns');
  const [condition, setCondition] = useState('Contains');

  const open = () => {
    setQuery(value);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);
  const submit = () => {
    onSearch(query.trim());
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={open}
        className="flex h-7 w-[260px] flex-row items-center justify-between gap-1 rounded bg-[#E5EDF9] px-2 text-left"
      >
        <span className={`min-w-0 flex-1 truncate font-montserrat text-[12px] font-medium leading-[18px] ${value ? 'text-[#10233A]' : 'text-[#7288A3]'}`}>
          {value || 'Search'}
        </span>
        <Search size={16} className="flex-shrink-0 text-[#7288A3]" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10233A]/10"
          role="presentation"
          onMouseDown={event => {
            if (event.currentTarget === event.target) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-query-constructor-title"
            className="flex h-[486px] w-[588px] flex-col gap-6 rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.102)]"
          >
            <div className="flex h-6 w-full flex-row items-start justify-between gap-2">
              <h2 id="search-query-constructor-title" className="font-montserrat text-[16px] font-semibold leading-6 text-[#10233A]">
                Search query constructor
              </h2>
              <button type="button" aria-label="Close search query constructor" onClick={close} className="flex h-6 w-6 items-center justify-center text-[#7288A3] hover:text-[#007EA7]">
                <X size={24} />
              </button>
            </div>

            <div className="flex h-[324px] w-full flex-col gap-6">
              <textarea
                aria-label="Search query"
                value={query}
                onChange={event => setQuery(event.target.value)}
                className="h-20 w-full resize-none rounded-lg border border-[#D3E1EC] bg-white px-3.5 py-[11px] font-montserrat text-[14px] font-medium leading-5 text-[#10233A] outline-none focus:border-[#007EA7]"
              />

              <label className="flex h-[70px] w-full flex-col gap-2">
                <span className="font-montserrat text-[14px] font-semibold leading-5 text-[#10233A]">Column</span>
                <span className="relative flex h-[42px] w-full items-center">
                  <select
                    aria-label="Search column"
                    value={column}
                    onChange={event => setColumn(event.target.value)}
                    className="h-[42px] w-full appearance-none rounded-lg border border-[#D3E1EC] bg-white px-3.5 pr-10 font-montserrat text-[14px] font-medium leading-5 text-[#10233A] outline-none focus:border-[#007EA7]"
                  >
                    <option>All columns</option>
                    <option>Name</option>
                    <option>Status</option>
                    <option>Created by</option>
                    <option>Creation date</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3.5 text-[#7288A3]" />
                </span>
              </label>

              <div className="flex h-[70px] w-full flex-row gap-4">
                <label className="flex h-[70px] w-[360px] flex-col gap-2">
                  <span className="font-montserrat text-[14px] font-semibold leading-5 text-[#10233A]">Value</span>
                  <input
                    aria-label="Search value"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    className="h-[42px] w-full rounded-lg border border-[#D3E1EC] bg-white px-3.5 font-montserrat text-[14px] font-medium leading-5 text-[#10233A] outline-none focus:border-[#007EA7]"
                  />
                </label>
                <label className="flex h-[70px] min-w-0 flex-1 flex-col gap-2">
                  <span className="invisible font-montserrat text-[14px] font-semibold leading-5">Condition</span>
                  <span className="relative flex h-[42px] w-full items-center">
                    <select
                      aria-label="Search condition"
                      value={condition}
                      onChange={event => setCondition(event.target.value)}
                      className="h-[42px] w-full appearance-none rounded-lg border border-[#D3E1EC] bg-white px-3.5 pr-9 font-montserrat text-[14px] font-medium leading-5 text-[#A1B6C6] outline-none focus:border-[#007EA7]"
                    >
                      <option>Contains</option>
                      <option>Equals</option>
                      <option>Starts with</option>
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3.5 text-[#7288A3]" />
                  </span>
                </label>
              </div>

              <button type="button" className="h-8 w-[115px] font-montserrat text-[14px] font-semibold leading-5 text-[#7288A3] hover:text-[#007EA7]">
                Add condition
              </button>
            </div>

            <div className="flex h-[42px] w-full flex-row justify-end gap-2">
              <button type="button" onClick={close} className="flex h-[42px] w-[88px] items-center justify-center rounded-lg border-2 border-[#D3E1EC] bg-white font-montserrat text-[16px] font-semibold leading-6 text-[#7288A3] hover:border-[#007EA7]">
                Cancel
              </button>
              <button data-system-action="true" type="button" onClick={submit} className="flex h-[42px] w-20 items-center justify-center rounded-lg bg-[#007EA7] font-montserrat text-[16px] font-semibold leading-6 text-white hover:bg-[#006f94]">
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NotificationsTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const totalPages = 9;

  return (
    <div className="relative flex min-h-[672px] w-full flex-col gap-6">
      <div className="flex h-7 w-full flex-row flex-wrap items-start justify-between gap-2">
        <SearchQueryConstructor ariaLabel="Search notifications" value={search} onSearch={setSearch} />

        <div className="flex h-7 w-[124px] flex-row items-center gap-4 rounded bg-white p-1.5 text-[#7288A3]">
          <button type="button" title="ALL DELETE" aria-label="Delete selected notifications" disabled className="cursor-not-allowed opacity-50"><Trash2 size={16} /></button>
          <button type="button" aria-label="Notification columns" className="transition-colors hover:text-[#007EA7]"><Columns3 size={16} /></button>
          <ImportButton scope="Node notifications" />
          <button type="button" title="REFRESH ALL" aria-label="Refresh all notifications" className="transition-colors hover:text-[#007EA7]"><RefreshCw size={16} /></button>
        </div>
      </div>

      <div className="relative flex h-[620px] w-full flex-col justify-between gap-12">
        <div className="flex flex-col gap-4">
          <div aria-label="Notifications table columns" className="flex h-5 w-full flex-row items-center pl-3 font-montserrat text-[12px] font-medium leading-[18px] text-[#7288A3]">
            <div className="flex w-[184px] flex-shrink-0 items-center gap-1.5">
              <div className="h-[18px] w-[18px] rounded-[6px] border border-[#A1B6C6] bg-white" />
              <span>Notification ID</span>
            </div>
            <div className="mx-3 h-5 border-l border-[#D3E1EC]" />
            <span className="w-[180px]">Event ID</span>
            <div className="mx-3 h-5 border-l border-[#D3E1EC]" />
            <span className="w-[180px]">Name</span>
          </div>
        </div>

        <div className="absolute left-1/2 top-[221px] flex h-[126px] w-80 -translate-x-1/2 flex-col items-center gap-6">
          <div className="flex w-full flex-col items-center gap-4">
            <span className="w-full text-center font-montserrat text-[18px] font-semibold leading-6 text-[#10233A]">Empty collection</span>
            <span className="w-full text-center font-montserrat text-[14px] font-medium leading-5 text-[#10233A]">Press “Create new” button to start your work</span>
          </div>
          <button data-system-action="true" type="button" className="flex h-[42px] w-[126px] items-center justify-center rounded-lg bg-[#007EA7] px-4 py-[9px] font-montserrat text-[16px] font-semibold leading-6 text-white hover:bg-[#006f94]">
            Create new
          </button>
        </div>

        <HorizontalTableScrollbar />

        <div className="flex h-8 w-full flex-row flex-wrap items-center justify-between gap-4">
          <TablePagination currentPage={page} totalPages={totalPages} itemCount={0} onPageChange={setPage} />

          <div className="flex h-8 flex-row items-center gap-3.5">
            <span className="font-montserrat text-[12px] font-normal leading-[18px] text-[#7288A3]">14 from 15,000 items</span>
            <button type="button" className="flex h-8 items-center justify-center rounded-md border-2 border-[#D3E1EC] bg-white px-3 font-montserrat text-[14px] font-semibold text-[#7288A3]">Rows per page</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricChartCard({ title, className = '' }: { title: string; className?: string }) {
  return (
    <div className={`flex h-48 min-w-0 flex-col gap-6 rounded-lg border border-[#E5EDF9] bg-white p-6 ${className}`}>
      <h3 className="font-montserrat text-[18px] font-semibold leading-6 text-[#10233A]">{title}</h3>
      <div className="relative flex h-24 w-full items-center justify-center">
        <div className="absolute inset-0 flex flex-col justify-between opacity-30" aria-hidden="true">
          <div className="border-t border-[#E2E8F0]" />
          <div className="border-t border-[#E2E8F0]" />
          <div className="border-t border-[#E2E8F0]" />
        </div>
        <span className="relative z-10 font-montserrat text-[14px] font-semibold leading-5 text-[#10B981]">No data</span>
      </div>
    </div>
  );
}

function NodeResourcesChart() {
  const memory = [56, 57, 61, 62, 7, 12, 17, 17, 23, 25, 25, 34, 35, 41, 41, 47, 49, 55, 56, 62, 63, 10, 11, 16, 16, 22, 22, 28, 30, 36, 36, 42, 43, 46];
  const cpu = [1.1, 2.0, 1.8, 2.1, 1.3, 1.8, 1.2, 1.6, 1.1, 1.9, 1.8, 1.2, 2.0, 1.1, 1.3, 1.0, 1.4, 1.1, 1.8, 1.2, 1.9, 1.1, 1.6, 1.2, 2.4, 1.3, 1.8, 2.0, 1.2, 2.3, 2.1, 1.5, 3.3, 1.4];
  const taskExecutors = [0.3, 0.4, 0.3, 0.5, 0.2, 0.4, 0.4, 0.3, 0.5, 0.3, 0.4, 0.3, 0.5, 0.3, 0.4, 0.3, 0.5, 0.3, 0.4, 0.5, 0.3, 0.4, 0.3, 0.5, 0.4, 0.3, 0.5, 0.3, 0.4, 0.3, 0.5, 0.4, 0.3, 0.5];
  const uiExecutors = [0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1];
  const plotLeft = 48;
  const plotRight = 980;
  const plotTop = 12;
  const plotBottom = 172;
  const toPoints = (values: number[]) => values.map((value, index) => {
    const x = plotLeft + (index / (values.length - 1)) * (plotRight - plotLeft);
    const y = plotBottom - (value / 70) * (plotBottom - plotTop);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const memoryPoints = toPoints(memory);
  const timeLabels = ['10:40', '10:45', '10:50', '10:55', '11:00', '11:05', '11:10', '11:15', '11:20', '11:25', '11:30', '11:35'];
  const legend = [
    { label: 'CPU Usage %', color: '#43A95B' },
    { label: 'Task Executors Usage %', color: '#E4B600' },
    { label: 'UI Executors Usage %', color: '#4C86D9' },
    { label: 'Memory Usage %', color: '#FF6B2C' },
  ];

  return (
    <div className="flex min-h-[320px] w-full flex-col rounded-xl border border-[#D3E1EC] bg-white p-5 shadow-[0_1px_2px_rgba(16,35,58,0.04)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-montserrat text-[18px] font-semibold leading-6 text-[#10233A]">Node resources</h3>
        <span className="rounded-full bg-[#EAF8F2] px-3 py-1 font-montserrat text-[12px] font-semibold text-[#0A8F6A]">Live data</span>
      </div>
      <div className="min-h-[220px] flex-1 overflow-x-auto">
        <svg viewBox="0 0 1000 220" className="h-full min-w-[760px] w-full" role="img" aria-label="Node resource usage over the last hour">
          <defs>
            <linearGradient id="memoryUsageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B2C" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#FF6B2C" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {[0, 10, 20, 30, 40, 50, 60, 70].map(value => {
            const y = plotBottom - (value / 70) * (plotBottom - plotTop);
            return <g key={value}><line x1={plotLeft} x2={plotRight} y1={y} y2={y} stroke="#E5EDF9" strokeWidth="1" /><text x="38" y={y + 4} textAnchor="end" fill="#7288A3" fontSize="10" fontFamily="Montserrat">{value}</text></g>;
          })}
          {timeLabels.map((label, index) => {
            const x = plotLeft + (index / (timeLabels.length - 1)) * (plotRight - plotLeft);
            return <g key={label}><line x1={x} x2={x} y1={plotTop} y2={plotBottom} stroke="#EEF3F7" strokeWidth="1" /><text x={x} y="194" textAnchor="middle" fill="#7288A3" fontSize="10" fontFamily="Montserrat">{label}</text></g>;
          })}
          <polygon points={`${plotLeft},${plotBottom} ${memoryPoints} ${plotRight},${plotBottom}`} fill="url(#memoryUsageFill)" />
          <polyline points={memoryPoints} fill="none" stroke="#FF6B2C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={toPoints(cpu)} fill="none" stroke="#43A95B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={toPoints(taskExecutors)} fill="none" stroke="#E4B600" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={toPoints(uiExecutors)} fill="none" stroke="#4C86D9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
        {legend.map(item => <div key={item.label} className="flex items-center gap-2"><span className="h-[3px] w-5 rounded-full" style={{ backgroundColor: item.color }} /><span className="font-montserrat text-[12px] font-medium text-[#7288A3]">{item.label}</span></div>)}
      </div>
    </div>
  );
}

export function NodeMetricsTab() {
  const [timeRange, setTimeRange] = useState('Last 1 hour');
  const [interval, setInterval] = useState('1m');

  return (
    <div className="flex min-h-[680px] w-full flex-col overflow-hidden rounded-2xl bg-[#EFF7FF]">
      <div className="flex h-9 w-full flex-row items-center justify-between gap-4 px-3 pb-1 pt-3">
        <div className="flex h-5 items-center gap-6">
          <label className="relative flex h-5 w-[120px] items-center gap-2 rounded">
            <Clock3 size={16} className="flex-shrink-0 text-[#7288A3]" />
            <select
              aria-label="Metrics time range"
              value={timeRange}
              onChange={event => setTimeRange(event.target.value)}
              className="h-5 min-w-0 flex-1 appearance-none bg-transparent pr-5 font-montserrat text-[14px] font-medium leading-5 text-[#10233A] outline-none"
            >
              <option>Last 15 minutes</option>
              <option>Last 30 minutes</option>
              <option>Last 1 hour</option>
              <option>Last 6 hours</option>
              <option>Last 24 hours</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-0 text-[#10233A]" />
          </label>

          <label className="relative flex h-5 w-11 items-center rounded">
            <select
              aria-label="Metrics interval"
              value={interval}
              onChange={event => setInterval(event.target.value)}
              className="h-5 w-full appearance-none bg-transparent pr-5 font-montserrat text-[14px] font-medium leading-5 text-[#10233A] outline-none"
            >
              <option>1m</option>
              <option>5m</option>
              <option>15m</option>
              <option>1h</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-0 text-[#10233A]" />
          </label>
        </div>

        <div className="flex h-4 items-center gap-4 text-[#7288A3]">
          <button type="button" aria-label="Zoom metrics out" className="hover:text-[#007EA7]"><ZoomOut size={16} /></button>
          <button type="button" aria-label="Zoom metrics in" className="hover:text-[#007EA7]"><ZoomIn size={16} /></button>
          <button type="button" title="REFRESH ALL" aria-label="Refresh all metrics" className="hover:text-[#007EA7]"><RefreshCw size={16} /></button>
        </div>
      </div>

      <div className="flex flex-1 w-full flex-col gap-2 p-2">
        <button type="button" className="flex h-6 items-center gap-2 self-start rounded text-[#10233A]">
          <span className="font-montserrat text-[18px] font-semibold leading-6">Resources usage</span>
          <ChevronDown size={16} />
        </button>

        <NodeResourcesChart />

        <button type="button" className="flex h-6 items-center gap-2 self-start rounded text-[#10233A]">
          <span className="font-montserrat text-[18px] font-semibold leading-6">Events</span>
          <ChevronDown size={16} />
        </button>

        <div className="flex h-48 w-full flex-row gap-2">
          <MetricChartCard title="Automation processes" className="flex-1" />
          <MetricChartCard title="Tasks" className="flex-1" />
        </div>
      </div>
    </div>
  );
}

function LogsTab() {
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');

  return (
    <div className="relative flex min-h-[672px] w-full flex-col gap-6">
      {/* Toolbar */}
      <div className="flex h-7 flex-row flex-wrap items-start justify-between gap-2">
        <div className="flex flex-row items-start gap-1">
          <SearchQueryConstructor ariaLabel="Search logs" value={search} onSearch={setSearch} />

          <label className="relative flex h-7 w-[157px] items-center rounded bg-[#E5EDF9]">
            <select
              aria-label="Filter logs by severity"
              value={severity}
              onChange={event => setSeverity(event.target.value)}
              className="h-full w-full appearance-none bg-transparent px-2 pr-7 font-montserrat text-[12px] font-medium leading-[18px] text-[#7288A3] outline-none"
            >
              <option value="all">Filter by severity: All</option>
              <option value="info">Filter by severity: Info</option>
              <option value="warning">Filter by severity: Warning</option>
              <option value="error">Filter by severity: Error</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-1.5 rotate-180 text-[#7288A3]" />
          </label>
        </div>

        <div className="flex h-7 flex-row items-center gap-4 rounded bg-white p-1.5 text-[#7288A3]">
          <button type="button" title="ALL DELETE" aria-label="Delete selected logs" disabled className="cursor-not-allowed opacity-40"><Trash2 size={16} /></button>
          <button type="button" aria-label="Log columns" className="transition-colors hover:text-[#007EA7]"><Columns3 size={16} /></button>
          <ImportButton scope="Node logs" />
          <button type="button" title="REFRESH ALL" aria-label="Refresh all logs" className="transition-colors hover:text-[#007EA7]"><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* Empty state from the supplied design */}
      <div className="flex flex-1 items-start justify-center pt-[221px]">
        <div className="flex w-[320px] flex-col items-center gap-6">
          <span className="w-full text-center font-montserrat text-[18px] font-semibold leading-6 text-[#10233A]">No logs found</span>
        </div>
      </div>
    </div>
  );
}

interface FeatureRow {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
}

const INITIAL_FEATURES: FeatureRow[] = [
  { id: 'feature-1', name: 'Selenium_direct', status: 'Active' },
  { id: 'feature-2', name: 'Selenium_direct', status: 'Active' },
];

function FeatureCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={onChange}
      className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[6px] border transition-colors ${
        checked ? 'border-[#007EA7] bg-[#007EA7]' : 'border-[#A1B6C6] bg-white hover:border-[#007EA7]'
      }`}
    >
      {checked && <Check size={11} strokeWidth={2.5} className="text-white" />}
    </button>
  );
}

function FeaturesTab() {
  const [search, setSearch] = useState('');
  const [features, setFeatures] = useState<FeatureRow[]>(INITIAL_FEATURES);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const totalPages = 10;

  const filtered = features.filter(feature =>
    !search || feature.name.toLowerCase().includes(search.toLowerCase()) || feature.status.toLowerCase().includes(search.toLowerCase())
  );
  const allVisibleSelected = filtered.length > 0 && filtered.every(feature => selected.has(feature.id));

  const toggleRow = (id: string) => {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setSelectedStatus = (status: FeatureRow['status']) => {
    if (!selected.size) return;
    setFeatures(current => current.map(feature => selected.has(feature.id) ? { ...feature, status } : feature));
  };

  const setFeatureStatus = (id: string, status: FeatureRow['status']) => {
    setFeatures(current => current.map(feature => feature.id === id ? { ...feature, status } : feature));
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-row flex-wrap items-center justify-between gap-2">
        <SearchQueryConstructor ariaLabel="Search features" value={search} onSearch={setSearch} />

        <div className="flex h-7 flex-row items-center gap-4 rounded bg-white p-1.5 text-[#7288A3]">
          <button type="button" aria-label="Activate selected features" disabled={!selected.size} onClick={() => setSelectedStatus('Active')} className="hover:text-[#007EA7] disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 size={16} /></button>
          <button type="button" title="REDO" aria-label="REDO selected features" disabled={!selected.size} onClick={() => setSelectedStatus('Active')} className="hover:text-[#007EA7] disabled:cursor-not-allowed disabled:opacity-40"><RotateCw size={16} /></button>
          <button type="button" aria-label="Feature columns" className="hover:text-[#007EA7]"><Columns3 size={16} /></button>
          <ImportButton scope="Node features" />
          <button type="button" title="REFRESH ALL" aria-label="Refresh all features" onClick={() => setFeatures(current => current.map(feature => ({ ...feature })))} className="hover:text-[#007EA7]"><RefreshCw size={16} /></button>
        </div>
      </div>

      <div className="flex min-h-[620px] flex-col justify-between gap-12">
        <div className="flex flex-col gap-4">
          {/* Column headers */}
          <div aria-label="Features table columns" className="flex h-5 flex-row items-center pl-3 font-montserrat text-[12px] font-medium leading-[18px] text-[#7288A3]">
            <div className="flex w-[264px] flex-shrink-0 items-center gap-1.5">
              <FeatureCheckbox
                checked={allVisibleSelected}
                label="Select all features"
                onChange={() => setSelected(allVisibleSelected ? new Set() : new Set(filtered.map(feature => feature.id)))}
              />
              <span>Name</span>
            </div>
            <div className="mx-3 h-5 border-l border-[#D3E1EC]" />
            <span className="w-20">Status</span>
          </div>

          {/* Rows */}
          <div className="flex flex-col">
            {filtered.map((feature, index) => (
              <div
                key={feature.id}
                className={`flex h-9 w-full flex-row items-start rounded-lg ${index % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'}`}
              >
                <div className="flex h-9 w-[286px] flex-shrink-0 flex-row items-center gap-1.5 py-[9px] pl-3 pr-2.5">
                  <FeatureCheckbox checked={selected.has(feature.id)} label={`Select ${feature.name} ${index + 1}`} onChange={() => toggleRow(feature.id)} />
                  <span className="truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{feature.name}</span>
                </div>
                <div className="h-9 w-1 flex-shrink-0 bg-gradient-to-r from-[#E4F7FF] to-transparent opacity-80" />
                <div className="flex h-9 flex-1 flex-row items-center px-2.5 py-[9px]">
                  <div className="flex w-[140px] items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${feature.status === 'Active' ? 'bg-[#0ED8A8]' : 'bg-[#E45858]'}`} />
                    <span className="font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{feature.status}</span>
                  </div>
                </div>
                <div className="h-9 w-1 flex-shrink-0 bg-gradient-to-l from-[#E4F7FF] to-transparent" />
                <div className="flex h-9 w-[68px] flex-shrink-0 flex-row items-center gap-1 p-1">
                  <StopButton stopped={feature.status === 'Inactive'} label={`STOP feature ${feature.name} ${index + 1}`} onStop={() => setFeatureStatus(feature.id, 'Inactive')} />
                  <RecordRefreshButton label={`REDO feature ${feature.name} ${index + 1}`} onRefresh={() => setFeatures(current => current.map(item => item.id === feature.id ? { ...item, status: 'Active' } : item))} />
                </div>
              </div>
            ))}
            {!filtered.length && (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-2">
                <span className="font-montserrat text-[18px] font-semibold text-[#10233A]">No features found</span>
                <span className="font-montserrat text-[12px] text-[#7288A3]">Change the search query to see results.</span>
              </div>
            )}
          </div>
        </div>

        <HorizontalTableScrollbar />

        {/* Pagination */}
        <div className="flex flex-row flex-wrap items-center justify-between gap-4">
          <TablePagination currentPage={page} totalPages={totalPages} itemCount={filtered.length} onPageChange={setPage} />
          <div className="flex flex-row items-center gap-3.5">
            <span className="font-montserrat text-[12px] font-normal leading-[18px] text-[#7288A3]">{filtered.length} from {features.length} items</span>
            <button type="button" className="flex h-8 items-center justify-center rounded-md border-2 border-[#D3E1EC] bg-white px-3 font-montserrat text-[14px] font-semibold text-[#7288A3]">Rows per page</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const INITIAL_RUNS = [
  { id: 'RUN-001', processName: 'Invoice OCR Processing', tasksCount: 24, status: 'Active', statusColor: '#0ED8A8', createdBy: 'John Brick', creationDate: '10.04.2026 12:22' },
  { id: 'RUN-002', processName: 'Selenium Desktop Run', tasksCount: 18, status: 'Active', statusColor: '#0ED8A8', createdBy: 'Jane Smith', creationDate: '10.04.2026 11:48' },
  { id: 'RUN-003', processName: 'Document Data Extract', tasksCount: 32, status: 'Completed', statusColor: '#007EA7', createdBy: 'John Brick', creationDate: '09.04.2026 17:05' },
  { id: 'RUN-004', processName: 'Report Generation', tasksCount: 12, status: 'Failed', statusColor: '#E45858', createdBy: 'Jane Smith', creationDate: '09.04.2026 14:31' },
];

function RunsTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(INITIAL_RUNS);
  const totalPages = 10;
  const filtered = rows.filter(r =>
    !search || [r.id, r.processName, String(r.tasksCount), r.status, r.createdBy, r.creationDate]
      .some(value => value.toLowerCase().includes(search.toLowerCase()))
  );

  function deleteRow(id: string) {
    setRows(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="flex flex-col w-full" style={{ gap: '24px' }}>
      {/* Toolbar */}
      <div className="flex flex-row justify-between items-center">
        <SearchQueryConstructor ariaLabel="Search runs" value={search} onSearch={setSearch} />
        <div className="flex flex-row items-center" style={{ background: '#FFFFFF', borderRadius: '4px', padding: '6px', gap: '16px' }}>
          <button className="text-[#7288A3] opacity-50"><Trash2 size={16} /></button>
          <button className="text-[#7288A3]"><Columns3 size={16} /></button>
          <button className="text-[#7288A3]"><Download size={16} /></button>
          <button type="button" title="REFRESH ALL" aria-label="Refresh all runs" onClick={() => setRows(current => current.map(run => ({ ...run })))} className="text-[#7288A3]"><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* Column headers */}
      <div
        aria-label="Runs table columns"
        className="flex h-5 w-full flex-row items-center font-montserrat text-[12px] font-medium leading-[18px] text-[#7288A3]"
      >
        <div className="flex w-[106px] flex-shrink-0 items-center gap-1.5 pl-3">
          <div className="h-[18px] w-[18px] rounded-[6px] border border-[#A1B6C6] bg-white" />
          <span>Run ID</span>
        </div>
        <div className="flex h-5 w-1 flex-shrink-0 justify-center"><span className="border-l border-[#D3E1EC]" /></div>
        <div className="flex flex-1 items-center gap-6 px-2.5">
          <span className="w-[180px] flex-shrink-0">Process name</span>
          <span className="w-[100px] flex-shrink-0">Tasks count</span>
          <span className="w-[120px] flex-shrink-0">Status</span>
          <span className="w-[140px] flex-shrink-0">Created by</span>
          <span className="w-[160px] flex-shrink-0">Creation date</span>
        </div>
        <div className="flex h-5 w-1 flex-shrink-0 justify-center"><span className="border-l border-[#D3E1EC]" /></div>
        <div className="w-[100px] flex-shrink-0" aria-hidden="true" />
      </div>

      {/* Rows or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1" style={{ gap: '24px', minHeight: '400px' }}>
          <span className="font-montserrat font-semibold text-center" style={{ fontSize: '18px', lineHeight: '24px', color: '#10233A' }}>
            No runs yet
          </span>
        </div>
      ) : (
        <div className="flex flex-col w-full">
          {filtered.map((row, idx) => {
            const isHighlighted = idx % 2 === 0;
            return (
              <div
                key={row.id}
                className="flex flex-row items-start w-full"
                style={{ height: '36px', background: isHighlighted ? '#F8FDFF' : '#FFFFFF', borderRadius: '8px' }}
              >
                {/* ID cell */}
                <div className="flex flex-row items-center" style={{ width: '106px', height: '36px', padding: '9px 10px 9px 12px', gap: '6px' }}>
                  <div className="flex-shrink-0" style={{ width: '18px', height: '18px', border: '1px solid #A1B6C6', borderRadius: '6px' }} />
                  <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{row.id}</span>
                </div>

                {/* Left gradient */}
                <div style={{ width: '4px', height: '36px', background: 'linear-gradient(90deg, #E4F7FF 0%, rgba(228,247,255,0) 100%)', opacity: 0.8 }} />

                {/* Data cells */}
                <div className="flex flex-row items-center flex-1" style={{ height: '36px', padding: '9px 10px', gap: '24px' }}>
                  {/* Process name */}
                  <span className="truncate font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]" style={{ width: '180px' }}>{row.processName}</span>
                  {/* Tasks count */}
                  <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]" style={{ width: '100px' }}>{row.tasksCount}</span>
                  {/* Status */}
                  <div className="flex flex-row items-center" style={{ width: '120px', gap: '4px' }}>
                    <div className="rounded-full flex-shrink-0" style={{ width: '6px', height: '6px', background: row.statusColor }} />
                    <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{row.status}</span>
                  </div>
                  {/* Created by */}
                  <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]" style={{ width: '140px' }}>{row.createdBy}</span>
                  {/* Creation date */}
                  <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]" style={{ width: '160px' }}>{row.creationDate}</span>
                </div>

                {/* Right gradient */}
                <div style={{ width: '4px', height: '36px', background: 'linear-gradient(90deg, #E4F7FF 0%, rgba(228,247,255,0) 100%)', transform: 'matrix(-1,0,0,1,0,0)' }} />

                {/* Actions */}
                <div className="flex flex-row items-center" style={{ width: '100px', height: '36px', padding: '4px', gap: '4px' }}>
                  <StopButton stopped={row.status === 'Stopped'} label={`STOP run ${row.id}`} onStop={() => setRows(current => current.map(item => item.id === row.id ? { ...item, status: 'Stopped', statusColor: '#E45858' } : item))} />
                  <RecordRefreshButton label={`REDO run ${row.id}`} onRefresh={() => setRows(current => current.map(item => item.id === row.id ? { ...item, status: 'Started', statusColor: '#007EA7' } : item))} />
                  <button className="flex items-center justify-center bg-white rounded hover:border-[#007EA7] transition-colors" style={{ width: '28px', height: '28px', border: '2px solid #D3E1EC' }} onClick={() => deleteRow(row.id)}>
                    <Trash2 size={16} className="text-[#7288A3]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HorizontalTableScrollbar />

      {/* Pagination */}
      <div className="flex flex-row justify-between items-center">
        <TablePagination currentPage={page} totalPages={totalPages} itemCount={filtered.length} onPageChange={setPage} />
        <div className="flex flex-row items-center" style={{ gap: '14px' }}>
          <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3]">14 from 15,000 items</span>
          <button className="flex items-center justify-center bg-white rounded-[6px]" style={{ width: '107px', height: '32px', padding: '6px 12px', border: '2px solid #D3E1EC' }}>
            <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">Rows per page</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const INITIAL_PARAMS = [
  { id: '9275', name: 'AP_RUN SELENIUM DESKTOP' },
  { id: '9276', name: 'Some name' },
  { id: '9277', name: 'AP_RUN SELENIUM DESKTOP' },
  { id: '9278', name: 'Some name' },
];

function ConfigurationParametersTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(INITIAL_PARAMS);
  const [stoppedRows, setStoppedRows] = useState<Set<string>>(new Set());
  const totalPages = 10;
  const params = rows.filter(p =>
    !search || p.id.includes(search) || p.name.toLowerCase().includes(search.toLowerCase())
  );

  function deleteRow(id: string) {
    setRows(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="flex flex-col w-full" style={{ gap: '24px' }}>
      {/* Toolbar */}
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row items-center" style={{ gap: '4px' }}>
          {/* Search */}
          <SearchQueryConstructor ariaLabel="Search configuration parameters" value={search} onSearch={setSearch} />
        </div>

        {/* Icon buttons */}
        <div className="flex flex-row items-center" style={{ background: '#FFFFFF', borderRadius: '4px', padding: '6px', gap: '16px' }}>
          <button className="text-[#7288A3] hover:text-[#007EA7] transition-colors opacity-50"><Trash2 size={16} /></button>
          <button className="text-[#7288A3] hover:text-[#007EA7] transition-colors"><Columns3 size={16} /></button>
          <button className="text-[#7288A3] hover:text-[#007EA7] transition-colors"><Download size={16} /></button>
          <button className="text-[#7288A3] hover:text-[#007EA7] transition-colors"><Download size={16} /></button>
          <button type="button" title="REFRESH ALL" aria-label="Refresh all configuration parameters" onClick={() => setRows(current => current.map(row => ({ ...row })))} className="text-[#7288A3] hover:text-[#007EA7] transition-colors"><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* Table rows or empty state */}
      {params.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1" style={{ gap: '24px', minHeight: '400px' }}>
          <div className="flex flex-col items-center" style={{ gap: '16px', width: '320px' }}>
            <div className="flex flex-col items-center" style={{ gap: '16px', width: '320px' }}>
              <span
                className="font-montserrat font-semibold text-center w-full"
                style={{ fontSize: '18px', lineHeight: '24px', color: '#10233A' }}
              >
                Empty collection
              </span>
              <span
                className="font-montserrat font-medium text-center w-full"
                style={{ fontSize: '14px', lineHeight: '20px', color: '#10233A' }}
              >
                Press "Create new" button to start your work
              </span>
            </div>
            <button
              className="flex items-center justify-center"
              style={{ width: '126px', height: '42px', background: '#007EA7', borderRadius: '8px', padding: '9px 16px' }}
            >
              <span className="font-montserrat font-semibold text-center" style={{ fontSize: '16px', lineHeight: '24px', color: '#FFFFFF' }}>
                Create new
              </span>
            </button>
          </div>
        </div>
      ) : (
      <div className="flex flex-col w-full" style={{ gap: '0px' }}>
        {params.map((row, idx) => {
          const isHighlighted = idx % 2 === 0;
          return (
            <div
              key={row.id}
              className="flex flex-row items-start w-full"
              style={{
                height: '36px',
                background: isHighlighted ? '#F8FDFF' : '#FFFFFF',
                borderRadius: '8px',
              }}
            >
              {/* ID cell */}
              <div className="flex flex-row items-center" style={{ width: '206px', height: '36px', padding: '9px 10px 9px 12px', gap: '6px' }}>
                <div
                  className="flex-shrink-0"
                  style={{ width: '18px', height: '18px', border: '1px solid #A1B6C6', borderRadius: '6px' }}
                />
                <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{row.id}</span>
              </div>

              {/* Gradient divider */}
              <div style={{ width: '4px', height: '36px', background: 'linear-gradient(90deg, #E4F7FF 0%, rgba(228,247,255,0) 100%)', opacity: 0.8 }} />

              {/* Name + actions cell */}
              <div className="flex flex-row items-center justify-between flex-1" style={{ height: '36px', padding: '9px 10px', gap: '24px' }}>
                <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A]">{row.name}</span>
              </div>

              {/* Right gradient */}
              <div style={{ width: '4px', height: '36px', background: 'linear-gradient(90deg, #E4F7FF 0%, rgba(228,247,255,0) 100%)', transform: 'matrix(-1,0,0,1,0,0)' }} />

              {/* Row action buttons */}
              <div className="flex flex-row items-center" style={{ width: '100px', height: '36px', padding: '4px', gap: '4px' }}>
                <StopButton stopped={stoppedRows.has(row.id)} label={`STOP configuration parameter ${row.id}`} onStop={() => setStoppedRows(current => new Set(current).add(row.id))} />
                <RecordRefreshButton label={`REDO configuration parameter ${row.id}`} onRefresh={() => { setRows(current => current.map(item => item.id === row.id ? { ...item } : item)); setStoppedRows(current => { const next = new Set(current); next.delete(row.id); return next; }); }} />
                <button
                  className="flex items-center justify-center bg-white rounded hover:border-[#007EA7] transition-colors"
                  style={{ width: '28px', height: '28px', border: '2px solid #D3E1EC' }}
                  onClick={() => deleteRow(row.id)}
                >
                  <Trash2 size={16} className="text-[#7288A3]" onClick={() => deleteRow(row.id)} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <HorizontalTableScrollbar />

      {/* Pagination */}
      <div className="flex flex-row justify-between items-center">
        {/* Page numbers */}
        <TablePagination currentPage={page} totalPages={totalPages} itemCount={params.length} onPageChange={setPage} />

        {/* Items count + rows per page */}
        <div className="flex flex-row items-center" style={{ gap: '14px' }}>
          <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3]">14 from 15,000 items</span>
          <button
            className="flex items-center justify-center bg-white rounded-[6px]"
            style={{ width: '107px', height: '32px', padding: '6px 12px', border: '2px solid #D3E1EC' }}
          >
            <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">Rows per page</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function GeneralTab({ memberName }: { memberName: string }) {
  const [status, setStatus] = useState(memberName);
  const [description, setDescription] = useState('');
  const [workingDir, setWorkingDir] = useState('AP_RUN SELENIUM DESKTOP');
  const [capabilities, setCapabilities] = useState(['RpaPlatform', 'RpaPlatform', '#digit', '#digit']);
  const [capInput, setCapInput] = useState('');
  const [dedicated, setDedicated] = useState(true);

  const removeChip = (idx: number) => {
    setCapabilities(prev => prev.filter((_, i) => i !== idx));
  };

  const addChip = () => {
    if (capInput.trim()) {
      setCapabilities(prev => [...prev, capInput.trim()]);
      setCapInput('');
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{
        width: '380px',
        padding: '24px',
        gap: '32px',
        border: '1px solid #D3E1EC',
        borderRadius: '8px',
        background: '#FFFFFF',
      }}
    >
      <div className="flex flex-col" style={{ gap: '24px' }}>
        {/* Section title */}
        <span className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">General</span>

        {/* Status input */}
        <div className="flex flex-col" style={{ gap: '8px' }}>
          <label className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Name*</label>
          <input
            type="text"
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] focus:outline-none focus:border-[#007EA7] transition-colors"
          />
        </div>

        {/* Description input */}
        <div className="flex flex-col" style={{ gap: '8px' }}>
          <label className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-transparent focus:outline-none focus:border-[#007EA7] transition-colors"
          />
        </div>

        {/* Working directory input */}
        <div className="flex flex-col" style={{ gap: '8px' }}>
          <label className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Working directory</label>
          <input
            type="text"
            value={workingDir}
            onChange={e => setWorkingDir(e.target.value)}
            className="h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] focus:outline-none focus:border-[#007EA7] transition-colors"
          />
        </div>

        {/* Capabilities chips */}
        <div className="flex flex-col" style={{ gap: '8px' }}>
          <label className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Capabilities</label>
          <div
            className="flex flex-row items-start justify-between bg-white border border-[#D3E1EC] rounded-lg"
            style={{ padding: '9px', minHeight: '70px' }}
          >
            <div className="flex flex-row flex-wrap items-center" style={{ gap: '4px', flex: 1 }}>
              {capabilities.map((cap, idx) => (
                <div
                  key={idx}
                  className="flex flex-row items-center bg-white border border-[#E5EDF9] rounded"
                  style={{ padding: '4px 4px 4px 8px', gap: '2px', height: '24px' }}
                >
                  <span className="font-montserrat font-medium text-[10px] leading-4 text-[#10233A]">{cap}</span>
                  <button
                    onClick={() => removeChip(idx)}
                    className="text-[#7288A3] hover:text-[#10233A] transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <input
                type="text"
                value={capInput}
                onChange={e => setCapInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChip(); } }}
                placeholder=""
                className="bg-transparent font-montserrat font-medium text-[10px] leading-4 text-[#10233A] focus:outline-none"
                style={{ width: '40px', minWidth: '40px' }}
              />
            </div>
          </div>
        </div>

        {/* Dedicated toggle */}
        <div className="flex flex-row items-center" style={{ gap: '8px' }}>
          <button
            onClick={() => setDedicated(d => !d)}
            className="relative rounded-full transition-colors flex-shrink-0"
            style={{ width: '30px', height: '18px', background: dedicated ? '#007EA7' : '#D3E1EC' }}
          >
            <div
              className="absolute rounded-full bg-white shadow transition-transform"
              style={{
                width: '14px', height: '14px',
                top: '2px',
                transform: dedicated ? 'translateX(14px)' : 'translateX(2px)',
              }}
            />
          </button>
          <span className="font-montserrat font-medium text-[14px] leading-5 text-[#7288A3]">Dedicated</span>
        </div>
      </div>

      {/* Save button */}
      <button data-system-action="true"
        className="flex items-center justify-center bg-[#007EA7] rounded-lg hover:bg-[#006b8f] transition-colors"
        style={{ width: '93px', height: '42px', padding: '9px 16px' }}
      >
        <span className="font-montserrat font-semibold text-[16px] leading-6 text-white">Update</span>
      </button>
    </div>
  );
}
