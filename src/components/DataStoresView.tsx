import { useMemo, useRef, useState, useCallback } from 'react';
import { Search, Columns, Download, RefreshCw, Trash2, RotateCcw, Ban, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Upload, Users, ArrowLeft, Pencil, AlignLeft, Braces, Map, Copy, Maximize, CheckCircle2 } from 'lucide-react';
import { useColumnResize, ResizeHandle } from './useColumnResize';
import ColumnSettingsPanel, { type ColConfig } from './ColumnSettingsPanel';
import { PageActionButton, PageHeader } from './PageHeader';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import OcrSearchField from './OcrSearchField';
import { matchesTextSearch } from '../utils/textSearch';
import { ColumnSettingsButton, SaveButton } from './ScopedActionButtons';
import ColumnSortButton, { useMultiColumnSort } from './ColumnSortButton';
import { BulkDeleteButton, RowDeleteButton } from './DeleteButtons';
import * as XLSX from 'xlsx';
import type { SecurityAccessTarget } from './ResourceSecurityAccessView';

interface DataStoreRow {
  id: string;
  name: string;
  description: string;
  countOfRecords: number;
  createdBy: string;
  creationDate: string;
}

const SAMPLE_DATA: DataStoreRow[] = [
  { id: '1', name: 'IDP process', description: 'Intelligent document processing sample', countOfRecords: 142, createdBy: 'John Brick', creationDate: '10.04.2026 12:22' },
  { id: '2', name: 'IDP process', description: 'Intelligent document processing sample', countOfRecords: 98,  createdBy: 'John Brick', creationDate: '10.04.2026 12:22' },
  { id: '3', name: 'IDP process', description: 'Intelligent document processing sample', countOfRecords: 315, createdBy: 'John Brick', creationDate: '10.04.2026 12:22' },
  { id: '4', name: 'IDP process', description: 'Intelligent document processing sample', countOfRecords: 57,  createdBy: 'John Brick', creationDate: '10.04.2026 12:22' },
];

interface ColumnDef {
  id: string;
  label: string;
  width: number;
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'description', label: 'Description', width: 280 },
  { id: 'countOfRecords', label: 'Count of records', width: 150 },
  { id: 'createdBy', label: 'Created by', width: 160 },
  { id: 'creationDate', label: 'Creation date', width: 150 },
];

const DATA_STORE_DETAIL_FIELDS = [
  'document_type',
  'model_document_type',
  'document_type_score',
  'cl_result',
  'ie_result',
  'error_message',
  'uuid',
  'name',
  'notes',
  'status',
  'url',
  's3_path',
  'ocr_json',
  'input_json',
  'output_json',
  'model_output_json',
  'auto_training_json',
  'isInvalid',
  'update_timestamp',
] as const;

const DETAIL_FIELD_LABELS: Record<string, string> = {
  document_type: 'Document type',
  model_document_type: 'Model document type',
  document_type_score: 'Document type score',
  cl_result: 'CL result',
  ie_result: 'IE result',
  error_message: 'Error message',
  uuid: 'UUID',
  name: 'Name',
  notes: 'Notes',
  status: 'Status',
  url: 'URL',
  s3_path: 'S3 path',
  ocr_json: 'OCR JSON',
  input_json: 'Input JSON',
  output_json: 'Output JSON',
  model_output_json: 'Model output JSON',
  auto_training_json: 'Auto training JSON',
  isInvalid: 'Is invalid',
  update_timestamp: 'Update timestamp',
};

function formatDetailFieldLabel(field: string) {
  if (DETAIL_FIELD_LABELS[field]) return DETAIL_FIELD_LABELS[field];
  const words = field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function parseDetailJson(value: string): { valid: boolean; parsed: unknown } {
  if (!value.trim()) return { valid: true, parsed: {} };
  try {
    return { valid: true, parsed: JSON.parse(value) };
  } catch {
    return { valid: false, parsed: value };
  }
}

function DetailJsonTree({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (Array.isArray(value)) {
    return (
      <div className="font-mono text-[13px] leading-6">
        <div className="text-[#7288A3]">[</div>
        {value.map((item, index) => (
          <div key={index} className="flex items-start gap-2" style={{ paddingLeft: `${(depth + 1) * 18}px` }}>
            <span className="text-[#7288A3]">{index}:</span>
            <DetailJsonTree value={item} depth={depth + 1} />
          </div>
        ))}
        <div className="text-[#7288A3]">]</div>
      </div>
    );
  }

  if (value !== null && typeof value === 'object') {
    return (
      <div className="font-mono text-[13px] leading-6">
        <div className="text-[#7288A3]">{'{'}</div>
        {Object.entries(value as Record<string, unknown>).map(([key, item]) => (
          <div key={key} className="flex items-start gap-2" style={{ paddingLeft: `${(depth + 1) * 18}px` }}>
            <ChevronDown size={13} className="mt-[5px] flex-shrink-0 text-[#8E9EAA]" />
            <span className="text-[#9A1F1F]">{key}</span>
            <span className="text-[#7288A3]">:</span>
            <DetailJsonTree value={item} depth={depth + 1} />
          </div>
        ))}
        <div className="text-[#7288A3]">{'}'}</div>
      </div>
    );
  }

  const color = typeof value === 'string' ? 'text-[#1557A0]' : typeof value === 'number' ? 'text-[#8250DF]' : 'text-[#007A65]';
  return <span className={`font-mono text-[13px] leading-6 ${color}`}>{String(value)}</span>;
}

const DATA_STORE_DETAIL_COLUMNS: ColConfig[] = DATA_STORE_DETAIL_FIELDS.map(field => ({
  key: field,
  label: formatDetailFieldLabel(field),
  width: ['cl_result', 'ie_result'].includes(field) ? 300
    : ['uuid', 'name'].includes(field) ? 270
      : ['model_document_type', 'document_type_score', 'error_message'].includes(field) ? 180
        : 150,
  visible: true,
}));

type DataStoreDetailField = typeof DATA_STORE_DETAIL_FIELDS[number];
type DataStoreDetailRecord = Record<DataStoreDetailField, string>;
interface DetailEditState {
  originalUuid: string | null;
  values: DataStoreDetailRecord;
}

type DetailFieldMode = 'text' | 'lines' | 'json';

function createEmptyDetailRecord(): DataStoreDetailRecord {
  return Object.fromEntries(DATA_STORE_DETAIL_FIELDS.map(field => [field, ''])) as DataStoreDetailRecord;
}

const DETAIL_UUIDS = [
  '1d3c8d8d-18e0-4994-8507-b7e04ffea946',
  '43a2b04d-a69b-4b4a-be74-d8c0aafae8c',
  '4e10fd82-fce8-479b-832d-003a48717967',
  'f7139ef9-5c33-47be-b7d6-1c0550309094',
  '16ca5b4a-66da-4af0-a87b-7fc4c0b5d630',
];

const DATA_STORE_DETAIL_SAMPLE_ROWS: DataStoreDetailRecord[] = DETAIL_UUIDS.map((uuid, index) => ({
  document_type: 'Invoice',
  model_document_type: 'Invoice',
  document_type_score: ['0.9999692440032959', '0.9999746084213257', '0.9999724626541138', '0.999971866607666', '0.9999693632125854'][index],
  cl_result: '{"scoreThreshold":0.9,"multipleChoice":false,"labels":["Invoice"]}',
  ie_result: `{"City":"${['Sapna', 'Vilnius', 'Tiverton', 'Miyako', 'Filiasi'][index]}","products":[{"Price":"${[31, 88, 169, 107, 88][index]} 00"}]}`,
  error_message: '—',
  uuid,
  name: `Document ${uuid}`,
  notes: 'Document for idp_sample',
  status: 'Completed',
  url: `https://documents.local/${uuid}`,
  s3_path: `s3://idp-sample/${uuid}.pdf`,
  ocr_json: '{"pages":1,"language":"en"}',
  input_json: `{"documentId":"${uuid}"}`,
  output_json: '{"processed":true}',
  model_output_json: '{"documentType":"Invoice"}',
  auto_training_json: '{"enabled":false}',
  isInvalid: 'false',
  update_timestamp: `10.04.2026 12:${22 + index}`,
}));

interface EditRecordData {
  name: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  assignee: string;
  dueDate: string;
  tags: string;
}

export default function DataStoresView({ onNavigateToAdministration }: { onNavigateToAdministration?: (target: SecurityAccessTarget) => void }) {
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);
  const [rows, setRows] = useState<DataStoreRow[]>(SAMPLE_DATA);
  const [query, setQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [detailColumns, setDetailColumns] = useState<ColConfig[]>(DATA_STORE_DETAIL_COLUMNS);
  const [detailQuery, setDetailQuery] = useState('');
  const [detailRecords, setDetailRecords] = useState<DataStoreDetailRecord[]>(DATA_STORE_DETAIL_SAMPLE_ROWS);
  const [selectedDetailRecords, setSelectedDetailRecords] = useState<Set<string>>(new Set());
  const [editingDetailRecord, setEditingDetailRecord] = useState<DetailEditState | null>(null);
  const [detailFieldModes, setDetailFieldModes] = useState<Partial<Record<DataStoreDetailField, DetailFieldMode>>>({});
  const [detailTreeFields, setDetailTreeFields] = useState<Set<DataStoreDetailField>>(new Set());
  const [detailFullscreenField, setDetailFullscreenField] = useState<DataStoreDetailField | null>(null);
  const [copiedDetailField, setCopiedDetailField] = useState<DataStoreDetailField | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFormat, setUploadFormat] = useState('Default');
  const [uploadFormatOpen, setUploadFormatOpen] = useState(false);
  const [exportRowData, setExportRowData] = useState<DataStoreRow | null>(null);
  const [exportAllData, setExportAllData] = useState(false);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'XLSX' | ''>('');
  const [exportFormatOpen, setExportFormatOpen] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRecord, setEditRecord] = useState<EditRecordData>({
    name: '', description: '', status: '', category: '', priority: '', assignee: '', dueDate: '', tags: '',
  });

  const [columnOrder, setColumnOrder] = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS.map(c => c.id));

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);
  const totalItems = 15000;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Detail view state
  const [detailStore, setDetailStore] = useState<DataStoreRow | null>(null);

  const openColumnPanel = () => setShowColumnSettings(true);

  const saveColumnSettings = (nextColumns: ColConfig[]) => {
    setColumnOrder(nextColumns.map(column => ({ id: column.key, label: column.label, width: column.width })));
    setVisibleColumns(nextColumns.filter(column => column.visible).map(column => column.key));
  };

  const toggleRow = (id: string) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedRows.length === rows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(rows.map(d => d.id));
    }
  };

  const deleteSelected = () => {
    setRows(prev => prev.filter(r => !selectedRows.includes(r.id)));
    setSelectedRows([]);
  };

  const deleteRow = (id: string) => {
    setRows(prev => prev.filter(row => row.id !== id));
    setSelectedRows(prev => prev.filter(selectedId => selectedId !== id));
    setDetailStore(current => current?.id === id ? null : current);
  };

  const deleteDetailRecord = (uuid: string) => {
    setDetailRecords(current => current.filter(record => record.uuid !== uuid));
    setSelectedDetailRecords(current => {
      const next = new Set(current);
      next.delete(uuid);
      return next;
    });
  };

  const copyDetailFieldValue = (field: DataStoreDetailField, value: string) => {
    setCopiedDetailField(field);
    if (copyFeedbackTimeoutRef.current !== null) window.clearTimeout(copyFeedbackTimeoutRef.current);
    copyFeedbackTimeoutRef.current = window.setTimeout(() => {
      setCopiedDetailField(null);
      copyFeedbackTimeoutRef.current = null;
    }, 2500);

    void (async () => {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const copyArea = document.createElement('textarea');
        copyArea.value = value;
        copyArea.style.position = 'fixed';
        copyArea.style.opacity = '0';
        document.body.appendChild(copyArea);
        copyArea.select();
        document.execCommand('copy');
        document.body.removeChild(copyArea);
      }
    })();
  };

  const exportRows = (sourceRows: DataStoreRow[], format: 'CSV' | 'XLSX', fileName: string) => {
    const exportData = sourceRows.map(row => ({
      'ID': row.id,
      'Name': row.name,
      'Description': row.description,
      'Count of records': row.countOfRecords,
      'Created by': row.createdBy,
      'Creation date': row.creationDate,
    }));

    if (format === 'XLSX') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data store');
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else {
      const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
      const columns = exportData.length ? Object.keys(exportData[0]) : ['ID', 'Name', 'Description', 'Count of records', 'Created by', 'Creation date'];
      const csvRows = exportData.map(row => columns.map(column => escapeCsv(row[column as keyof typeof row])).join(','));
      const csv = `\uFEFF${columns.map(escapeCsv).join(',')}\r\n${csvRows.join('\r\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }

    setExportRowData(null);
    setExportAllData(false);
    setExportFormat('');
    setExportFormatOpen(false);
  };

  const openEditPanel = (row: DataStoreRow) => {
    setEditingRowId(row.id);
    setEditRecord({
      name: row.name,
      description: row.description,
      status: 'Active',
      category: 'Document Processing',
      priority: 'Medium',
      assignee: row.createdBy,
      dueDate: row.creationDate,
      tags: 'IDP, automation',
    });
    setShowEditPanel(true);
  };

  const openCreatePanel = () => {
    setEditingRowId(null);
    setEditRecord({
      name: '', description: '', status: 'Active', category: 'Data store', priority: 'Medium',
      assignee: 'RPA platform', dueDate: new Date().toLocaleDateString('lt-LT'), tags: '',
    });
    setShowEditPanel(true);
  };

  const openUploadPanel = () => {
    setUploadFile(null);
    setUploadFormat('Default');
    setUploadFormatOpen(false);
    setShowUploadModal(true);
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const closeUploadPanel = () => {
    setShowUploadModal(false);
    setUploadFormatOpen(false);
  };

  const saveRecord = () => {
    const name = editRecord.name.trim();
    if (!name) return;

    if (editingRowId) {
      setRows(current => current.map(row => row.id === editingRowId
        ? { ...row, name, description: editRecord.description.trim() || '—', createdBy: editRecord.assignee.trim() || row.createdBy, creationDate: editRecord.dueDate.trim() || row.creationDate }
        : row));
    } else {
      const numericIds = rows.map(row => Number(row.id)).filter(Number.isFinite);
      const nextId = String((numericIds.length ? Math.max(...numericIds) : 0) + 1);
      setRows(current => [...current, {
        id: nextId,
        name,
        description: editRecord.description.trim() || '—',
        countOfRecords: 0,
        createdBy: editRecord.assignee.trim() || 'RPA platform',
        creationDate: editRecord.dueDate.trim() || new Date().toLocaleDateString('lt-LT'),
      }]);
      setCurrentPage(1);
    }

    setShowEditPanel(false);
    setEditingRowId(null);
  };

  const orderedVisible = columnOrder.filter(c => visibleColumns.includes(c.id));

  // Adapter for useColumnResize hook
  const colConfigs: ColConfig[] = orderedVisible.map(c => ({ key: c.id, label: c.label, width: c.width, visible: true }));
  const setColConfigs = useCallback((cols: ColConfig[]) => {
    setColumnOrder(prev => prev.map(c => {
      const updated = cols.find(uc => uc.key === c.id);
      return updated ? { ...c, width: updated.width } : c;
    }));
  }, []);
  const { startResize } = useColumnResize(colConfigs, setColConfigs);
  const { startResize: startResizeDetail } = useColumnResize(detailColumns, setDetailColumns);
  const filteredRows = useMemo(() => rows.filter(row => matchesTextSearch(row, query)), [rows, query]);
  const { sortedRows, changeSort, directionFor } = useMultiColumnSort(filteredRows, (row, key) => row[key as keyof DataStoreRow]);
  const { sortedRows: sortedDetailRecords, changeSort: changeDetailSort, directionFor: detailDirectionFor } = useMultiColumnSort(detailRecords, (row, key) => row[key as DataStoreDetailField]);

  // Detail sub-view
  if (detailStore) {
    const visibleDetailColumns = detailColumns.filter(column => column.visible);
    const normalizedDetailQuery = detailQuery.trim().toLowerCase();
    const filteredDetailRecords = sortedDetailRecords.filter(record =>
      !normalizedDetailQuery || Object.values(record).some(value => value.toLowerCase().includes(normalizedDetailQuery))
    );
    const allDetailRecordsSelected = filteredDetailRecords.length > 0
      && filteredDetailRecords.every(record => selectedDetailRecords.has(record.uuid));
    return (
      <div className="relative flex min-h-full flex-col gap-7 bg-white px-9 py-10" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>
        {/* Breadcrumb */}
        <div className="flex flex-row items-center gap-2 flex-shrink-0">
          <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">Data stores</span>
          <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">/</span>
          <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">{detailStore.name}</span>
        </div>

        <div className="flex min-h-[42px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="font-montserrat text-[28px] font-semibold leading-9 text-[#10233A]">Data Store Details</h1>
            <button
              type="button"
              onClick={() => {
                setShowColumnSettings(false);
                setSelectedDetailRecords(new Set());
                setDetailStore(null);
              }}
              className="flex items-center gap-1 font-montserrat text-[12px] font-semibold text-[#007EA7] hover:underline"
            >
              <ArrowLeft size={16} />
              Back to list
            </button>
          </div>
          <div className="flex items-center gap-3">
            <PageActionButton onClick={() => {
              setDetailFieldModes({});
              setDetailTreeFields(new Set());
              setDetailFullscreenField(null);
              setEditingDetailRecord({ originalUuid: null, values: createEmptyDetailRecord() });
            }}>Create new</PageActionButton>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center">
              <OcrSearchField ariaLabel={`Search records in ${detailStore.name}`} value={detailQuery} onChange={setDetailQuery} />
            </div>
            <div className="flex h-7 items-center gap-4">
              <BulkDeleteButton
                label="DELETE ALL selected data store records"
                selectedCount={selectedDetailRecords.size}
                onDelete={() => {
                  setDetailRecords(current => current.filter(record => !selectedDetailRecords.has(record.uuid)));
                  setSelectedDetailRecords(new Set());
                }}
              />
                <button type="button" onClick={() => setDetailRecords(current => current.map(record => ({ ...record })))} title="REFRESH ALL" aria-label="REFRESH ALL" className="flex h-4 w-4 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7]">
                  <RefreshCw size={16} />
                </button>
              <ColumnSettingsButton onClick={() => {
                setDetailColumns(current => current.map(column => ({
                  ...column,
                  label: formatDetailFieldLabel(column.key),
                })));
                openColumnPanel();
              }} />
            </div>
          </div>

          <div ref={tableScrollRef} className="flex min-h-0 flex-1 flex-col overflow-x-auto scrollbar-hide">
            <div className="w-max min-w-full">
              <div className="mb-2 flex h-9 w-full flex-row items-center">
                <div className="flex h-9 w-10 flex-shrink-0 items-start justify-center pt-px">
                  <button
                    type="button"
                    aria-label="Select all records"
                    aria-pressed={allDetailRecordsSelected}
                    onClick={() => setSelectedDetailRecords(allDetailRecordsSelected ? new Set() : new Set(filteredDetailRecords.map(record => record.uuid)))}
                    className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border transition-colors"
                    style={allDetailRecordsSelected
                      ? { backgroundColor: '#007EA7', borderColor: '#007EA7' }
                      : { backgroundColor: '#FFFFFF', borderColor: '#A1B6C6' }}
                  >
                    {allDetailRecordsSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
                {visibleDetailColumns.map((column, index) => (
                    <div key={column.key} className="relative flex h-9 flex-shrink-0 items-center gap-[6px] px-3" style={{ width: column.width }}>
                      <span className={`truncate font-montserrat text-[12px] font-medium leading-[18px] ${index === 0 ? 'text-[#10233A]' : 'text-[#7288A3]'}`}>
                        {formatDetailFieldLabel(column.key)}
                      </span>
                      <ColumnSortButton columnLabel={formatDetailFieldLabel(column.key)} direction={detailDirectionFor(column.key)} onDirectionChange={direction => changeDetailSort(column.key, direction)} />
                      <ResizeHandle onMouseDown={event => startResizeDetail(detailColumns.findIndex(item => item.key === column.key), event)} />
                    </div>
                ))}
                <div className="h-9 w-[82px] flex-shrink-0" />
              </div>

              {filteredDetailRecords.map((record, rowIndex) => (
                <div
                  key={record.uuid}
                  className={`flex h-10 w-full flex-row items-center rounded-lg transition-colors ${
                    rowIndex % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'
                  } hover:bg-[#E6F2F6]`}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                    <button
                      type="button"
                      aria-label={`Select record ${record.uuid}`}
                      aria-pressed={selectedDetailRecords.has(record.uuid)}
                      onClick={() => setSelectedDetailRecords(current => {
                        const next = new Set(current);
                        next.has(record.uuid) ? next.delete(record.uuid) : next.add(record.uuid);
                        return next;
                      })}
                      className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border transition-colors"
                      style={selectedDetailRecords.has(record.uuid)
                        ? { backgroundColor: '#007EA7', borderColor: '#007EA7' }
                        : { backgroundColor: '#FFFFFF', borderColor: '#A1B6C6' }}
                    >
                      {selectedDetailRecords.has(record.uuid) && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {visibleDetailColumns.map((column) => {
                    const field = column.key as DataStoreDetailField;
                    return (
                        <div key={field} className="flex h-10 flex-shrink-0 items-center overflow-hidden px-3" style={{ width: column.width }}>
                          <span className="block w-full truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]" title={record[field]}>{record[field]}</span>
                        </div>
                    );
                  })}
                  <div className="ml-auto flex w-[82px] flex-shrink-0 items-center justify-end gap-1 pr-2">
                    <button
                      type="button"
                      title="Edit"
                      aria-label={`Edit record ${record.uuid}`}
                      onClick={() => {
                        setDetailFieldModes({});
                        setDetailTreeFields(new Set());
                        setDetailFullscreenField(null);
                        setEditingDetailRecord({ originalUuid: record.uuid, values: { ...record } });
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded border border-[#D3E1EC] bg-white text-[#7288A3] transition-colors hover:border-[#007EA7] hover:text-[#007EA7]"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      data-button-family="row-delete"
                      title="DELETE"
                      aria-label={`Delete record ${record.uuid}`}
                      onClick={event => {
                        event.stopPropagation();
                        deleteDetailRecord(record.uuid);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded border-2 border-[#D3E1EC] bg-white text-[#7288A3] transition-colors hover:border-[#D64545] hover:text-[#D64545]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredDetailRecords.length === 0 && (
                <div className="flex min-h-[180px] items-center justify-center">
                  <span className="font-montserrat text-[13px] font-medium text-[#7288A3]">No records</span>
                </div>
              )}
            </div>
          </div>

          <HorizontalTableScrollbar scrollRef={tableScrollRef} />
          <div className="flex h-8 w-full items-center">
            <TablePagination currentPage={1} totalPages={1} itemCount={filteredDetailRecords.length} onPageChange={() => undefined} />
          </div>
        </div>

        {showColumnSettings && (
          <ColumnSettingsPanel
            columns={detailColumns}
            defaultColumns={DATA_STORE_DETAIL_COLUMNS}
            onSave={setDetailColumns}
            onClose={() => setShowColumnSettings(false)}
          />
        )}

        {editingDetailRecord && (
          <div className="absolute inset-0 z-[120] bg-white">
            <div
              role="dialog"
              aria-modal="true"
              aria-label={editingDetailRecord.originalUuid ? `Edit record ${editingDetailRecord.originalUuid}` : 'Create new record'}
              className="flex h-full w-full flex-col gap-6 overflow-y-auto bg-white px-9 pb-10 pt-9"
            >
              <div className="flex min-h-[46px] flex-shrink-0 flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button type="button" aria-label="Close edit record" onClick={() => setEditingDetailRecord(null)} className="text-[#7288A3] transition-colors hover:text-[#007EA7]">
                    <ArrowLeft size={22} />
                  </button>
                  <h2 className="font-montserrat text-[32px] font-semibold leading-[42px] text-[#10233A]">
                    {editingDetailRecord.originalUuid ? 'Edit data store' : 'Create data store record'}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-montserrat text-[12px] font-medium leading-[18px] text-[#7288A3]">
                <span>Data stores</span><span>/</span>
                <span>Group Management ({detailStore.name} DataStore)</span><span>/</span>
                <span>Data store details</span><span>/</span>
                <span className="text-[#10233A]">{editingDetailRecord.originalUuid ? 'Edit data store' : 'Create data store record'}</span>
              </div>

              <div className="flex flex-1 flex-col gap-6">
                {DATA_STORE_DETAIL_FIELDS.map(field => {
                  const isJsonField = field.endsWith('_json') || field === 'cl_result' || field === 'ie_result';
                  const activeMode = detailFieldModes[field] ?? 'text';
                  const lineCount = Math.max(1, editingDetailRecord.values[field].split('\n').length);
                  const treeViewEnabled = detailTreeFields.has(field);
                  const fullscreen = detailFullscreenField === field;
                  const jsonState = parseDetailJson(editingDetailRecord.values[field]);
                  return (
                    <div key={field} className="flex flex-col gap-2">
                      <div className="flex min-h-[28px] items-center justify-between gap-4">
                        <span className="flex items-center gap-2 font-montserrat text-[13px] font-semibold leading-5 text-[#10233A]">
                          {formatDetailFieldLabel(field)}
                          {activeMode === 'lines' && <ChevronUp size={14} />}
                        </span>
                        <div className="flex h-8 flex-shrink-0 items-center gap-3 px-1" role="group" aria-label={`${formatDetailFieldLabel(field)} value type`}>
                          {([
                            { mode: 'text' as const, label: 'Text', icon: <span className="font-montserrat text-[18px] font-bold leading-none">Tᵀ</span> },
                            { mode: 'lines' as const, label: 'Lines', icon: <AlignLeft size={19} /> },
                            { mode: 'json' as const, label: 'JSON', icon: <Braces size={20} /> },
                          ]).map((option, optionIndex) => {
                            const active = activeMode === option.mode;
                            return (
                              <button
                                key={option.mode}
                                type="button"
                                title={option.label}
                                aria-label={`${formatDetailFieldLabel(field)} ${option.label}`}
                                aria-pressed={active}
                                onClick={() => {
                                  setDetailFieldModes(current => ({ ...current, [field]: option.mode }));
                                  if (option.mode !== 'lines' && detailFullscreenField === field) setDetailFullscreenField(null);
                                }}
                                className={`flex h-8 w-8 items-center justify-center rounded text-[#7288A3] transition-colors ${
                                  optionIndex > 0 ? '' : ''
                                } ${active ? 'bg-[#E5EDF9] text-[#007EA7]' : 'bg-transparent hover:bg-[#F4F7F9] hover:text-[#007EA7]'}`}
                              >
                                {option.icon}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {activeMode === 'lines' ? (
                        <div className={`flex flex-col overflow-hidden border border-[#D3E1EC] bg-white ${
                          fullscreen ? 'fixed inset-6 z-[150] rounded-lg shadow-2xl' : 'min-h-[300px] rounded-sm'
                        }`}>
                          <div className="flex min-h-[250px] flex-1 bg-[#FBFCFD]">
                            <div className="flex w-12 flex-shrink-0 flex-col items-end gap-0 border-r border-[#E5EDF9] bg-[#F7F9FB] px-3 py-2 font-mono text-[13px] leading-6 text-[#173A70]">
                              {Array.from({ length: lineCount }, (_, index) => <span key={index}>{index + 1}</span>)}
                            </div>
                            <textarea
                              aria-label={`${formatDetailFieldLabel(field)} lines editor`}
                              value={editingDetailRecord.values[field]}
                              onChange={event => setEditingDetailRecord(current => current ? {
                                ...current,
                                values: { ...current.values, [field]: event.target.value },
                              } : current)}
                              className="min-h-[250px] min-w-0 flex-1 resize-none border-0 bg-[#FBFCFD] px-4 py-2 font-mono text-[13px] leading-6 text-[#10233A] outline-none"
                            />
                          </div>
                          <div className="flex h-[38px] flex-shrink-0 items-center justify-between bg-[#F1F3F4] px-3 text-[#60666B]">
                            <button
                              type="button"
                              aria-pressed={treeViewEnabled}
                              onClick={() => setDetailTreeFields(current => {
                                const next = new Set(current);
                                next.has(field) ? next.delete(field) : next.add(field);
                                return next;
                              })}
                              className="flex items-center gap-2 font-montserrat text-[12px] font-medium text-[#30373D]"
                            >
                              <span className={`relative h-[22px] w-[38px] rounded-full transition-colors ${treeViewEnabled ? 'bg-[#007EA7]' : 'bg-[#AEB4B8]'}`}>
                                <span className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${treeViewEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                              </span>
                              Tree View
                            </button>
                            <div className="flex items-center gap-4">
                              <button type="button" title="Map" aria-label={`${formatDetailFieldLabel(field)} map`} className="transition-colors hover:text-[#007EA7]"><Map size={17} /></button>
                              <button type="button" title="Search" aria-label={`${formatDetailFieldLabel(field)} search`} className="transition-colors hover:text-[#007EA7]"><Search size={17} /></button>
                              <button type="button" title="Lines" aria-label={`${formatDetailFieldLabel(field)} line options`} className="transition-colors hover:text-[#007EA7]"><AlignLeft size={17} /></button>
                              <button
                                type="button"
                                title="Copy"
                                aria-label={`${formatDetailFieldLabel(field)} copy`}
                                onClick={() => copyDetailFieldValue(field, editingDetailRecord.values[field])}
                                className="transition-colors hover:text-[#007EA7]"
                              >
                                <Copy size={17} />
                              </button>
                              <button
                                type="button"
                                title="Full screen"
                                aria-label={`${formatDetailFieldLabel(field)} full screen`}
                                aria-pressed={fullscreen}
                                onClick={() => setDetailFullscreenField(current => current === field ? null : field)}
                                className="transition-colors hover:text-[#007EA7]"
                              >
                                <Maximize size={17} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : activeMode === 'json' ? (
                        <div className={`flex flex-col overflow-hidden border border-[#D3E1EC] bg-white ${
                          fullscreen ? 'fixed inset-6 z-[150] rounded-lg shadow-2xl' : 'min-h-[340px] rounded-sm'
                        }`}>
                          <div className="relative flex min-h-[275px] flex-1 bg-[#FBFCFD]">
                            {treeViewEnabled ? (
                              <div className="min-w-0 flex-1 overflow-auto px-4 py-3">
                                <DetailJsonTree value={jsonState.parsed} />
                              </div>
                            ) : (
                              <>
                                <div className="flex w-12 flex-shrink-0 flex-col items-end border-r border-[#E5EDF9] bg-[#F7F9FB] px-3 py-2 font-mono text-[13px] leading-6 text-[#173A70]">
                                  {Array.from({ length: lineCount }, (_, index) => <span key={index}>{index + 1}</span>)}
                                </div>
                                <textarea
                                  aria-label={`${formatDetailFieldLabel(field)} JSON editor`}
                                  value={editingDetailRecord.values[field]}
                                  onChange={event => setEditingDetailRecord(current => current ? {
                                    ...current,
                                    values: { ...current.values, [field]: event.target.value },
                                  } : current)}
                                  className={`min-h-[275px] min-w-0 flex-1 resize-none border-0 bg-[#FBFCFD] px-4 py-2 font-mono text-[13px] leading-6 text-[#10233A] outline-none ${
                                    jsonState.valid ? '' : 'shadow-[inset_-4px_0_0_#F05A5A]'
                                  }`}
                                />
                              </>
                            )}
                          </div>

                          {!jsonState.valid && treeViewEnabled && (
                            <div className="flex min-h-[44px] flex-wrap items-center justify-between gap-3 bg-[#9BCB5A] px-3 py-2 font-mono text-[12px] font-semibold text-white">
                              <span>The loaded JSON document was invalid but is successfully repaired.</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingDetailRecord(current => current ? {
                                    ...current,
                                    values: { ...current.values, [field]: JSON.stringify(current.values[field]) },
                                  } : current)}
                                  className="rounded bg-white/15 px-3 py-1 transition-colors hover:bg-white/25"
                                >
                                  ✓ OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDetailTreeFields(current => {
                                    const next = new Set(current);
                                    next.delete(field);
                                    return next;
                                  })}
                                  className="rounded bg-white/15 px-3 py-1 transition-colors hover:bg-white/25"
                                >
                                  {'</>'} Repair manually instead
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex h-[38px] flex-shrink-0 items-center justify-between bg-[#F1F3F4] px-3 text-[#60666B]">
                            <button
                              type="button"
                              aria-label={`${formatDetailFieldLabel(field)} Tree View`}
                              aria-pressed={treeViewEnabled}
                              onClick={() => setDetailTreeFields(current => {
                                const next = new Set(current);
                                next.has(field) ? next.delete(field) : next.add(field);
                                return next;
                              })}
                              className="flex items-center gap-2 font-montserrat text-[12px] font-medium text-[#30373D]"
                            >
                              <span className={`relative h-[22px] w-[38px] rounded-full transition-colors ${treeViewEnabled ? 'bg-[#4D66C7]' : 'bg-[#AEB4B8]'}`}>
                                <span className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${treeViewEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                              </span>
                              Tree View
                            </button>
                            <div className="flex items-center gap-4">
                              {!treeViewEnabled && <button type="button" title="Map" aria-label={`${formatDetailFieldLabel(field)} JSON map`} className="transition-colors hover:text-[#007EA7]"><Map size={17} /></button>}
                              {!treeViewEnabled && <button type="button" title="Search" aria-label={`${formatDetailFieldLabel(field)} JSON search`} className="transition-colors hover:text-[#007EA7]"><Search size={17} /></button>}
                              <button type="button" title="Lines" aria-label={`${formatDetailFieldLabel(field)} JSON line options`} className="transition-colors hover:text-[#007EA7]"><AlignLeft size={17} /></button>
                              {!treeViewEnabled && <button type="button" title="Code" aria-label={`${formatDetailFieldLabel(field)} JSON code`} className="transition-colors hover:text-[#007EA7]"><Braces size={17} /></button>}
                              <button
                                type="button"
                                title="Copy"
                                aria-label={`${formatDetailFieldLabel(field)} JSON copy`}
                                onClick={() => copyDetailFieldValue(field, editingDetailRecord.values[field])}
                                className="transition-colors hover:text-[#007EA7]"
                              >
                                <Copy size={17} />
                              </button>
                              <button
                                type="button"
                                title="Full screen"
                                aria-label={`${formatDetailFieldLabel(field)} JSON full screen`}
                                aria-pressed={fullscreen}
                                onClick={() => setDetailFullscreenField(current => current === field ? null : field)}
                                className="transition-colors hover:text-[#007EA7]"
                              >
                                <Maximize size={17} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : isJsonField ? (
                          <textarea
                            aria-label={formatDetailFieldLabel(field)}
                            value={editingDetailRecord.values[field]}
                            onChange={event => setEditingDetailRecord(current => current ? {
                              ...current,
                              values: { ...current.values, [field]: event.target.value },
                            } : current)}
                            className="min-h-[84px] resize-y rounded-lg border border-[#D3E1EC] bg-white px-[14px] py-[10px] font-montserrat text-[13px] font-medium leading-5 text-[#10233A] outline-none transition-colors focus:border-[#007EA7]"
                          />
                        ) : (
                          <input
                            aria-label={formatDetailFieldLabel(field)}
                            type="text"
                            value={editingDetailRecord.values[field]}
                            onChange={event => setEditingDetailRecord(current => current ? {
                              ...current,
                              values: { ...current.values, [field]: event.target.value },
                            } : current)}
                            className="h-[42px] rounded-lg border border-[#D3E1EC] bg-white px-[14px] font-montserrat text-[13px] font-medium leading-5 text-[#10233A] outline-none transition-colors focus:border-[#007EA7]"
                          />
                        )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-shrink-0 justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingDetailRecord(null)}
                  className="flex h-[42px] items-center justify-center rounded-lg border-2 border-[#D3E1EC] bg-white px-4 font-montserrat text-[16px] font-semibold leading-6 text-[#7288A3] transition-colors hover:border-[#007EA7]"
                >
                  Cancel
                </button>
                <SaveButton
                  onClick={() => {
                    if (editingDetailRecord.originalUuid) {
                      setDetailRecords(current => current.map(record =>
                        record.uuid === editingDetailRecord.originalUuid ? editingDetailRecord.values : record
                      ));
                    } else {
                      setDetailRecords(current => [...current, editingDetailRecord.values]);
                    }
                    setSelectedDetailRecords(current => {
                      if (!editingDetailRecord.originalUuid || !current.has(editingDetailRecord.originalUuid) || editingDetailRecord.originalUuid === editingDetailRecord.values.uuid) return current;
                      const next = new Set(current);
                      next.delete(editingDetailRecord.originalUuid);
                      next.add(editingDetailRecord.values.uuid);
                      return next;
                    });
                    setEditingDetailRecord(null);
                  }}
                  disabled={!editingDetailRecord.values.uuid.trim()}
                />
              </div>
            </div>
          </div>
        )}

        {copiedDetailField && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[#2E8B57] px-5 py-3 font-montserrat text-[14px] font-semibold text-white shadow-lg"
          >
            <CheckCircle2 size={18} />
            {formatDetailFieldLabel(copiedDetailField)} copied successfully
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white px-9 py-14 gap-8 min-h-full relative" style={{ paddingLeft: 'clamp(24px, 5vw, 72px)', paddingRight: 'clamp(24px, 5vw, 72px)' }}>

      {/* Header */}
      <PageHeader
        title="Data stores"
        actions={rows.length > 0 ? <PageActionButton onClick={openCreatePanel}>Create new</PageActionButton> : undefined}
      />

      {/* Content */}
      <div className="flex flex-col gap-6 flex-1">

        {/* Filter bar */}
        <div className="flex-shrink-0">
          <div className="flex flex-row flex-wrap justify-between items-center gap-2">
            <div className="flex flex-row items-center gap-1 flex-1 min-w-0">
              <OcrSearchField ariaLabel="Search data stores" value={query} onChange={value => { setQuery(value); setCurrentPage(1); }} />
            </div>

            {rows.length > 0 && <div className="flex flex-row items-center p-[6px] gap-4 bg-white rounded flex-shrink-0">
              <button
                type="button"
                onClick={selectedRows.length > 0 ? deleteSelected : undefined}
                disabled={selectedRows.length === 0}
                className={`w-4 h-4 flex items-center justify-center transition-colors ${
                  selectedRows.length > 0
                    ? 'text-[#E53E3E] hover:text-[#C53030] cursor-pointer'
                    : 'text-[#7288A3] opacity-50 cursor-not-allowed'
                }`}
                title="ALL DELETE"
              >
                <Trash2 size={16} />
              </button>
              <ColumnSettingsButton onClick={openColumnPanel} />
              <button
                type="button"
                data-button-family="export"
                title="EXPORTDATA"
                aria-label="EXPORTDATA all data stores"
                onClick={() => {
                  setExportAllData(true);
                  setExportRowData(null);
                  setExportFormat('');
                  setExportFormatOpen(false);
                }}
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7]"
              >
                <Download size={16} />
              </button>
              <button onClick={() => setRows(current => current.map(row => ({ ...row })))} className="w-4 h-4 flex items-center justify-center text-[#7288A3] hover:text-[#007EA7] transition-colors" title="REFRESH ALL">
                <RefreshCw size={16} />
              </button>

            </div>}
          </div>
        </div>

        {/* Table */}
        <div ref={tableScrollRef} className="flex flex-col flex-1 overflow-x-auto scrollbar-hide">
          {/* Column headers */}
          <div className="system-table-header-row flex flex-row items-center pl-3 gap-[10px] h-5 mb-2">
            {/* Select-all checkbox */}
            <button
              type="button"
              role="checkbox"
              aria-label="Select all data stores"
              aria-checked={selectedRows.length === rows.length && rows.length > 0}
              onClick={toggleAll}
              className="flex-shrink-0 w-[18px] h-[18px] relative rounded-[4px] transition-colors"
              style={
                selectedRows.length === rows.length
                  ? { backgroundColor: '#007EA7' }
                  : { border: '1px solid #A1B6C6', backgroundColor: 'transparent' }
              }
            >
              {selectedRows.length === rows.length && (
                <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {orderedVisible.map((col) => {
              const realIndex = columnOrder.findIndex(column => column.id === col.id);
              return (
              <div key={col.id} className="relative flex flex-shrink-0 flex-row items-center gap-[6px]" style={{ width: col.width }}>
                {col.id === 'name' ? (
                  <>
                    <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#10233A]">{col.label}</span>
                    <ColumnSortButton columnLabel={col.label} direction={directionFor(col.id)} onDirectionChange={direction => { changeSort(col.id, direction); setCurrentPage(1); }} />
                    <ResizeHandle onMouseDown={(e) => startResize(realIndex, e)} />
                  </>
                ) : (
                  <>
                    <span className="font-montserrat font-medium text-[12px] leading-[18px] text-[#7288A3]">{col.label}</span>
                    <ColumnSortButton columnLabel={col.label} direction={directionFor(col.id)} onDirectionChange={direction => { changeSort(col.id, direction); setCurrentPage(1); }} />
                    <ResizeHandle onMouseDown={(e) => startResize(realIndex, e)} />
                  </>
                )}
              </div>
            )})}
          </div>

          {/* Rows */}
          <div className="flex flex-col relative">
            {sortedRows.map((row, rowIndex) => (
              <div
                key={row.id}
                className={`system-table-row flex h-10 w-max min-w-full flex-row items-center gap-[10px] rounded pl-3 ${
                  rowIndex % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'
                } group hover:bg-[#E6F2F6] transition-colors`}
              >
                {/* Row checkbox */}
                <button
                  onClick={e => { e.stopPropagation(); toggleRow(row.id); }}
                  className="flex-shrink-0 w-[18px] h-[18px] relative rounded-[4px] transition-colors"
                  style={
                    selectedRows.includes(row.id)
                      ? { backgroundColor: '#007EA7' }
                      : { border: '1px solid #A1B6C6', backgroundColor: 'transparent' }
                  }
                >
                  {selectedRows.includes(row.id) && (
                    <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                {orderedVisible.map((col) => {
                  let content: React.ReactNode;
                  if (col.id === 'name') {
                    content = (
                      <button
                        type="button"
                        onClick={() => setDetailStore(row)}
                        className="block w-full truncate text-left font-montserrat text-[12px] font-medium leading-[18px] text-[#007EA7] hover:underline focus:underline focus:outline-none"
                        title={`Open ${row.name}`}
                        aria-label={`Open data store ${row.name} ${row.id}`}
                      >
                        {row.name}
                      </button>
                    );
                  } else if (col.id === 'description') {
                    content = <span className="block truncate font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{row.description}</span>;
                  } else if (col.id === 'countOfRecords') {
                    content = <span className="font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{row.countOfRecords}</span>;
                  } else if (col.id === 'createdBy') {
                    content = <span className="font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{row.createdBy}</span>;
                  } else {
                    content = <span className="font-montserrat text-[12px] font-normal leading-[18px] text-[#10233A]">{row.creationDate}</span>;
                  }
                  return (
                    <div key={col.id} className="flex h-10 flex-shrink-0 items-center overflow-hidden" style={{ width: col.width }}>
                      {content}
                    </div>
                  );
                })}

                {/* Row actions */}
                <div className="table-row-actions flex flex-row items-center gap-2 ml-auto pr-3">
                  <button
                    type="button"
                    data-button-family="export"
                    title="EXPORT1"
                    aria-label={`EXPORT1 data store ${row.name} ${row.id}`}
                    onClick={event => {
                      event.stopPropagation();
                      setExportRowData(row);
                      setExportFormat('');
                      setExportFormatOpen(false);
                    }}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-[#D3E1EC] bg-white text-[#7288A3] transition-colors hover:border-[#007EA7] hover:text-[#007EA7]"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onNavigateToAdministration?.({ module: 'Data stores', resourceType: 'Data store', id: row.id, name: row.name });
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded border border-[#D3E1EC] bg-white text-[#7288A3]"
                    title="SECURITY ACCESS"
                    aria-label={`SECURITY ACCESS for data store ${row.name} ${row.id}`}
                  >
                    <Users size={16} className="text-[#7288A3]" />
                  </button>
                  <RowDeleteButton label={`Delete data store ${row.name} ${row.id}`} onDelete={() => deleteRow(row.id)} />
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-6 py-24">
                <div className="flex flex-col items-center gap-4">
                  <span className="font-montserrat font-semibold text-[18px] leading-6 text-center text-[#10233A]">Empty collection</span>
                  <span className="font-montserrat font-medium text-[14px] leading-5 text-center text-[#10233A]">Please provide a file with data store records</span>
                </div>
                <PageActionButton onClick={openUploadPanel}>Upload file</PageActionButton>
              </div>
            )}
          </div>

          <HorizontalTableScrollbar scrollRef={tableScrollRef} />

          {/* Pagination bar */}
          <div className="flex flex-row justify-between items-center h-8 flex-shrink-0 mt-4">

            {/* Page numbers */}
            <TablePagination currentPage={currentPage} totalPages={totalPages} itemCount={rows.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />

            {/* Items count + per page */}
            <div className="flex flex-row items-center gap-[14px]">
              <span className="font-montserrat font-normal text-[12px] leading-[18px] text-[#7288A3] whitespace-nowrap">
                {((currentPage - 1) * itemsPerPage + 1).toLocaleString()}–{Math.min(currentPage * itemsPerPage, totalItems).toLocaleString()} from {totalItems.toLocaleString()} items
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowItemsDropdown(v => !v)}
                  className="flex flex-row items-center justify-center px-3 py-[6px] gap-1 bg-white border-2 border-[#D3E1EC] rounded-md h-8 min-w-[107px]"
                >
                  <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#7288A3]">{itemsPerPage} per page</span>
                  <ChevronDown size={12} style={{ color: '#7288A3' }} />
                </button>
                {showItemsDropdown && (
                  <div className="absolute bottom-full mb-1 right-0 bg-white border border-[#D3E1EC] rounded-md shadow-sm z-10">
                    {[10, 25, 50, 100].map(opt => (
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
      </div>

      {/* Upload Modal */}
      <input ref={uploadInputRef} type="file" className="hidden" accept=".csv,.json,.xlsx,.xls,.xml,.txt" onChange={event => setUploadFile(event.target.files?.[0] ?? null)} />
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4" onClick={closeUploadPanel}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Upload data store entries"
            className="flex w-[429px] max-w-[calc(100vw-32px)] flex-col gap-6 rounded-2xl bg-white"
            style={{ boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.101961)', padding: '24px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-row justify-between items-start">
              <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#10233A]">Upload date store entries</span>
              <button type="button" title="Close" aria-label="Close upload" onClick={closeUploadPanel} className="text-[#7288A3] hover:text-[#10233A] transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Description + Browse */}
            <div className="flex flex-col items-center gap-4">
              <span className="font-montserrat font-medium text-[14px] leading-5 text-[#7288A3]">
                Please, provide a file with store records
              </span>
              <button type="button" data-system-action="true" onClick={() => uploadInputRef.current?.click()} className="flex items-center justify-center px-3 py-[6px] bg-[#007EA7] rounded-[6px] hover:bg-[#006b8f] transition-colors">
                <span className="font-montserrat font-semibold text-[14px] leading-5 text-white">Add</span>
              </button>
              {uploadFile && <span className="max-w-full truncate font-montserrat text-[12px] font-medium text-[#10233A]">{uploadFile.name}</span>}
            </div>

            {/* Format selector */}
            <div className="flex flex-col gap-2">
              <span className="font-montserrat font-semibold text-[14px] leading-5 text-[#10233A]">Choose file format</span>
              <div className="relative flex flex-col gap-[2px] rounded-[8px]">
                <button type="button" aria-haspopup="listbox" aria-expanded={uploadFormatOpen} onClick={() => setUploadFormatOpen(open => !open)} className={`flex h-[50px] flex-row items-center justify-between rounded-[8px] border bg-white px-[14px] ${uploadFormatOpen ? 'border-[#007EA7]' : 'border-[#D3E1EC]'}`}>
                  <span className="font-montserrat font-medium text-[14px] leading-5 text-[#10233A]">{uploadFormat}</span>
                  <ChevronDown size={16} className={`text-[#7288A3] transition-transform ${uploadFormatOpen ? 'rotate-180' : ''}`} />
                </button>
                {uploadFormatOpen && (
                  <div role="listbox" aria-label="Choose file format" className="absolute left-0 right-0 top-[54px] z-20 rounded-lg border border-[#D3E1EC] bg-white p-2 shadow-[0_8px_20px_rgba(161,182,198,0.35)]">
                    {['Default', 'CSV', 'JSON', 'Excel'].map(format => (
                      <button key={format} type="button" role="option" aria-selected={uploadFormat === format} onClick={() => { setUploadFormat(format); setUploadFormatOpen(false); }} className={`flex h-8 w-full items-center rounded px-2 text-left font-montserrat text-[14px] font-medium hover:bg-[#F8FDFF] ${uploadFormat === format ? 'text-[#007EA7]' : 'text-[#10233A]'}`}>{format}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-row justify-end gap-2">
              <button
                onClick={closeUploadPanel}
                className="h-[42px] flex items-center justify-center px-4 bg-white border-2 border-[#D3E1EC] rounded-[8px] hover:border-[#007EA7] transition-colors"
              >
                <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#7288A3]">Cancel</span>
              </button>
              <button
                onClick={closeUploadPanel}
                className="h-[42px] flex items-center justify-center px-4 bg-[#007EA7] rounded-[8px] hover:bg-[#006b8f] transition-colors"
              >
                <span className="font-montserrat font-semibold text-[16px] leading-6 text-white">Upload</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {(exportRowData || exportAllData) && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#10233A]/20 p-4" onMouseDown={() => { setExportRowData(null); setExportAllData(false); setExportFormat(''); setExportFormatOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-label={exportAllData ? 'EXPORTDATA all data stores' : `EXPORT1 ${exportRowData?.name ?? ''}`} className="flex w-[420px] max-w-[calc(100vw-32px)] flex-col gap-7 rounded-2xl bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.102)]" onMouseDown={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-montserrat text-[22px] font-semibold leading-8 text-[#10233A]">Export</h2>
              <button type="button" title="Close" aria-label={exportAllData ? 'Close EXPORTDATA' : 'Close EXPORT1'} onClick={() => { setExportRowData(null); setExportAllData(false); setExportFormat(''); setExportFormatOpen(false); }} className="flex h-6 w-6 items-center justify-center text-[#7288A3] hover:text-[#10233A]"><X size={24} /></button>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-montserrat text-[16px] font-semibold leading-6 text-[#10233A]">File format type <span className="text-[#E45858]">*</span></span>
              <div className="relative">
                <button type="button" aria-haspopup="listbox" aria-expanded={exportFormatOpen} onClick={() => setExportFormatOpen(open => !open)} className={`flex h-[52px] w-full items-center justify-between rounded-xl border bg-white px-4 text-left transition-colors ${exportFormatOpen ? 'border-[#007EA7]' : 'border-[#D3E1EC]'}`}>
                  <span className={`font-montserrat text-[16px] font-medium leading-6 ${exportFormat ? 'text-[#10233A]' : 'text-[#A1B6C6]'}`}>{exportFormat || 'File format type'}</span>
                  <ChevronDown size={18} className={`text-[#7288A3] transition-transform ${exportFormatOpen ? 'rotate-180' : ''}`} />
                </button>
                {exportFormatOpen && (
                  <div role="listbox" aria-label="EXPORT1 file formats" className="absolute left-0 right-0 top-[56px] z-30 rounded-xl border border-[#D3E1EC] bg-white p-2 shadow-[0_8px_20px_rgba(161,182,198,0.35)]">
                    {(['CSV', 'XLSX'] as const).map(format => {
                      const selected = exportFormat === format;
                      return (
                        <button key={format} type="button" role="option" aria-selected={selected} onClick={() => { setExportFormat(format); setExportFormatOpen(false); }} className="flex h-[42px] w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-[#F8FDFF]">
                          <span className={`flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-[6px] border ${selected ? 'border-[#007EA7] bg-[#007EA7]' : 'border-[#A1B6C6] bg-white'}`}>
                            {selected && <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </span>
                          <span className="font-montserrat text-[16px] font-medium leading-6 text-[#10233A]">{format}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <button type="button" data-system-action="true" disabled={!exportFormat} onClick={() => {
                if (!exportFormat) return;
                if (exportAllData) exportRows(rows, exportFormat, 'data-stores');
                else if (exportRowData) exportRows([exportRowData], exportFormat, `${exportRowData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'data-store'}-${exportRowData.id}`);
              }} className="flex h-[54px] items-center justify-center rounded-xl border-2 border-[#D3E1EC] bg-white px-5 font-montserrat text-[18px] font-semibold text-[#7288A3] transition-colors hover:border-[#A1B6C6] disabled:cursor-not-allowed disabled:border-[#E5E7EB] disabled:bg-[#F5F5F5] disabled:text-[#B4B6B8]">Export</button>
              <button type="button" onClick={() => { setExportRowData(null); setExportAllData(false); setExportFormat(''); setExportFormatOpen(false); }} className="flex h-[54px] items-center justify-center rounded-xl border-2 border-[#D3E1EC] bg-white px-5 font-montserrat text-[18px] font-semibold text-[#7288A3] hover:border-[#007EA7]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Panel */}
      {showEditPanel && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowEditPanel(false)}>
          <div
            className="relative h-full w-[440px] bg-white flex flex-col gap-6 px-6 pt-6 pb-8 overflow-y-auto"
            style={{ boxShadow: '-2px 0px 0px #E5EDF9' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-row justify-between items-center flex-shrink-0">
              <span className="font-montserrat font-semibold text-[22px] leading-8 text-[#10233A]">{editingRowId ? 'Edit data store' : 'Create data store'}</span>
              <button onClick={() => setShowEditPanel(false)} className="text-[#7288A3] hover:text-[#10233A] transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-5 flex-1">
              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Name <span className="text-red-500">*</span></span>
                <input
                  type="text"
                  value={editRecord.name}
                  onChange={e => setEditRecord({ ...editRecord, name: e.target.value })}
                  className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Description</span>
                <textarea
                  value={editRecord.description}
                  onChange={e => setEditRecord({ ...editRecord, description: e.target.value })}
                  className="w-full h-[80px] px-[14px] py-[11px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors resize-y"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Status</span>
                <input
                  type="text"
                  value={editRecord.status}
                  onChange={e => setEditRecord({ ...editRecord, status: e.target.value })}
                  className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Category</span>
                <input
                  type="text"
                  value={editRecord.category}
                  onChange={e => setEditRecord({ ...editRecord, category: e.target.value })}
                  className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Priority</span>
                <input
                  type="text"
                  value={editRecord.priority}
                  onChange={e => setEditRecord({ ...editRecord, priority: e.target.value })}
                  className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Assignee</span>
                <input
                  type="text"
                  value={editRecord.assignee}
                  onChange={e => setEditRecord({ ...editRecord, assignee: e.target.value })}
                  className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Due date</span>
                <input
                  type="text"
                  value={editRecord.dueDate}
                  onChange={e => setEditRecord({ ...editRecord, dueDate: e.target.value })}
                  className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-montserrat font-semibold text-[14px] leading-[140%] text-[#10233A]">Tags</span>
                <input
                  type="text"
                  value={editRecord.tags}
                  onChange={e => setEditRecord({ ...editRecord, tags: e.target.value })}
                  className="w-full h-[42px] px-[14px] bg-white border border-[#D3E1EC] rounded-lg font-montserrat font-medium text-[14px] leading-[140%] text-[#10233A] placeholder:text-[#A1B6C6] focus:outline-none focus:border-[#007EA7] transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-row justify-between items-center flex-shrink-0 mt-auto gap-4">
              <button className="h-[42px] flex items-center justify-center px-4">
                <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#7288A3] hover:text-[#10233A] transition-colors">Reset</span>
              </button>
              <div className="flex flex-row gap-2">
                <button
                  onClick={() => setShowEditPanel(false)}
                  className="h-[42px] flex items-center justify-center px-4 bg-white border-2 border-[#D3E1EC] rounded-lg hover:border-[#007EA7] transition-colors"
                >
                  <span className="font-montserrat font-semibold text-[16px] leading-6 text-[#7288A3]">Cancel</span>
                </button>
                <SaveButton onClick={saveRecord} disabled={!editRecord.name.trim()} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Settings Panel */}
      {showColumnSettings && (
        <ColumnSettingsPanel
          columns={columnOrder.map(column => ({ key: column.id, label: column.label, width: column.width, visible: visibleColumns.includes(column.id) }))}
          defaultColumns={DEFAULT_COLUMNS.map(column => ({ key: column.id, label: column.label, width: column.width, visible: true }))}
          onSave={saveColumnSettings}
          onClose={() => setShowColumnSettings(false)}
        />
      )}
    </div>
  );
}
