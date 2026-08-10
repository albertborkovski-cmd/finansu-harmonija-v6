import React, { useMemo, useState } from 'react';
import { Search, Columns2, Download, RefreshCw, ChevronDown, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import ColumnSettingsPanel, { type ColConfig } from './ColumnSettingsPanel';
import { PageActionButton, PageHeader } from './PageHeader';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import OcrSearchField from './OcrSearchField';
import { useColumnResize, ResizeHandle } from './useColumnResize';
import { ColumnSettingsButton, SaveButton } from './ScopedActionButtons';
import ImportButton from './ImportButton';
import ColumnSortButton, { useMultiColumnSort } from './ColumnSortButton';
import { matchesTextSearch } from '../utils/textSearch';

type Tab = 'notifications' | 'reminders';

interface NotificationRow {
  id: string;
  name: string;
  type: string;
  message: string;
  status: 'Active' | 'Inactive';
}

interface ReminderRow {
  id: string;
  name: string;
  type: string;
  repeat: string;
  message: string;
  status: 'Active' | 'Inactive';
}

const SAMPLE_NOTIFICATIONS: NotificationRow[] = [
  { id: '1', name: 'Payment received', type: 'Transaction', message: 'Your payment of $250 has been processed successfully', status: 'Active' },
  { id: '2', name: 'New user registered', type: 'System', message: 'A new user has signed up for the platform', status: 'Active' },
  { id: '3', name: 'Invoice overdue', type: 'Billing', message: 'Invoice #1042 is overdue by 5 days', status: 'Active' },
  { id: '4', name: 'API limit warning', type: 'System', message: 'API usage has reached 85% of monthly limit', status: 'Inactive' },
  { id: '5', name: 'Document uploaded', type: 'Document', message: 'New document uploaded to project workspace', status: 'Active' },
];

const SAMPLE_REMINDERS: ReminderRow[] = [
  { id: '1', name: 'Monthly report', type: 'Scheduled', repeat: 'Monthly', message: 'Generate and send monthly financial report', status: 'Active' },
  { id: '2', name: 'License renewal', type: 'Deadline', repeat: 'Yearly', message: 'Renew software licenses before expiration', status: 'Active' },
  { id: '3', name: 'Team standup', type: 'Recurring', repeat: 'Daily', message: 'Daily team standup meeting at 9:00 AM', status: 'Active' },
  { id: '4', name: 'Backup verification', type: 'Maintenance', repeat: 'Weekly', message: 'Verify database backup integrity', status: 'Inactive' },
];

const NOTIF_INITIAL_COLUMNS: ColConfig[] = [
  { key: 'name', label: 'Name', width: 280, visible: true },
  { key: 'type', label: 'Type', width: 180, visible: true },
  { key: 'message', label: 'Message', width: 280, visible: true },
  { key: 'status', label: 'Status', width: 130, visible: true },
];
const REMIND_INITIAL_COLUMNS: ColConfig[] = [
  { key: 'name', label: 'Name', width: 200, visible: true },
  { key: 'type', label: 'Type', width: 150, visible: true },
  { key: 'repeat', label: 'Repeat', width: 130, visible: true },
  { key: 'message', label: 'Message', width: 250, visible: true },
  { key: 'status', label: 'Status', width: 130, visible: true },
];

type PanelMode = null | 'add-notification' | 'edit-notification' | 'add-reminder' | 'edit-reminder';

export default function NotificationsView() {
  const [activeTab, setActiveTab] = useState<Tab>('notifications');
  const [notificationRows, setNotificationRows] = useState(SAMPLE_NOTIFICATIONS);
  const [reminderRows, setReminderRows] = useState(SAMPLE_REMINDERS);
  const [query, setQuery] = useState('');
  const filteredNotificationRows = useMemo(() => notificationRows.filter(row => matchesTextSearch(row, query)), [notificationRows, query]);
  const filteredReminderRows = useMemo(() => reminderRows.filter(row => matchesTextSearch(row, query)), [reminderRows, query]);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const [showNotifColSettings, setShowNotifColSettings] = useState(false);
  const [showRemindColSettings, setShowRemindColSettings] = useState(false);
  const [notifColumns, setNotifColumns] = useState<ColConfig[]>(NOTIF_INITIAL_COLUMNS);
  const [remindColumns, setRemindColumns] = useState<ColConfig[]>(REMIND_INITIAL_COLUMNS);

  const { startResize: startResizeNotif } = useColumnResize(notifColumns, setNotifColumns);
  const { startResize: startResizeRemind } = useColumnResize(remindColumns, setRemindColumns);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('');
  const [formRepeat, setFormRepeat] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);

  const openAddNotification = () => {
    setFormName('');
    setFormType('');
    setFormDescription('');
    setFormActive(true);
    setPanelMode('add-notification');
    setEditId(null);
  };

  const openEditNotification = (row: NotificationRow) => {
    setFormName(row.name);
    setFormType(row.type);
    setFormDescription(row.message);
    setFormActive(row.status === 'Active');
    setPanelMode('edit-notification');
    setEditId(row.id);
  };

  const openAddReminder = () => {
    setFormName('');
    setFormType('');
    setFormRepeat('');
    setFormDescription('');
    setFormActive(true);
    setPanelMode('add-reminder');
    setEditId(null);
  };

  const openEditReminder = (row: ReminderRow) => {
    setFormName(row.name);
    setFormType(row.type);
    setFormRepeat(row.repeat);
    setFormDescription(row.message);
    setFormActive(row.status === 'Active');
    setPanelMode('edit-reminder');
    setEditId(row.id);
  };

  const closePanel = () => {
    setPanelMode(null);
    setEditId(null);
  };

  return (
    <div className="flex flex-col bg-white px-9 py-14 gap-8 min-h-full relative" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>

      {/* Header */}
      <PageHeader title="Notifications & Reminders" actions={<PageActionButton onClick={activeTab === 'notifications' ? openAddNotification : openAddReminder} icon={<Plus size={14} />}>{activeTab === 'notifications' ? 'Add notification' : 'Add reminder'}</PageActionButton>} />

      {/* Tabs */}
      <div className="flex flex-row border-b border-[#E5EDF9] flex-shrink-0">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 pb-3 font-montserrat font-medium text-[14px] leading-5 transition-colors relative ${
            activeTab === 'notifications' ? 'text-[#007EA7]' : 'text-[#7288A3] hover:text-[#10233A]'
          }`}
        >
          Notifications
          {activeTab === 'notifications' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#007EA7]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-4 pb-3 font-montserrat font-medium text-[14px] leading-5 transition-colors relative ${
            activeTab === 'reminders' ? 'text-[#007EA7]' : 'text-[#7288A3] hover:text-[#10233A]'
          }`}
        >
          Reminders
          {activeTab === 'reminders' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#007EA7]" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 flex-1">

        {/* Filter bar */}
        <div className="flex-shrink-0">
          <div className="flex flex-row flex-wrap justify-between items-center gap-2">
            <div className="flex flex-row items-center gap-1 flex-1 min-w-0">
              {/* Direction filter */}
              <div className="flex flex-row items-center px-2 py-[5px] gap-1 bg-[#E5EDF9] rounded h-7 cursor-pointer hover:bg-[#d8e6f5] transition-colors">
                <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap">Direction</span>
                <ChevronDown size={16} className="text-[#7288A3] flex-shrink-0" />
              </div>

              {/* Add filter */}
              <button className="flex flex-row items-center px-2 py-[5px] gap-1 bg-[#E5EDF9] rounded h-7 hover:bg-[#d8e6f5] transition-colors">
                <Plus size={14} className="text-[#7288A3]" />
                <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap">Add filter</span>
              </button>

              {/* Search */}
              <OcrSearchField ariaLabel="Search notifications" value={query} onChange={value => { setQuery(value); setCurrentPage(1); }} />
            </div>

            {/* Toolbar icons */}
            <div className="flex flex-row items-center p-[6px] gap-4 bg-white rounded flex-shrink-0">
              <ColumnSettingsButton onClick={() => activeTab === 'notifications' ? setShowNotifColSettings(true) : setShowRemindColSettings(true)} />
              <ImportButton scope={activeTab === 'notifications' ? 'Notifications' : 'Reminders'} />
              <button onClick={() => activeTab === 'notifications' ? setNotificationRows(current => current.map(row => ({ ...row }))) : setReminderRows(current => current.map(row => ({ ...row })))} className="w-4 h-4 flex items-center justify-center text-[#7288A3] hover:text-[#007EA7] transition-colors" title="REFRESH ALL">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Column Settings Panels */}
        {showNotifColSettings && (
          <ColumnSettingsPanel
            columns={notifColumns}
            onSave={(cols) => { setNotifColumns(cols); setShowNotifColSettings(false); }}
            onClose={() => setShowNotifColSettings(false)}
          />
        )}
        {showRemindColSettings && (
          <ColumnSettingsPanel
            columns={remindColumns}
            onSave={(cols) => { setRemindColumns(cols); setShowRemindColSettings(false); }}
            onClose={() => setShowRemindColSettings(false)}
          />
        )}

        {/* Table */}
        <div className="flex flex-col flex-1">
          <div className="overflow-x-auto scrollbar-hide">
            {activeTab === 'notifications' ? (
              <NotificationsTable rows={filteredNotificationRows} onViewDetails={openEditNotification} columns={notifColumns} startResize={startResizeNotif} />
            ) : (
              <RemindersTable rows={filteredReminderRows} onViewDetails={openEditReminder} columns={remindColumns} startResize={startResizeRemind} />
            )}
          </div>

          <HorizontalTableScrollbar />

          {/* Pagination */}
          <div className="flex flex-row items-center justify-between mt-6 pt-4 border-t border-[#E5EDF9]">
            <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">
              {activeTab === 'notifications'
                ? `Showing ${notificationRows.length} of ${notificationRows.length} results`
                : `Showing ${reminderRows.length} of ${reminderRows.length} results`}
            </span>
            <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={activeTab === 'notifications' ? notificationRows.length : reminderRows.length} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>

      {/* Side Panel */}
      {panelMode && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={closePanel}>
          <div
            className="relative h-full w-[340px] bg-white flex flex-col gap-6 px-6 pt-6 pb-8 overflow-y-auto"
            style={{ boxShadow: '-2px 0px 0px #E5EDF9' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Panel Header */}
            <div className="flex flex-row justify-between items-center flex-shrink-0">
              <span className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">
                {panelMode === 'add-notification' && 'Add notification'}
                {panelMode === 'edit-notification' && 'Edit notification'}
                {panelMode === 'add-reminder' && 'Add reminder'}
                {panelMode === 'edit-reminder' && 'Edit reminder'}
              </span>
              <button onClick={closePanel} className="text-[#7288A3] hover:text-[#10233A] transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Panel Form */}
            <div className="flex flex-col gap-6 flex-1">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">
                  {(panelMode === 'add-reminder' || panelMode === 'edit-reminder') ? 'Reminder name' : 'Name'}
                </span>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                />
              </div>

              {/* Type */}
              {(panelMode === 'add-notification' || panelMode === 'edit-notification') && (
                <div className="flex flex-col gap-2">
                  <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Notification type</span>
                  <div className="relative">
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value)}
                      className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg appearance-none font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] focus:outline-none focus:border-[#007EA7] transition-colors"
                    >
                      <option value="" disabled>Select type</option>
                      <option value="Transaction">Transaction</option>
                      <option value="System">System</option>
                      <option value="Billing">Billing</option>
                      <option value="Document">Document</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#7288A3] pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Remind before (reminders) */}
              {(panelMode === 'add-reminder' || panelMode === 'edit-reminder') && (
                <div className="flex flex-col gap-2">
                  <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Remind before</span>
                  <div className="relative">
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value)}
                      className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg appearance-none font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] focus:outline-none focus:border-[#007EA7] transition-colors"
                    >
                      <option value="" disabled>Select period</option>
                      <option value="1 day">1 day</option>
                      <option value="3 days">3 days</option>
                      <option value="1 week">1 week</option>
                      <option value="2 weeks">2 weeks</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#7288A3] pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Repeat interval (reminders) */}
              {(panelMode === 'add-reminder' || panelMode === 'edit-reminder') && (
                <div className="flex flex-col gap-2">
                  <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Repeat interval</span>
                  <div className="relative">
                    <select
                      value={formRepeat}
                      onChange={e => setFormRepeat(e.target.value)}
                      className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg appearance-none font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] focus:outline-none focus:border-[#007EA7] transition-colors"
                    >
                      <option value="" disabled>Select interval</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#7288A3] pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Description</span>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Enter description"
                  className="w-full h-[100px] px-[14px] py-[11px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors resize-y"
                />
              </div>

              {/* Active toggle */}
              <div className="flex flex-row items-center justify-between">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Active</span>
                <button
                  onClick={() => setFormActive(!formActive)}
                  className="relative w-[30px] h-[18px] rounded-full transition-colors flex-shrink-0"
                  style={{ backgroundColor: formActive ? '#007EA7' : '#A1B6C6' }}
                >
                  <div
                    className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform"
                    style={{ left: formActive ? '14px' : '2px' }}
                  />
                </button>
              </div>
            </div>

            {/* Panel Actions */}
            <div className="flex flex-col gap-4 flex-shrink-0 mt-auto">
              <SaveButton className="w-full" />
              <button onClick={closePanel} className="w-full h-[42px] flex items-center justify-center bg-white border-2 border-[#D3E1EC] rounded-lg hover:border-[#007EA7] transition-colors">
                <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#7288A3]">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsTable({ rows, onViewDetails, columns, startResize }: { rows: NotificationRow[]; onViewDetails: (row: NotificationRow) => void; columns: ColConfig[]; startResize: (index: number, e: React.MouseEvent) => void }) {
  const { sortedRows, changeSort, directionFor } = useMultiColumnSort(rows, (row, key) => row[key as keyof NotificationRow] as string | number | undefined);
  return (
    <>
      {/* Column headers */}
      <div className="flex flex-row items-center pl-3 gap-3 h-5 mb-2">
        {columns.filter(c => c.visible).map((col, i) => {
          const realIndex = columns.findIndex(c => c.key === col.key);
          return (
            <React.Fragment key={col.key}>
              <div
                className={`relative flex flex-row items-center gap-[6px] flex-shrink-0 ${col.key === 'name' ? '' : ''}`}
                style={{ width: col.width }}
              >
                <span className={`font-montserrat font-medium text-[12px] leading-[18px] ${col.key === 'name' ? 'text-[#10233A]' : 'text-[#7288A3]'}`}>
                  {col.label}
                </span>
                <ColumnSortButton columnLabel={col.label} direction={directionFor(col.key)} onDirectionChange={direction => changeSort(col.key, direction)} />
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
            className={`flex flex-row items-center pl-3 gap-3 h-9 rounded-lg ${
              rowIndex % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'
            } group hover:bg-[#E7F4F9] transition-colors`}
          >
            {columns.filter(column => column.visible).map((column, index) => (
              <React.Fragment key={column.key}>
                {index > 0 && <div className="h-9 w-px flex-shrink-0 bg-[#E4F7FF]" />}
                <div className="flex flex-shrink-0 items-center gap-[6px] overflow-hidden" style={{ width: column.width }}>
                  {column.key === 'status' && <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${row.status === 'Active' ? 'bg-[#0ED8A8]' : 'bg-[#A1B6C6]'}`} />}
                  <span className="truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{String(row[column.key as keyof NotificationRow] ?? '—')}</span>
                </div>
              </React.Fragment>
            ))}

            {/* Row action */}
            <div className="flex flex-row items-center px-1 flex-shrink-0">
              <button
                onClick={() => onViewDetails(row)}
                className="flex items-center justify-center px-2 py-[6px] border-2 border-[#D3E1EC] rounded bg-white hover:border-[#007EA7] transition-colors"
                style={{ width: 91 }}
              >
                <span className="font-montserrat font-semibold text-[12px] leading-4 text-[#7288A3] whitespace-nowrap">View details</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function RemindersTable({ rows, onViewDetails, columns, startResize }: { rows: ReminderRow[]; onViewDetails: (row: ReminderRow) => void; columns: ColConfig[]; startResize: (index: number, e: React.MouseEvent) => void }) {
  const { sortedRows, changeSort, directionFor } = useMultiColumnSort(rows, (row, key) => row[key as keyof ReminderRow] as string | number | undefined);
  return (
    <>
      {/* Column headers */}
      <div className="flex flex-row items-center pl-3 gap-3 h-5 mb-2">
        {columns.filter(c => c.visible).map((col, i) => {
          const realIndex = columns.findIndex(c => c.key === col.key);
          return (
            <React.Fragment key={col.key}>
              <div
                className={`relative flex flex-row items-center gap-[6px] flex-shrink-0`}
                style={{ width: col.width }}
              >
                <span className={`font-montserrat font-medium text-[12px] leading-[18px] ${col.key === 'name' ? 'text-[#10233A]' : 'text-[#7288A3]'}`}>
                  {col.label}
                </span>
                <ColumnSortButton columnLabel={col.label} direction={directionFor(col.key)} onDirectionChange={direction => changeSort(col.key, direction)} />
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
            className={`flex flex-row items-center pl-3 gap-3 h-9 rounded-lg ${
              rowIndex % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'
            } group hover:bg-[#E7F4F9] transition-colors`}
          >
            {columns.filter(column => column.visible).map((column, index) => (
              <React.Fragment key={column.key}>
                {index > 0 && <div className="h-9 w-px flex-shrink-0 bg-[#E4F7FF]" />}
                <div className="flex flex-shrink-0 items-center gap-[6px] overflow-hidden" style={{ width: column.width }}>
                  {column.key === 'status' && <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${row.status === 'Active' ? 'bg-[#0ED8A8]' : 'bg-[#A1B6C6]'}`} />}
                  <span className="truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{String(row[column.key as keyof ReminderRow] ?? '—')}</span>
                </div>
              </React.Fragment>
            ))}

            {/* Row action */}
            <div className="flex flex-row items-center px-1 flex-shrink-0">
              <button
                onClick={() => onViewDetails(row)}
                className="flex items-center justify-center px-2 py-[6px] border-2 border-[#D3E1EC] rounded bg-white hover:border-[#007EA7] transition-colors"
                style={{ width: 91 }}
              >
                <span className="font-montserrat font-semibold text-[12px] leading-4 text-[#7288A3] whitespace-nowrap">View details</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
