import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Download, RefreshCw, Trash2, X, ChevronDown, Calendar, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import ColumnSettingsPanel, { type ColConfig } from './ColumnSettingsPanel';
import { PageActionButton, PageHeader } from './PageHeader';
import { useColumnResize, ResizeHandle } from './useColumnResize';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import OcrSearchField from './OcrSearchField';
import { matchesTextSearch } from '../utils/textSearch';
import { ColumnSettingsButton, SaveButton } from './ScopedActionButtons';
import { BulkDeleteButton } from './DeleteButtons';
import StopButton from './StopButton';
import RecordRefreshButton from './RecordRefreshButton';
import ImportButton from './ImportButton';
import StopAllButton from './StopAllButton';
import ColumnSortButton, { useMultiColumnSort } from './ColumnSortButton';

const INITIAL_COLUMNS: ColConfig[] = [
  { key: 'name', label: 'Name', width: 280, visible: true },
  { key: 'entityName', label: 'Entity name', width: 260, visible: true },
  { key: 'type', label: 'Type', width: 130, visible: true },
  { key: 'status', label: 'Status', width: 130, visible: true },
  { key: 'createdBy', label: 'Created by', width: 160, visible: true },
  { key: 'createdDate', label: 'Created date', width: 150, visible: true },
  { key: 'updatedBy', label: 'Updated by', width: 160, visible: false },
  { key: 'lastUpdate', label: 'Last update', width: 150, visible: false },
];

interface CronRow {
  field: string;
  allowed: string;
  special: string;
}

const CRON_TABLE: CronRow[] = [
  { field: 'Minute', allowed: '0-59', special: '*,-/' },
  { field: 'Hour', allowed: '0-23', special: '*,-/' },
  { field: 'Day of month', allowed: '1-31', special: '*,-/' },
  { field: 'Month', allowed: '1-12', special: '*,-/' },
  { field: 'Day of week', allowed: '0-6', special: '*,-/' },
];

const CRON_SYMBOLS = [
  { symbol: '*', desc: 'Used to select all values within a field.' },
  { symbol: ',', desc: 'Used to separate items of a list. For example, using "1,3,5" in the 5th field (day of week) means Monday, Wednesday and Friday.' },
  { symbol: '-', desc: 'Used to specify ranges. For example, using 1\u20135 in the 5th field (day of week) indicates Monday through Friday.' },
  { symbol: '/', desc: 'Can be combined with ranges to specify step values. For example, */5 in the 1st field (minutes) indicates every 5 minutes.' },
];

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

interface ScheduleRow {
  id: number;
  name: string;
  entityName: string;
  type: string;
  status: string;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  lastUpdate: string;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function ScheduleDatePicker({ value, onChange, placeholder, ariaLabel, align = 'left' }: { value: string; onChange: (value: string) => void; placeholder: string; ariaLabel: string; align?: 'left' | 'right' }) {
  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate && !Number.isNaN(selectedDate.getTime()) ? selectedDate : new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const years = Array.from({ length: 21 }, (_, index) => new Date().getFullYear() - 10 + index);
  const toIsoDate = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (selectedDate && !Number.isNaN(selectedDate.getTime())) setViewDate(selectedDate);
          setOpen(current => !current);
        }}
        className={`flex h-[42px] w-full items-center justify-between rounded-lg border bg-white px-[14px] font-montserrat text-[14px] font-medium transition-colors ${open ? 'border-[#007EA7] ring-[3px] ring-[#007EA7]/20' : 'border-[#D3E1EC]'}`}
      >
        <span className={value ? 'text-[#10233A]' : 'text-[#A1B6C6]'}>{value || placeholder}</span>
        <Calendar size={16} className="flex-shrink-0 text-[#7288A3]" />
      </button>

      {open && (
        <div role="dialog" aria-label={`${ariaLabel} calendar`} className={`absolute top-[48px] z-40 w-[292px] rounded-xl border border-[#D3E1EC] bg-white p-4 shadow-[0_8px_24px_rgba(16,35,58,0.16)] ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="mb-4 flex items-center gap-2">
            <button type="button" aria-label="Previous month" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D3E1EC] text-[#7288A3] hover:border-[#007EA7] hover:text-[#007EA7]"><ChevronLeft size={16} /></button>
            <select aria-label="Calendar month" value={month} onChange={event => setViewDate(new Date(year, Number(event.target.value), 1))} className="h-8 min-w-0 flex-1 rounded-md border border-[#D3E1EC] bg-white px-2 font-montserrat text-[12px] font-medium text-[#10233A] outline-none focus:border-[#007EA7]">
              {MONTH_NAMES.map((name, index) => <option key={name} value={index}>{name}</option>)}
            </select>
            <select aria-label="Calendar year" value={year} onChange={event => setViewDate(new Date(Number(event.target.value), month, 1))} className="h-8 w-[76px] rounded-md border border-[#D3E1EC] bg-white px-2 font-montserrat text-[12px] font-medium text-[#10233A] outline-none focus:border-[#007EA7]">
              {years.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
            <button type="button" aria-label="Next month" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D3E1EC] text-[#7288A3] hover:border-[#007EA7] hover:text-[#007EA7]"><ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEK_DAYS.map(day => <span key={day} className="flex h-7 items-center justify-center font-montserrat text-[11px] font-semibold text-[#7288A3]">{day}</span>)}
            {Array.from({ length: firstWeekDay }, (_, index) => <span key={`blank-${index}`} className="h-8" />)}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => {
              const isoDate = toIsoDate(day);
              const selected = isoDate === value;
              const today = isoDate === new Date().toISOString().slice(0, 10);
              return (
                <button
                  key={day}
                  type="button"
                  aria-label={`Select ${isoDate}`}
                  onClick={() => { onChange(isoDate); setOpen(false); }}
                  className={`flex h-8 w-8 items-center justify-center rounded-md font-montserrat text-[12px] font-medium transition-colors ${selected ? 'bg-[#007EA7] text-white' : today ? 'border border-[#007EA7] text-[#007EA7]' : 'text-[#10233A] hover:bg-[#E5EDF9]'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {value && <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="mt-3 font-montserrat text-[12px] font-semibold text-[#7288A3] hover:text-[#007EA7]">Clear date</button>}
        </div>
      )}
    </div>
  );
}

export default function SchedulesView() {
  // Schedule creation state is kept with the Schedules screen so Save can append a row immediately.
  const [showNewPanel, setShowNewPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [query, setQuery] = useState('');
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<number[]>([]);
  const filteredSchedules = useMemo(() => schedules.filter(schedule => matchesTextSearch(schedule, query)), [schedules, query]);
  const totalItems = filteredSchedules.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const [showCronHelp, setShowCronHelp] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columns, setColumns] = useState<ColConfig[]>(INITIAL_COLUMNS);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [automationProcess, setAutomationProcess] = useState('');
  const [automationProcessOpen, setAutomationProcessOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cronExpression, setCronExpression] = useState('');

  const { startResize } = useColumnResize(columns, setColumns);
  const { sortedRows: sortedSchedules, changeSort, directionFor } = useMultiColumnSort(filteredSchedules, (schedule, key) => schedule[key as keyof ScheduleRow]);

  const visibleColumns = columns.filter(c => c.visible);
  const displayedSchedules = sortedSchedules.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const selectedSchedules = schedules.filter(schedule => selectedScheduleIds.includes(schedule.id));
  const displayedScheduleIds = displayedSchedules.map(schedule => schedule.id);
  const allDisplayedSelected = displayedScheduleIds.length > 0 && displayedScheduleIds.every(id => selectedScheduleIds.includes(id));
  const canSave = name.trim() !== '' && automationProcess !== '' && cronExpression.trim() !== '';

  const openNewSchedule = () => {
    setName('');
    setDescription('');
    setAutomationProcess('');
    setAutomationProcessOpen(false);
    setStartDate('');
    setEndDate('');
    setCronExpression('');
    setShowNewPanel(true);
  };

  const saveSchedule = () => {
    if (!canSave) return;

    const now = new Date();
    const date = now.toLocaleDateString('lt-LT');
    const time = now.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' });
    const createdDate = `${date} ${time}`;

    setSchedules(current => [
      ...current,
      {
        id: Date.now(),
        name: name.trim(),
        entityName: automationProcess === 'idp' ? 'IDP' : automationProcess,
        type: `CRON: ${cronExpression.trim()}`,
        status: 'Active',
        createdBy: 'John Brick',
        createdDate,
        updatedBy: '—',
        lastUpdate: '—',
      },
    ]);
    setCurrentPage(1);
    setSelectedScheduleIds([]);
    setAutomationProcessOpen(false);
    setShowNewPanel(false);
  };

  return (
    <div className="flex flex-col bg-white px-9 py-14 gap-8 min-h-full relative" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>

      {/* Header */}
      <PageHeader title="Schedules" actions={totalItems > 0 ? <PageActionButton onClick={openNewSchedule}>Create new</PageActionButton> : undefined} />

      {/* Content */}
      <div className="flex flex-col gap-6 flex-1">

        {/* Filter bar */}
        <div className="flex-shrink-0">
          <div className="flex flex-row flex-wrap justify-between items-center gap-2">
            <div className="flex flex-row items-center gap-1 flex-1 min-w-0">
              <OcrSearchField ariaLabel="Search schedules" value={query} onChange={value => { setQuery(value); setCurrentPage(1); }} />
            </div>

            <div className="flex flex-row items-center p-[6px] gap-4 bg-white rounded flex-shrink-0">
              <BulkDeleteButton
                selectedCount={selectedScheduleIds.length}
                onDelete={() => {
                  setSchedules(current => current.filter(schedule => !selectedScheduleIds.includes(schedule.id)));
                  setSelectedScheduleIds([]);
                }}
              />
              <ColumnSettingsButton onClick={() => setShowColumnSettings(true)} />
              <ImportButton scope="Schedules" />
              <StopAllButton
                label="STOP"
                disabled={!selectedSchedules.some(schedule => schedule.status !== 'Stopped')}
                onStop={() => setSchedules(current => current.map(schedule => selectedScheduleIds.includes(schedule.id)
                  ? { ...schedule, status: 'Stopped', lastUpdate: new Date().toLocaleString('lt-LT') }
                  : schedule))}
              />
              <button
                type="button"
                title="ENABLE"
                aria-label="ENABLE selected schedules"
                disabled={!selectedSchedules.some(schedule => schedule.status === 'Stopped')}
                onClick={() => setSchedules(current => current.map(schedule => selectedScheduleIds.includes(schedule.id)
                  ? { ...schedule, status: 'Active', lastUpdate: new Date().toLocaleString('lt-LT') }
                  : schedule))}
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-[#7288A3] transition-colors enabled:hover:text-[#007EA7] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 size={16} />
              </button>
              <button onClick={() => setSchedules(current => current.map(schedule => ({ ...schedule })))} className="w-4 h-4 flex items-center justify-center text-[#7288A3] hover:text-[#007EA7] transition-colors" title="REFRESH ALL">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
        <div style={{ minWidth: displayedSchedules.length > 0 ? `${visibleColumns.reduce((sum, column) => sum + column.width, 0) + 116}px` : '100%' }}>
        {/* Column headers */}
        <div className="system-table-header-row mb-4 flex h-9 flex-row items-start gap-0 pl-3">
          <div className="system-table-select-cell flex w-5 flex-shrink-0 items-center">
            <button
              type="button"
              role="checkbox"
              aria-label="Select all schedules on this page"
              aria-checked={allDisplayedSelected}
              onClick={() => setSelectedScheduleIds(current => allDisplayedSelected
                ? current.filter(id => !displayedScheduleIds.includes(id))
                : Array.from(new Set([...current, ...displayedScheduleIds])))}
              className={`flex h-[18px] w-[18px] items-center justify-center self-start rounded-[6px] border transition-colors ${allDisplayedSelected ? 'border-[#007EA7] bg-[#007EA7] text-white' : 'border-[#A1B6C6] bg-white'}`}
            >
              {allDisplayedSelected && <span className="text-[12px] font-bold leading-none">✓</span>}
            </button>
          </div>
          {visibleColumns.map((col, idx) => {
            const colRealIdx = columns.findIndex(c => c.key === col.key);
            return (
              <div key={col.key} className="relative flex h-9 flex-shrink-0 flex-row items-start gap-[6px] px-2" style={{ width: col.width }}>
                <span className={`truncate font-montserrat text-[12px] font-medium leading-[18px] ${idx === 0 ? 'text-[#10233A]' : 'text-[#7288A3]'}`}>{col.label}</span>
                <ColumnSortButton columnLabel={col.label} direction={directionFor(col.key)} onDirectionChange={direction => { changeSort(col.key, direction); setCurrentPage(1); }} />
                <ResizeHandle onMouseDown={(e) => startResize(colRealIdx, e)} />
              </div>
            );
          })}
          <div className="w-[64px] flex-shrink-0" />
        </div>

        {displayedSchedules.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-4 max-w-[320px]">
              <h2 className="font-montserrat font-semibold text-[18px] leading-6 text-[#10233A] text-center w-full">
                Empty collection
              </h2>
              <p className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A] text-center w-full">
                Press "Create new" button to start your work
              </p>
            </div>
            <PageActionButton onClick={openNewSchedule}>Create new</PageActionButton>
          </div>
        ) : (
          <div className="flex flex-col">
            {displayedSchedules.map((schedule, rowIndex) => (
              <div
                key={schedule.id}
                className={`group flex h-9 w-full flex-row items-center rounded-lg transition-colors ${rowIndex % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'} hover:bg-[#E7F4F9]`}
              >
                <div className="system-table-select-cell flex h-9 w-8 flex-shrink-0 items-center pl-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-label={`Select schedule ${schedule.name}`}
                    aria-checked={selectedScheduleIds.includes(schedule.id)}
                    onClick={() => setSelectedScheduleIds(current => current.includes(schedule.id)
                      ? current.filter(id => id !== schedule.id)
                      : [...current, schedule.id])}
                    className={`flex h-[18px] w-[18px] items-center justify-center self-center rounded-[6px] border transition-colors ${selectedScheduleIds.includes(schedule.id) ? 'border-[#007EA7] bg-[#007EA7] text-white' : 'border-[#A1B6C6] bg-white'}`}
                  >
                    {selectedScheduleIds.includes(schedule.id) && <span className="text-[12px] font-bold leading-none">✓</span>}
                  </button>
                </div>
                {visibleColumns.map((col) => (
                  <div key={col.key} className="flex h-9 flex-shrink-0 items-center overflow-hidden px-[10px] py-[9px]" style={{ width: col.width }}>
                    <div
                      className="w-full truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]"
                      title={String(schedule[col.key as keyof ScheduleRow])}
                    >
                      {col.key === 'status' ? (
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${schedule.status === 'Stopped' ? 'bg-[#E45858]' : 'bg-[#0ED8A8]'}`} />
                          {schedule.status}
                        </span>
                      ) : String(schedule[col.key as keyof ScheduleRow])}
                    </div>
                  </div>
                ))}
                <div className="ml-auto flex h-9 w-[64px] flex-shrink-0 items-center justify-end gap-1 p-1">
                  <div className="flex items-center gap-1">
                    <StopButton
                      stopped={schedule.status === 'Stopped'}
                      label={`STOP schedule ${schedule.name}`}
                      onStop={() => setSchedules(current => current.map(item => item.id === schedule.id ? { ...item, status: 'Stopped', lastUpdate: new Date().toLocaleString('lt-LT') } : item))}
                    />
                    <RecordRefreshButton
                      label={`REDO schedule ${schedule.name}`}
                      onRefresh={() => setSchedules(current => current.map(item => item.id === schedule.id ? { ...item, status: 'Active', lastUpdate: new Date().toLocaleString('lt-LT') } : item))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
        </div>
        <HorizontalTableScrollbar />

        {/* Pagination bar */}
        <div className="flex flex-row justify-between items-center h-8 flex-shrink-0">

          {/* Page numbers */}
          <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />

          {/* Items count + per page */}
          <div className="flex flex-row items-center gap-[14px]">
            <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap">
              {totalItems === 0 ? '0–0' : `${((currentPage - 1) * itemsPerPage + 1).toLocaleString()}–${Math.min(currentPage * itemsPerPage, totalItems).toLocaleString()}`} from {totalItems.toLocaleString()} items
            </span>
            <div className="relative">
              <button
                onClick={() => setShowItemsDropdown(v => !v)}
                className="flex flex-row items-center justify-center px-3 py-[6px] gap-1 bg-white border-2 border-[#D3E1EC] rounded-md h-8 min-w-[107px]"
              >
                <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">{itemsPerPage} per page</span>
                <ChevronDown size={12} className="text-[#7288A3]" />
              </button>
              {showItemsDropdown && (
                <div className="absolute bottom-full mb-1 right-0 bg-white border border-[#D3E1EC] rounded-md shadow-sm z-10">
                  {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setItemsPerPage(opt); setCurrentPage(1); setShowItemsDropdown(false); }}
                      className={`w-full px-4 py-2 text-left font-montserrat font-medium text-[13px] hover:bg-[#E5EDF9] transition-colors ${
                        opt === itemsPerPage ? 'text-[#1B55E9]' : 'text-[#7288A3]'
                      }`}
                    >
                      {opt} per page
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Schedule Panel */}
      {showNewPanel && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowNewPanel(false)}>
          <div
            className="relative h-full w-[340px] bg-white flex flex-col gap-6 px-6 pt-6 pb-8 overflow-y-auto"
            style={{ boxShadow: '-2px 0px 0px #E5EDF9' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-row justify-between items-center flex-shrink-0">
              <span className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">New Schedule</span>
              <button onClick={() => setShowNewPanel(false)} className="text-[#7288A3] hover:text-[#10233A] transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-6 flex-1">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Name <span className="text-red-500">*</span></span>
                <input
                  aria-label="Schedule name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Description</span>
                <textarea
                  aria-label="Schedule description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full h-[80px] px-[14px] py-[11px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors resize-y"
                />
              </div>

              {/* Automation process */}
              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Automation process <span className="text-red-500">*</span></span>
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Automation process"
                    aria-haspopup="listbox"
                    aria-expanded={automationProcessOpen}
                    onClick={() => setAutomationProcessOpen(open => !open)}
                    className={`flex h-[42px] w-full items-center justify-between rounded-lg border bg-white px-[14px] text-left font-montserrat text-[14px] font-medium leading-[140%] transition-colors ${automationProcessOpen ? 'border-[#007EA7] ring-[3px] ring-[#007EA7]/20' : 'border-[#D3E1EC]'}`}
                  >
                    <span className={automationProcess ? 'text-[#10233A]' : 'text-[#A1B6C6]'}>{automationProcess === 'idp' ? 'IDP' : 'Select process'}</span>
                    <ChevronDown size={16} className={`text-[#7288A3] transition-transform ${automationProcessOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {automationProcessOpen && (
                    <div role="listbox" aria-label="Automation processes" className="absolute left-0 right-0 top-[46px] z-30 rounded-lg border border-[#D3E1EC] bg-white p-2 shadow-[0_8px_20px_rgba(161,182,198,0.35)]">
                      <button
                        type="button"
                        role="option"
                        aria-selected={automationProcess === 'idp'}
                        onClick={() => {
                          setAutomationProcess('idp');
                          setAutomationProcessOpen(false);
                        }}
                        className="flex h-9 w-full items-center gap-2 rounded px-2 text-left hover:bg-[#F8FDFE]"
                      >
                        <span className={`flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-[6px] border ${automationProcess === 'idp' ? 'border-[#007EA7] bg-[#007EA7]' : 'border-[#A1B6C6] bg-white'}`}>
                          {automationProcess === 'idp' && <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </span>
                        <span className="font-montserrat text-[14px] font-medium leading-5 text-[#7288A3]">IDP</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule period */}
              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Schedule period</span>
                <div className="flex flex-row gap-4">
                  <ScheduleDatePicker value={startDate} onChange={setStartDate} placeholder="Start date" ariaLabel="Schedule start date" />
                  <ScheduleDatePicker value={endDate} onChange={setEndDate} placeholder="End date" ariaLabel="Schedule end date" align="right" />
                </div>
              </div>

              {/* Frequency */}
              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#10233A]">Frequency</span>
                <div className="flex flex-col gap-2">
                  <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">CRON expression <span className="text-red-500">*</span></span>
                  <input
                    aria-label="CRON expression"
                    type="text"
                    value={cronExpression}
                    onChange={e => setCronExpression(e.target.value)}
                    placeholder="* * * * *"
                    className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                  />
                  <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">
                    minute hour day-of-month month day-of-week
                  </span>
                </div>
                <button
                  onClick={() => setShowCronHelp(true)}
                  className="font-montserrat font-medium text-[12px] leading-[18px] text-[#007EA7] hover:underline self-start mt-1"
                >
                  What is CRON?
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 flex-shrink-0 mt-auto">
              <SaveButton className="w-full" onClick={saveSchedule} disabled={!canSave} />
              <button onClick={() => setShowNewPanel(false)} className="w-full h-[42px] flex items-center justify-center bg-white border-2 border-[#D3E1EC] rounded-lg hover:border-[#007EA7] transition-colors">
                <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#7288A3]">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRON Help Modal */}
      {/* Column Settings Panel */}
      {showColumnSettings && (
        <ColumnSettingsPanel
          columns={columns}
          onSave={cols => setColumns(cols)}
          onClose={() => setShowColumnSettings(false)}
        />
      )}

      {showCronHelp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20" onClick={() => setShowCronHelp(false)}>
          <div
            className="bg-white rounded-2xl p-6 flex flex-col gap-6 w-[588px] max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-row justify-between items-start">
              <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#10233A]">Writing a CRON expression</span>
              <button onClick={() => setShowCronHelp(false)} className="text-[#7288A3] hover:text-[#10233A] transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-6">
              <p className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A]">
                A CRON expression is a string comprising five fields separated by white space that represents a set of times, as a schedule to execute the automation process.
              </p>

              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">
                  A CRON expression takes the following format:
                </span>
                <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">
                  {'<minute> <hour> <day of month> <month> <day of week>'}
                </span>
              </div>

              {/* Table */}
              <div className="border border-[#E5E7EB] rounded overflow-hidden">
                <div className="flex flex-row bg-[#F9FAFB] border-b border-[#E5E7EB] px-3 py-3">
                  <span className="flex-1 font-montserrat font-medium text-[12px] leading-[18px] text-black">Field</span>
                  <span className="flex-1 font-montserrat font-medium text-[12px] leading-[18px] text-black">Allowed Values</span>
                  <span className="flex-1 font-montserrat font-medium text-[12px] leading-[18px] text-black">Special Characters</span>
                </div>
                {CRON_TABLE.map((row, i) => (
                  <div key={i} className={`flex flex-row px-3 py-3 ${i < CRON_TABLE.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}>
                    <span className="flex-1 font-montserrat font-medium text-[12px] leading-[18px] text-black">{row.field}</span>
                    <span className="flex-1 font-montserrat font-medium text-[12px] leading-[18px] text-black">{row.allowed}</span>
                    <span className="flex-1 font-montserrat font-medium text-[12px] leading-[18px] text-black">{row.special}</span>
                  </div>
                ))}
              </div>

              {/* Symbols */}
              <div className="flex flex-col gap-3">
                {CRON_SYMBOLS.map((item, i) => (
                  <div key={i} className="flex flex-row items-center gap-[14px]">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#F8FAFC] rounded flex-shrink-0">
                      <span className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A] text-center">{item.symbol}</span>
                    </div>
                    <span className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A] flex-1">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
