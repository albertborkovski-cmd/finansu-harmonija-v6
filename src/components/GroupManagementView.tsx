import { useRef, useState } from 'react';
import { ArrowLeft, Search, Columns, RefreshCw, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import EditDataStoreView from './EditDataStoreView';
import DataStoreDetailView from './DataStoreDetailView';
import ColumnSettingsPanel, { ColConfig } from './ColumnSettingsPanel';
import { PageActionButton, PageHeader } from './PageHeader';
import ExportPanel from './ExportPanel';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import OcrSearchField from './OcrSearchField';
import { matchesTextSearch } from '../utils/textSearch';
import ColumnSortButton, { useMultiColumnSort } from './ColumnSortButton';
import { ColumnSettingsButton } from './ScopedActionButtons';
import ImportButton from './ImportButton';
import { ResizeHandle, useColumnResize } from './useColumnResize';

interface DataStoreRow {
  id: string;
  name: string;
}

interface MemberRow {
  id: string;
  name: string;
  description: string;
  permissions: string;
  documentType: string;
  modelDocType: string;
  docTypeScore: string;
  ciResult: string;
  leResult: string;
  errorMessage: string;
  uuid: string;
  memberName: string;
  notes: string;
  status: string;
  url: string;
  s3Path: string;
  ocrJson: string;
}

const SAMPLE_MEMBERS: MemberRow[] = [
  {
    id: '1', name: 'MESO', description: '\u2014', permissions: 'Create',
    documentType: 'Invoice', modelDocType: 'Invoice', docTypeScore: '0.9999692440032959',
    ciResult: '{"scoreThreshold":0.9}', leResult: '{"City":"Ponta do Sol"}', errorMessage: '\u2014',
    uuid: '9f9cd30f-ce9b-44c6-9a7d-9f489953', memberName: 'Document 9f9cd30f',
    notes: 'Document for idp_sample/input_1ht5good', status: 'Ready',
    url: 'https://cs2.easyrpa.eu/api/v1/s3/proxy', s3Path: 'idp_sample/2a20a66b-f760',
    ocrJson: '{"runUuid":"b1cb4197-5f36"}'
  },
  {
    id: '2', name: 'MESO', description: '\u2014', permissions: 'Create',
    documentType: 'Receipt', modelDocType: 'Receipt', docTypeScore: '0.9876543210987654',
    ciResult: '{"scoreThreshold":0.85}', leResult: '{"City":"Lisbon"}', errorMessage: '\u2014',
    uuid: 'a2c3d4e5-f6g7-8901-bcde-fg2345678901', memberName: 'Document a2c3d4e5',
    notes: 'Document for idp_sample/input_2jk6prod', status: 'Ready',
    url: 'https://cs2.easyrpa.eu/api/v1/s3/proxy', s3Path: 'idp_sample/3b30b77c-g871',
    ocrJson: '{"runUuid":"c2dc5298-6g47"}'
  },
  {
    id: '3', name: 'MESO', description: '\u2014', permissions: 'Create',
    documentType: 'Contract', modelDocType: 'Contract', docTypeScore: '0.9543210987654321',
    ciResult: '{"scoreThreshold":0.92}', leResult: '{"City":"Porto"}', errorMessage: 'Timeout',
    uuid: 'b3d4e5f6-g7h8-9012-cdef-gh3456789012', memberName: 'Document b3d4e5f6',
    notes: 'Document for idp_sample/input_3lm7test', status: 'Error',
    url: 'https://cs2.easyrpa.eu/api/v1/s3/proxy', s3Path: 'idp_sample/4c41c88d-h982',
    ocrJson: '{"runUuid":"d3ed6309-7h58"}'
  },
  {
    id: '4', name: 'MESO', description: '\u2014', permissions: 'Create',
    documentType: 'Invoice', modelDocType: 'Invoice', docTypeScore: '0.9998765432109876',
    ciResult: '{"scoreThreshold":0.9}', leResult: '{"City":"Funchal"}', errorMessage: '\u2014',
    uuid: 'c4e5f6g7-h8i9-0123-defg-hi4567890123', memberName: 'Document c4e5f6g7',
    notes: 'Document for idp_sample/input_4no8batch', status: 'Ready',
    url: 'https://cs2.easyrpa.eu/api/v1/s3/proxy', s3Path: 'idp_sample/5d52d99e-i093',
    ocrJson: '{"runUuid":"e4fe7410-8i69"}'
  },
];

const DEFAULT_COLUMNS: ColConfig[] = [
  { key: 'name', label: 'Name', width: 260, visible: true },
  { key: 'description', label: 'Description', width: 200, visible: true },
  { key: 'permissions', label: 'Permissions', width: 150, visible: true },
  { key: 'uuid', label: 'Uuid', width: 220, visible: false },
  { key: 'memberName', label: 'Name', width: 200, visible: false },
  { key: 'notes', label: 'Notes', width: 250, visible: false },
  { key: 'status', label: 'Status', width: 120, visible: false },
  { key: 'url', label: 'URL', width: 280, visible: false },
  { key: 's3Path', label: 'S3 path', width: 250, visible: false },
  { key: 'ocrJson', label: 'Ocr json', width: 280, visible: false },
];

function getCellValue(member: MemberRow, key: string): string {
  const map: Record<string, string> = {
    name: member.name,
    description: member.description,
    permissions: member.permissions,
    documentType: member.documentType,
    modelDocType: member.modelDocType,
    docTypeScore: member.docTypeScore,
    ciResult: member.ciResult,
    leResult: member.leResult,
    errorMessage: member.errorMessage,
    uuid: member.uuid,
    memberName: member.memberName,
    notes: member.notes,
    status: member.status,
    url: member.url,
    s3Path: member.s3Path,
    ocrJson: member.ocrJson,
  };
  return map[key] || '\u2014';
}

interface Props {
  store: DataStoreRow;
  onBack: () => void;
}

export default function GroupManagementView({ store, onBack }: Props) {
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [members, setMembers] = useState<MemberRow[]>(SAMPLE_MEMBERS);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditView, setShowEditView] = useState(false);
  const [showDetailView, setShowDetailView] = useState<MemberRow | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columns, setColumns] = useState<ColConfig[]>(DEFAULT_COLUMNS);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [query, setQuery] = useState('');
  const { startResize } = useColumnResize(columns, setColumns);

  const totalPages = 9;
  const visibleColumns = columns.filter(c => c.visible);
  const filteredMembers = members.filter(member => matchesTextSearch(member, query));
  const { sortedRows, changeSort, directionFor } = useMultiColumnSort(filteredMembers, (member, key) => getCellValue(member, key));

  const toggleRow = (id: string) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedRows.length === members.length) setSelectedRows([]);
    else setSelectedRows(members.map(m => m.id));
  };

  const deleteRow = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setSelectedRows(prev => prev.filter(r => r !== id));
  };

  const title = `Group Management (${store.name} DataStore)`;

  if (showEditView) {
    return (
      <EditDataStoreView
        storeName={store.name}
        onBack={() => setShowEditView(false)}
      />
    );
  }

  if (showDetailView) {
    return (
      <DataStoreDetailView
        storeName={store.name}
        memberName={showDetailView.name}
        onBack={() => setShowDetailView(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white px-[72px] py-[56px]">

      {/* Header */}
      <PageHeader title={title} leading={<button onClick={onBack} className="flex-shrink-0 text-[#7288A3] hover:text-[#007EA7] transition-colors"><ArrowLeft size={20} /></button>} actions={<><PageActionButton disabled>Add</PageActionButton><PageActionButton onClick={() => setShowEditView(true)}>Create new</PageActionButton></>} className="mb-4" />

      {/* Breadcrumb */}
      <div className="flex flex-row items-center gap-2 mb-6">
        <button onClick={onBack} className="font-montserrat font-medium text-[12px] leading-[17px] text-[#7288A3] hover:text-[#007EA7] transition-colors">
          Data stores
        </button>
        <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#A1B6C6]">/</span>
        <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#A1B6C6]">{title}</span>
      </div>

      {/* Search + toolbar row */}
      <div className="flex flex-row justify-between items-center mb-6">
        <OcrSearchField ariaLabel="Search group members" value={query} onChange={value => { setQuery(value); setCurrentPage(1); }} />

        <div className="flex flex-row items-center gap-4">
          <button
            onClick={selectedRows.length > 0 ? () => { setMembers(prev => prev.filter(m => !selectedRows.includes(m.id))); setSelectedRows([]); } : undefined}
            className={`transition-colors ${selectedRows.length > 0 ? 'text-[#7288A3] hover:text-red-500' : 'text-[#7288A3] opacity-40'}`}
            title="DELETE"
          >
            <Trash2 size={16} />
          </button>
          <ColumnSettingsButton onClick={() => setShowColumnSettings(true)} />
          <ImportButton scope="Data store group management" />
          <button onClick={() => setMembers(current => current.map(member => ({ ...member })))} className="text-[#7288A3] hover:text-[#007EA7] transition-colors" title="REFRESH ALL">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div ref={tableScrollRef} className="flex flex-col flex-1 min-h-0 overflow-x-auto scrollbar-hide">
        {/* Header row */}
        <div className="flex flex-row items-center h-8 border-b border-transparent min-w-max">
          <div className="flex items-center pl-3 pr-2 flex-shrink-0" style={{ width: 42 }}>
            <button
              onClick={toggleAll}
              className="w-[18px] h-[18px] relative rounded-[4px] flex-shrink-0 transition-colors"
              style={selectedRows.length === members.length && members.length > 0
                ? { backgroundColor: '#007EA7' }
                : { border: '1px solid #A1B6C6', backgroundColor: 'transparent' }
              }
            >
              {selectedRows.length === members.length && members.length > 0 && (
                <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>

          {visibleColumns.map((col, idx) => {
            const realIndex = columns.findIndex(column => column.key === col.key);
            return (
            <div
              key={col.key}
              className={`relative flex items-center gap-[6px] flex-shrink-0 px-3 ${idx < visibleColumns.length - 1 ? 'border-r border-[#D3E1EC]' : ''}`}
              style={{ width: col.width }}
            >
              <span className={`font-montserrat font-medium text-[12px] leading-[18px] ${idx === 0 ? 'text-[#10233A]' : 'text-[#7288A3]'}`}>
                {col.label}
              </span>
              <ColumnSortButton columnLabel={col.label} direction={directionFor(col.key)} onDirectionChange={direction => { changeSort(col.key, direction); setCurrentPage(1); }} />
              <ResizeHandle onMouseDown={event => startResize(realIndex, event)} />
            </div>
          )})}

          {/* Actions spacer */}
          <div className="flex-shrink-0" style={{ width: 52 }} />
        </div>

        {/* Rows */}
        <div className="flex flex-col">
          {sortedRows.map((member, idx) => (
            <div
              key={member.id}
              onClick={() => toggleRow(member.id)}
              className={`flex flex-row items-center h-9 rounded-lg cursor-pointer transition-colors min-w-max ${
                idx % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'
              } ${selectedRows.includes(member.id) ? '!bg-[#E6F2F6]' : 'hover:bg-[#EDF5FA]'}`}
            >
              {/* Checkbox */}
              <div className="flex items-center pl-3 pr-2 flex-shrink-0" style={{ width: 42 }}>
                <button
                  onClick={e => { e.stopPropagation(); toggleRow(member.id); }}
                  className="w-[18px] h-[18px] relative rounded-[4px] flex-shrink-0 transition-colors"
                  style={selectedRows.includes(member.id)
                    ? { backgroundColor: '#007EA7' }
                    : { border: '1px solid #A1B6C6', backgroundColor: 'transparent' }
                  }
                >
                  {selectedRows.includes(member.id) && (
                    <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Dynamic columns */}
              {visibleColumns.map((col, colIdx) => (
                <div
                  key={col.key}
                  className={`flex items-center flex-shrink-0 px-3 ${colIdx < visibleColumns.length - 1 ? 'border-r border-[#E5EDF9]' : ''}`}
                  style={{ width: col.width }}
                >
                  {col.key === 'name' ? (
                    <button
                      onClick={e => { e.stopPropagation(); setShowDetailView(member); }}
                      className="font-montserrat font-normal text-[12px] leading-[18px] text-[#007EA7] truncate hover:underline transition-colors"
                    >
                      {getCellValue(member, col.key)}
                    </button>
                  ) : (
                    <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A] truncate">
                      {getCellValue(member, col.key)}
                    </span>
                  )}
                </div>
              ))}

              {/* Delete button */}
              <div className="flex items-center justify-center flex-shrink-0 pr-3" style={{ width: 52 }}>
                <button
                  onClick={e => { e.stopPropagation(); deleteRow(member.id); }}
                  className="w-7 h-7 flex items-center justify-center bg-white border-2 border-[#D3E1EC] rounded text-[#7288A3] hover:text-red-500 hover:border-red-400 transition-colors"
                  title="DELETE"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <HorizontalTableScrollbar scrollRef={tableScrollRef} />

      {/* Pagination */}
      {members.length > 0 && (
        <div className="flex flex-row justify-between items-center h-8 mt-auto pt-6">
          {/* Page numbers */}
          <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={members.length} onPageChange={setCurrentPage} />

          {/* Items count + show more */}
          <div className="flex flex-row items-center gap-3 flex-shrink-0">
            <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap">
              14 from 15,000 items
            </span>
            <button className="flex items-center justify-center px-3 py-[6px] bg-white border-2 border-[#D3E1EC] rounded-md h-8">
              <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">Show more</span>
            </button>
          </div>
        </div>
      )}

      {/* Column settings panel */}
      {showColumnSettings && (
        <ColumnSettingsPanel
          columns={columns}
          onSave={(updatedCols) => setColumns(updatedCols)}
          onClose={() => setShowColumnSettings(false)}
        />
      )}

      {/* Export panel */}
      {showExportPanel && (
        <ExportPanel
          initialData={selectedRows.length === 1 ? members.find(m => m.id === selectedRows[0]) : undefined}
          onClose={() => setShowExportPanel(false)}
          onSave={() => setShowExportPanel(false)}
        />
      )}
    </div>
  );
}
