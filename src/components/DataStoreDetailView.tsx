import { useRef, useState } from 'react';
import { ArrowLeft, Search, Download, RefreshCw, Trash2, ChevronLeft, ChevronRight, X, ArrowRight } from 'lucide-react';
import ColumnSettingsPanel, { ColConfig } from './ColumnSettingsPanel';
import { PageActionButton, PageHeader } from './PageHeader';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import OcrSearchField from './OcrSearchField';
import { ColumnSettingsButton, SaveButton } from './ScopedActionButtons';
import ColumnSortButton, { useMultiColumnSort } from './ColumnSortButton';
import { BulkDeleteButton, RowDeleteButton } from './DeleteButtons';
import ImportButton from './ImportButton';
import { ResizeHandle, useColumnResize } from './useColumnResize';

interface RecordRow {
  id: string;
  documentType: string;
  modelDocumentType: string;
  documentTypeScore: string;
  ciResult: string;
  leResult: string;
  errorMessage: string;
  uuid: string;
  name: string;
}

const SAMPLE_RECORDS: RecordRow[] = [
  {
    id: '1', documentType: 'Invoice', modelDocumentType: 'Invoice',
    documentTypeScore: '0.9999692440032959',
    ciResult: '{"scoreThreshold":0...',
    leResult: '{"City":"Ponta do Sol,...',
    errorMessage: '\u2014', uuid: '9f9cd30f-ce9b-44c6...', name: 'Document 9f9cd30f...'
  },
  {
    id: '2', documentType: 'Invoice', modelDocumentType: 'Invoice',
    documentTypeScore: '0.9999692440032959',
    ciResult: '{"scoreThreshold":0...',
    leResult: '{"City":"Ponta do Sol,...',
    errorMessage: '\u2014', uuid: '9f9cd30f-ce9b-44c6...', name: 'Document 9f9cd30f...'
  },
  {
    id: '3', documentType: 'Invoice', modelDocumentType: 'Invoice',
    documentTypeScore: '0.9999692440032959',
    ciResult: '{"scoreThreshold":0...',
    leResult: '{"City":"Ponta do Sol,...',
    errorMessage: '\u2014', uuid: '9f9cd30f-ce9b-44c6...', name: 'Document 9f9cd30f...'
  },
  {
    id: '4', documentType: 'Invoice', modelDocumentType: 'Invoice',
    documentTypeScore: '0.9999692440032959',
    ciResult: '{"scoreThreshold":0...',
    leResult: '{"City":"Ponta do Sol,...',
    errorMessage: '\u2014', uuid: '9f9cd30f-ce9b-44c6...', name: 'Document 9f9cd30f...'
  },
];

const DEFAULT_COLUMNS: ColConfig[] = [
  { key: 'documentType', label: 'Document type', width: 160, visible: true },
  { key: 'modelDocumentType', label: 'Model document type', width: 160, visible: true },
  { key: 'documentTypeScore', label: 'Document type score', width: 160, visible: true },
  { key: 'ciResult', label: 'CI result', width: 160, visible: true },
  { key: 'leResult', label: 'Le result', width: 160, visible: true },
  { key: 'errorMessage', label: 'Error message', width: 140, visible: true },
  { key: 'uuid', label: 'Uuid', width: 160, visible: false },
  { key: 'name', label: 'Name', width: 160, visible: false },
  { key: 'notes', label: 'Notes', width: 160, visible: false },
  { key: 'status', label: 'Status', width: 130, visible: false },
  { key: 'url', label: 'URL', width: 200, visible: false },
  { key: 's3path', label: 'S3 path', width: 200, visible: false },
  { key: 'ocrJson', label: 'Ocr json', width: 200, visible: false },
];

const EDIT_FIELDS = [
  { label: 'Document type', value: 'Invoice' },
  { label: 'Model document type', value: 'Invoice' },
  { label: 'Document type score', value: '0.9999692440032959' },
  { label: 'Uuid', value: '9f9cd30f-ce9b-44c6-9a7d-9f489953e5c1' },
  { label: 'Name', value: 'Document 9f9cd30f-ce9b-44c6-9a7d-9f489953e5..' },
  { label: 'Error message', value: '\u2014' },
  { label: 'Notes', value: 'Document for idp_sample/input_1ht5good/INVO..' },
  { label: 'Status', value: 'Ready' },
  { label: 'URL', value: 'https://cs2.easyrpa.eu/api/v1/s3/proxy/data/id.' },
  { label: 'S3 path', value: 'idp_sample/2a20a66b-f760-40cc-847b-ea84c5b..' },
  { label: 'CI result', value: '{"scoreThreshold":0.9,"multipleChoice":false,.' },
  { label: 'Le result', value: '{"City":"Ponta do Sol","products":[{"Price":.' },
  { label: 'Ocr json', value: '{"runUuid":"b1cb4197-5f36-4be6-8161-97a9064.' },
];

function getCellValue(row: RecordRow, key: string): string {
  const map: Record<string, string> = {
    documentType: row.documentType,
    modelDocumentType: row.modelDocumentType,
    documentTypeScore: row.documentTypeScore,
    ciResult: row.ciResult,
    leResult: row.leResult,
    errorMessage: row.errorMessage,
    uuid: row.uuid,
    name: row.name,
  };
  return map[key] ?? '\u2014';
}

interface Props {
  storeName: string;
  memberName: string;
  onBack: () => void;
}

export default function DataStoreDetailView({ storeName, memberName: _memberName, onBack }: Props) {
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [records, setRecords] = useState<RecordRow[]>(SAMPLE_RECORDS);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPanel, setShowPanel] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columns, setColumns] = useState<ColConfig[]>(DEFAULT_COLUMNS);
  const [fields, setFields] = useState(EDIT_FIELDS.map(f => ({ ...f })));
  const [search, setSearch] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const { startResize } = useColumnResize(columns, setColumns);

  const totalPages = 9;
  const visibleColumns = columns.filter(c => c.visible);
  const filteredRecords = records.filter(record => !search.trim() || Object.values(record).some(value => String(value).toLowerCase().includes(search.trim().toLowerCase())));
  const { sortedRows, changeSort, directionFor } = useMultiColumnSort(filteredRecords, (record, key) => getCellValue(record, key));

  const toggleRow = (id: string) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelectedRows(prev => prev.length === records.length ? [] : records.map(r => r.id));
  };
  const updateField = (idx: number, value: string) => {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, value } : f));
  };

  const deleteSelected = () => {
    setRecords(current => current.filter(record => !selectedRows.includes(record.id)));
    setSelectedRows([]);
  };

  const deleteRecord = (id: string) => {
    setRecords(current => current.filter(record => record.id !== id));
    setSelectedRows(current => current.filter(selectedId => selectedId !== id));
  };

  const openCreateRecord = () => {
    setEditingRecordId(null);
    setFields(EDIT_FIELDS.map(field => ({ ...field, value: '' })));
    setShowPanel(true);
  };

  const openEditRecord = (record: RecordRow) => {
    const values: Record<string, string> = {
      'Document type': record.documentType,
      'Model document type': record.modelDocumentType,
      'Document type score': record.documentTypeScore,
      'CI result': record.ciResult,
      'Le result': record.leResult,
      'Error message': record.errorMessage,
      'Uuid': record.uuid,
      'Name': record.name,
    };
    setEditingRecordId(record.id);
    setFields(EDIT_FIELDS.map(field => ({ ...field, value: values[field.label] ?? field.value })));
    setShowPanel(true);
  };

  const saveRecord = () => {
    const values = Object.fromEntries(fields.map(field => [field.label, field.value.trim()]));
    const documentType = values['Document type'];
    if (!documentType) return;
    const nextRecord: Omit<RecordRow, 'id'> = {
      documentType,
      modelDocumentType: values['Model document type'] || '—',
      documentTypeScore: values['Document type score'] || '—',
      ciResult: values['CI result'] || '—',
      leResult: values['Le result'] || '—',
      errorMessage: values['Error message'] || '—',
      uuid: values['Uuid'] || `record-${Date.now()}`,
      name: values['Name'] || documentType,
    };

    if (editingRecordId) {
      setRecords(current => current.map(record => record.id === editingRecordId ? { id: record.id, ...nextRecord } : record));
    } else {
      const numericIds = records.map(record => Number(record.id)).filter(Number.isFinite);
      const nextId = String((numericIds.length ? Math.max(...numericIds) : 0) + 1);
      setRecords(current => [...current, { id: nextId, ...nextRecord }]);
    }
    setShowPanel(false);
    setEditingRecordId(null);
    setCurrentPage(1);
  };

  const groupManagementTitle = `Group Management (${storeName} DataStore)`;

  return (
    <div className="flex flex-col h-full bg-white px-[72px] py-[56px] gap-8 relative overflow-hidden">

      {/* Header */}
      <div className="flex flex-col gap-4 flex-shrink-0">
        <PageHeader title="Data store details" leading={<button onClick={onBack} className="flex-shrink-0 text-[#7288A3] hover:text-[#007EA7] transition-colors"><ArrowLeft size={20} /></button>} actions={<><PageActionButton onClick={onBack}>Actions</PageActionButton><PageActionButton onClick={openCreateRecord}>Create new</PageActionButton></>} />

        {/* Breadcrumb */}
        <div className="flex flex-row items-center gap-2 flex-wrap">
          <button onClick={onBack} className="font-montserrat font-medium text-[12px] leading-[17px] text-[#7288A3] hover:text-[#007EA7] transition-colors whitespace-nowrap">
            Data stores
          </button>
          <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#A1B6C6]">/</span>
          <button onClick={onBack} className="font-montserrat font-medium text-[12px] leading-[17px] text-[#7288A3] hover:text-[#007EA7] transition-colors truncate max-w-[400px]">
            {groupManagementTitle}
          </button>
          <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#A1B6C6]">/</span>
          <span className="font-montserrat font-medium text-[12px] leading-[17px] text-[#007EA7] whitespace-nowrap">
            Data store details
          </span>
        </div>
      </div>

      {/* Toolbar row */}
      <div className="flex flex-row justify-between items-center flex-shrink-0">
        {/* Search */}
        <OcrSearchField ariaLabel="Search data store records" value={search} onChange={setSearch} />

        {/* Action icons */}
        <div className="flex flex-row items-center gap-4">
          <BulkDeleteButton selectedCount={selectedRows.length} onDelete={deleteSelected} label="Delete selected data store records" />
          <ColumnSettingsButton onClick={() => setShowColumnSettings(true)} />
          <ImportButton scope={`Data store ${store.name}`} />
          <button onClick={() => setRecords(current => current.map(record => ({ ...record })))} className="text-[#7288A3] hover:text-[#007EA7] transition-colors" title="REFRESH ALL">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div ref={tableScrollRef} className="flex flex-col flex-1 min-h-0 overflow-x-auto scrollbar-hide">
        {/* Column header row */}
        <div className="flex h-9 w-max min-w-full flex-row items-center border-b border-[#E5EDF9]">
          {/* Checkbox */}
          <div className="flex items-center justify-center w-10 flex-shrink-0">
            <button
              onClick={toggleAll}
              className="w-[18px] h-[18px] rounded flex items-center justify-center border transition-colors"
              style={selectedRows.length === records.length && records.length > 0
                ? { backgroundColor: '#007EA7', borderColor: '#007EA7' }
                : { borderColor: '#A1B6C6', backgroundColor: 'transparent' }
              }
            >
              {selectedRows.length === records.length && records.length > 0 && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>

          {/* Column headers */}
          {visibleColumns.map((col) => {
            const realIndex = columns.findIndex(column => column.key === col.key);
            return (
            <div
              key={col.key}
              className="relative flex items-center gap-1 flex-shrink-0 px-3 h-full border-r border-[#E5EDF9] last:border-r-0"
              style={{ width: col.width }}
            >
              {col.key === 'documentType' ? (
                <>
                  <span className="font-montserrat font-semibold text-[12px] leading-[18px] text-[#10233A]">{col.label}</span>
                  <ColumnSortButton columnLabel={col.label} direction={directionFor(col.key)} onDirectionChange={direction => { changeSort(col.key, direction); setCurrentPage(1); }} />
                </>
              ) : (
                <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">{col.label}</span>
              )}
              <ResizeHandle onMouseDown={event => startResize(realIndex, event)} />
            </div>
          )})}

          {/* Delete col header spacer */}
          <div className="w-10 flex-shrink-0" />
        </div>

        {/* Data rows */}
        <div className="flex flex-col">
          {sortedRows.map((record, idx) => (
            <div
              key={record.id}
              onClick={() => openEditRecord(record)}
              className={`flex h-9 w-max min-w-full flex-row items-center rounded-lg transition-colors cursor-default ${
                idx % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'
              } ${selectedRows.includes(record.id) ? '!bg-[#E0EFF7]' : 'hover:bg-[#EDF5FA]'}`}
            >
              {/* Checkbox */}
              <div className="flex items-center justify-center w-10 flex-shrink-0">
                <button
                  onClick={event => { event.stopPropagation(); toggleRow(record.id); }}
                  className="w-[18px] h-[18px] rounded flex items-center justify-center border transition-colors"
                  style={selectedRows.includes(record.id)
                    ? { backgroundColor: '#007EA7', borderColor: '#007EA7' }
                    : { borderColor: '#A1B6C6', backgroundColor: 'transparent' }
                  }
                >
                  {selectedRows.includes(record.id) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Cells */}
              {visibleColumns.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center flex-shrink-0 px-3 h-full"
                  style={{ width: col.width }}
                >
                  <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#10233A] truncate block w-full">
                    {getCellValue(record, col.key)}
                  </span>
                </div>
              ))}

              {/* Row delete */}
              <div className="flex items-center justify-center w-10 flex-shrink-0">
                <RowDeleteButton label={`Delete data store record ${record.id}`} onDelete={() => deleteRecord(record.id)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <HorizontalTableScrollbar scrollRef={tableScrollRef} />

      {/* Pagination bar */}
      <div className="flex flex-row justify-between items-center flex-shrink-0 h-8">

        {/* Page numbers */}
        <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={records.length} onPageChange={setCurrentPage} />

        {/* Items count + show more */}
        <div className="flex flex-row items-center gap-3 flex-shrink-0">
          <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap">
            14 from 15,000 items
          </span>
          <button
            onClick={openCreateRecord}
            className="flex items-center justify-center px-3 py-[6px] bg-white border-2 border-[#D3E1EC] rounded-md h-8 hover:border-[#007EA7] transition-colors whitespace-nowrap"
          >
            <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">Show more</span>
          </button>
        </div>
      </div>

      {/* Column settings panel */}
      {showColumnSettings && (
        <ColumnSettingsPanel
          columns={columns}
          defaultColumns={DEFAULT_COLUMNS}
          onSave={(updatedCols) => setColumns(updatedCols)}
          onClose={() => setShowColumnSettings(false)}
        />
      )}

      {/* Edit record right drawer */}
      {showPanel && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowPanel(false)}
        >
          <div
            className="absolute top-0 right-0 h-full w-[440px] bg-white flex flex-col overflow-hidden"
            style={{ boxShadow: '-2px 0px 0px #E5EDF9' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="flex flex-row justify-between items-center px-6 py-6 flex-shrink-0">
              <span className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">
                {editingRecordId ? 'Edit record' : 'Create record'}
              </span>
              <button onClick={() => setShowPanel(false)} className="text-[#7288A3] hover:text-[#10233A] transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable fields */}
            <div className="flex flex-col gap-6 flex-1 overflow-y-auto px-6 pb-4">
              {fields.map((field, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <label className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={e => updateField(idx, e.target.value)}
                    className="w-full h-[42px] px-[14px] py-[11px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] focus:outline-none focus:border-[#007EA7] transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Panel footer */}
            <div className="flex flex-col gap-4 px-6 pb-8 pt-4 flex-shrink-0">
              <SaveButton className="w-full" onClick={saveRecord} disabled={!fields.find(field => field.label === 'Document type')?.value.trim()} />
              <button
                onClick={() => setShowPanel(false)}
                className="w-full h-[42px] flex items-center justify-center bg-white border-2 border-[#D3E1EC] rounded-lg hover:border-[#007EA7] transition-colors"
              >
                <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#7288A3]">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
