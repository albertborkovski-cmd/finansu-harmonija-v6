import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Maximize2,
  MessageSquare,
  Minus,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import ColumnSettingsPanel, { type ColConfig } from './ColumnSettingsPanel';
import { PageActionButton, PageHeader } from './PageHeader';
import HorizontalTableScrollbar from './HorizontalTableScrollbar';
import TablePagination from './TablePagination?v=4-footer';
import OcrSearchField from './OcrSearchField';
import { ColumnSettingsButton } from './ScopedActionButtons';
import ColumnSortButton, { useMultiColumnSort } from './ColumnSortButton';
import { recordWorkspaceHumanCorrection } from './workspaceHumanMetricsStore';
import { ResizeHandle, useColumnResize } from './useColumnResize';

type TaskStatus = 'Available' | 'In Progress' | 'Completed';
type TaskTab = 'extracted' | 'comments';

interface ProductLine {
  id: string;
  name: string;
  description: string;
  quantity: string;
  price: string;
}

type ProductFieldKey = keyof Omit<ProductLine, 'id'>;

interface WorkspaceFields {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  companyName: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  taxRate: string;
  discountRate: string;
  totalDiscount: string;
  totalAmount: string;
}

interface WorkspaceComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface DocumentTextMapping {
  text: string;
  texts?: string[];
  color: string;
  softColor: string;
  targetLabel: string;
}

export interface WorkspaceTask {
  id: string;
  name: string;
  priority: number;
  description: string;
  status: TaskStatus;
  createdBy: string;
  creationDate: string;
  documentType: string;
  sourceRunId: string;
  humanCorrected?: boolean;
  correctionCount?: number;
  lastCorrectedAt?: string;
  editStartedAt?: string;
  remainingTimeSeconds?: number;
  correctionDurationSeconds?: number;
  originalFields?: WorkspaceFields;
  originalProducts?: ProductLine[];
  documentMappings?: Record<string, DocumentTextMapping>;
  fields: WorkspaceFields;
  products: ProductLine[];
  comments: WorkspaceComment[];
}

const STORAGE_KEY = 'finansu-harmonija-v6-workspace-tasks-v6';
const ROWS_PER_PAGE = 10;
const CORRECTION_TIME_SECONDS = 30 * 60;

const EMPTY_FIELDS: WorkspaceFields = {
  invoiceNumber: 'B34870642',
  invoiceDate: '2020-08-27',
  dueDate: '2020-10-27',
  companyName: 'CME Group Inc.',
  streetAddress: '85155 Dayton Point',
  city: 'Ponta do Sol',
  zipCode: '27717',
  phoneNumber: '+62 (865) 917-9478',
  email: 'fmedicine@gmail.com',
  taxRate: '1.00',
  discountRate: '15.00',
  totalDiscount: '528.58',
  totalAmount: '2995.31',
};

const SAMPLE_PRODUCTS: ProductLine[] = [
  { id: 'product-1', name: 'Seabream whole farmed', description: 'Cloud food lake red foodlia', quantity: '18.00', price: '110.00' },
  { id: 'product-2', name: 'Oil', description: 'Energy red boost healthy', quantity: '15.00', price: '61.00' },
  { id: 'product-3', name: 'Lamb', description: 'Smack healthy vibe organic reservation organic', quantity: '18.00', price: '33.00' },
];

const SAMPLE_TASKS: WorkspaceTask[] = [
  {
    id: '15730',
    name: 'Document 1c96ac9d-83b3-4899-bc16-f80f8b7ee1ad',
    priority: 0,
    description: 'Document for idp_sample/input_1ht5good/INVOICE2-5756870642-2.pdf',
    status: 'Available',
    createdBy: 'System Queue',
    creationDate: '30.07.2026 09:59',
    documentType: 'IDP Sample Invoice',
    sourceRunId: 'RUN-001',
    fields: { ...EMPTY_FIELDS },
    products: SAMPLE_PRODUCTS.map(product => ({ ...product })),
    comments: [],
  },
  {
    id: '15729',
    name: 'Document cc1e43fa-fa78-4761-af35-6094b731694d',
    priority: 0,
    description: 'Document for idp_sample/input_1ht5good/INVOICE2-5756870642-2.pdf',
    status: 'Available',
    createdBy: 'System Queue',
    creationDate: '30.07.2026 09:20',
    documentType: 'IDP Sample Invoice',
    sourceRunId: 'RUN-002',
    fields: {
      ...EMPTY_FIELDS,
      invoiceNumber: 'INVOICE2-5756870642-2',
      invoiceDate: '2026-07-30',
      dueDate: '2026-08-29',
      totalAmount: '121.00',
    },
    products: [{ id: 'product-2', name: 'Document processing', description: 'OCR service', quantity: '1', price: '100.00' }],
    comments: [],
  },
];

const INITIAL_COLUMNS: ColConfig[] = [
  { key: 'name', label: 'Name', width: 300, visible: true },
  { key: 'priority', label: 'Priority', width: 90, visible: true },
  { key: 'description', label: 'Description', width: 380, visible: true },
  { key: 'status', label: 'Status', width: 130, visible: true },
  { key: 'createdBy', label: 'Created by', width: 150, visible: true },
  { key: 'creationDate', label: 'Creation date', width: 160, visible: true },
];

const REQUIRED_LABELS: Array<[keyof WorkspaceFields, string]> = [
  ['invoiceNumber', 'Invoice Number'],
  ['invoiceDate', 'Invoice Date'],
  ['dueDate', 'Due Date'],
  ['companyName', 'Company Name'],
  ['totalAmount', 'Total Amount'],
];

const fieldDisplayName = (key: keyof WorkspaceFields) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase());

function loadTasks(): WorkspaceTask[] {
  const preserveOriginalDocument = (task: WorkspaceTask, index: number): WorkspaceTask => {
    const sampleTask = SAMPLE_TASKS.find(sample => sample.id === task.id) ?? SAMPLE_TASKS[index];
    return {
      ...task,
      sourceRunId: task.sourceRunId || sampleTask?.sourceRunId || 'RUN-001',
      originalFields: { ...(task.originalFields ?? sampleTask?.fields ?? task.fields) },
      originalProducts: (task.originalProducts ?? sampleTask?.products ?? task.products).map(product => ({ ...product })),
    };
  };

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return SAMPLE_TASKS.map(preserveOriginalDocument);
    const parsed = JSON.parse(saved) as WorkspaceTask[];
    if (!Array.isArray(parsed) || !parsed.length) return SAMPLE_TASKS.map(preserveOriginalDocument);
    return parsed.map(preserveOriginalDocument);
  } catch {
    return SAMPLE_TASKS.map(preserveOriginalDocument);
  }
}

function CheckBox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="flex h-[18px] w-[18px] flex-shrink-0 self-center items-center justify-center rounded-[6px] transition-colors"
      style={checked ? { backgroundColor: '#007EA7' } : { backgroundColor: '#FFFFFF', border: '1px solid #A1B6C6' }}
    >
      {checked && <Check size={12} strokeWidth={2.5} className="text-white" />}
    </button>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const colors = status === 'Completed'
    ? { background: '#EAF8F1', color: '#18794E' }
    : status === 'In Progress'
      ? { background: '#FFF5DF', color: '#9A6700' }
      : { background: '#E5EDF9', color: '#4F6783' };

  return (
    <span className="inline-flex h-6 items-center rounded px-2 font-montserrat text-[12px] font-medium" style={colors}>
      {status}
    </span>
  );
}

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <label className="mb-1 block font-montserrat text-[13px] font-semibold text-[#10233A]">
      {children}{required && <span className="ml-1 text-[#D64545]">*</span>}
    </label>
  );
}

function FormField({
  label,
  value,
  required,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-[#D3E1EC] bg-white px-3 font-montserrat text-[13px] text-[#10233A] outline-none transition-colors placeholder:text-[#A1B6C6] focus:border-[#007EA7]"
      />
    </div>
  );
}

const FIELD_META: Record<keyof WorkspaceFields, { number: number; color: string; soft: string }> = {
  invoiceNumber: { number: 1, color: '#79B8F3', soft: '#E2F1FF' },
  invoiceDate: { number: 2, color: '#F28DB8', soft: '#FFE1EE' },
  dueDate: { number: 3, color: '#C68BDE', soft: '#F2DFF9' },
  companyName: { number: 4, color: '#D9C944', soft: '#FFF8BE' },
  streetAddress: { number: 5, color: '#5EC8CE', soft: '#D8F4F5' },
  city: { number: 6, color: '#EF8B8B', soft: '#FFE0E0' },
  zipCode: { number: 7, color: '#E7B45B', soft: '#FFEDCB' },
  phoneNumber: { number: 8, color: '#9B8DE5', soft: '#E7E2FF' },
  email: { number: 9, color: '#6CA8E8', soft: '#DFEDFF' },
  taxRate: { number: 10, color: '#62B982', soft: '#DDF4E5' },
  discountRate: { number: 11, color: '#B69284', soft: '#EDDFDA' },
  totalDiscount: { number: 12, color: '#63B7C2', soft: '#D9F0F3' },
  totalAmount: { number: 13, color: '#62B66D', soft: '#DFF3E2' },
};

const PRODUCT_FIELD_META: Record<ProductFieldKey, { label: string; color: string; soft: string }> = {
  name: { label: 'Name', color: '#5B8DEF', soft: '#DCEBFF' },
  description: { label: 'Description', color: '#D6A83D', soft: '#FFF0C7' },
  quantity: { label: 'Quantity', color: '#A56BD6', soft: '#EEDAFF' },
  price: { label: 'Unit cost', color: '#E27777', soft: '#FFD6D6' },
};

function HighlightedDocumentText({
  value,
  mapping,
}: {
  value: string;
  mapping?: DocumentTextMapping;
}) {
  if (!mapping?.text) return <>{value}</>;
  const mappedTexts = (mapping.texts?.length ? mapping.texts : [mapping.text])
    .map(text => text.trim())
    .filter(Boolean);
  const lowerValue = value.toLocaleLowerCase();
  const ranges = mappedTexts
    .map(text => {
      const start = lowerValue.indexOf(text.toLocaleLowerCase());
      return start < 0 ? null : { start, end: start + text.length };
    })
    .filter((range): range is { start: number; end: number } => Boolean(range))
    .sort((left, right) => left.start - right.start)
    .filter((range, index, allRanges) => index === 0 || range.start >= allRanges[index - 1].end);
  if (ranges.length === 0) return <>{value}</>;

  const content: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((range, index) => {
    if (range.start > cursor) content.push(value.slice(cursor, range.start));
    content.push(
      <mark
        key={`${range.start}-${range.end}-${index}`}
        title={`Mapped to ${mapping.targetLabel}`}
        className="rounded-sm px-0.5 text-inherit"
        style={{ backgroundColor: mapping.softColor, boxShadow: `inset 0 -2px 0 ${mapping.color}` }}
      >
        {value.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });
  if (cursor < value.length) content.push(value.slice(cursor));
  return (
    <>{content}</>
  );
}

function documentTextValue(children: React.ReactNode): string {
  if (Array.isArray(children)) return children.map(documentTextValue).join('');
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return '';
}

function MappedFormField({
  fieldKey,
  label,
  value,
  required,
  type = 'text',
  active,
  onSelect,
  onChange,
}: {
  fieldKey: keyof WorkspaceFields;
  label: string;
  value: string;
  required?: boolean;
  type?: string;
  active: boolean;
  onSelect: () => void;
  onChange: (value: string) => void;
}) {
  const meta = FIELD_META[fieldKey];
  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white transition-all ${active ? 'shadow-[0_0_0_2px_rgba(0,126,167,0.18)]' : ''}`}
      style={{ borderColor: active ? '#007EA7' : '#D3E1EC' }}
      onClick={onSelect}
    >
      <div className="flex h-8 items-center justify-between px-3" style={{ backgroundColor: meta.soft }}>
        <span className="font-montserrat text-[12px] font-semibold text-[#10233A]">
          {label}{required && <span className="ml-1 text-[#D64545]">*</span>}
        </span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-montserrat text-[11px] font-semibold text-white" style={{ backgroundColor: meta.color }}>
          {meta.number}
        </span>
      </div>
      <div className="flex items-center gap-2 p-2">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded font-montserrat text-[14px] font-semibold text-[#10233A]" style={{ backgroundColor: meta.soft }}>Tᵀ</span>
        <input
          type={type}
          aria-label={label}
          value={value}
          onFocus={onSelect}
          onChange={event => onChange(event.target.value)}
          className="h-8 min-w-0 flex-1 rounded border border-[#D3E1EC] bg-white px-2 font-montserrat text-[13px] text-[#10233A] outline-none transition-colors focus:border-[#007EA7]"
        />
      </div>
    </div>
  );
}

function DocumentAnnotation({
  fieldKey,
  activeField,
  plain = false,
  mapping,
  children,
}: {
  fieldKey: keyof WorkspaceFields;
  activeField: string;
  onSelect: (key: string) => void;
  plain?: boolean;
  mapping?: DocumentTextMapping;
  children: React.ReactNode;
}) {
  const value = documentTextValue(children);
  const sourceId = `field:${fieldKey}`;
  if (plain) return <span className="cursor-text" data-ocr-id={sourceId} data-ocr-value={value}><HighlightedDocumentText value={value} mapping={mapping} /></span>;
  const meta = FIELD_META[fieldKey];
  const active = activeField === fieldKey;
  return (
    <span
      className={`relative inline-flex cursor-text items-center rounded px-1 py-0.5 text-left transition-all ${active ? 'z-20 scale-[1.04] shadow-[0_0_0_3px_#007EA7,0_0_0_6px_rgba(255,255,255,0.9)]' : ''}`}
      style={{ backgroundColor: meta.soft }}
    >
      <span data-ocr-id={sourceId} data-ocr-value={value}><HighlightedDocumentText value={value} mapping={mapping} /></span>
      <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-montserrat text-[9px] font-bold text-white" style={{ backgroundColor: meta.color }}>
        {meta.number}
      </span>
    </span>
  );
}

function MappedProductField({
  product,
  index,
  fieldKey,
  active,
  onSelect,
  onChange,
}: {
  product: ProductLine;
  index: number;
  fieldKey: ProductFieldKey;
  active: boolean;
  onSelect: () => void;
  onChange: (value: string) => void;
}) {
  const meta = PRODUCT_FIELD_META[fieldKey];
  const required = fieldKey === 'name' || fieldKey === 'price';
  return (
    <label
      className={`block overflow-hidden rounded-lg border bg-white transition-all ${active ? 'shadow-[0_0_0_2px_rgba(0,126,167,0.16)]' : ''}`}
      style={{ borderColor: active ? '#007EA7' : '#D3E1EC' }}
      onClick={onSelect}
    >
      <span className="flex h-7 items-center justify-between px-2.5" style={{ backgroundColor: meta.soft }}>
        <span className="font-montserrat text-[11px] font-semibold text-[#10233A]">
          {meta.label}{required && <span className="ml-1 text-[#D64545]">*</span>}
        </span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-montserrat text-[10px] font-bold text-white" style={{ backgroundColor: meta.color }}>
          {index + 1}
        </span>
      </span>
      {fieldKey === 'description' ? (
        <textarea
          aria-label={`Product ${index + 1} description`}
          value={product.description}
          rows={2}
          onFocus={onSelect}
          onChange={event => onChange(event.target.value)}
          className="min-h-[54px] w-full resize-none border-0 bg-white px-2.5 py-2 font-montserrat text-[12px] leading-4 text-[#10233A] outline-none"
        />
      ) : (
        <input
          aria-label={`Product ${index + 1} ${fieldKey === 'price' ? 'price' : fieldKey}`}
          value={product[fieldKey]}
          inputMode={fieldKey === 'price' || fieldKey === 'quantity' ? 'decimal' : undefined}
          onFocus={onSelect}
          onChange={event => onChange(event.target.value)}
          className="h-9 w-full border-0 bg-white px-2.5 font-montserrat text-[12px] text-[#10233A] outline-none"
        />
      )}
    </label>
  );
}

function ProductDocumentAnnotation({
  productId,
  fieldKey,
  index,
  activeProductField,
  plain = false,
  mapping,
  children,
}: {
  productId: string;
  fieldKey: ProductFieldKey;
  index: number;
  activeProductField: string;
  onSelect: (key: string) => void;
  plain?: boolean;
  mapping?: DocumentTextMapping;
  children: React.ReactNode;
}) {
  const value = documentTextValue(children) || '—';
  const sourceId = `product:${productId}:${fieldKey}`;
  if (plain) return <span className="cursor-text" data-ocr-id={sourceId} data-ocr-value={value}><HighlightedDocumentText value={value} mapping={mapping} /></span>;
  const meta = PRODUCT_FIELD_META[fieldKey];
  const key = `${productId}:${fieldKey}`;
  const active = activeProductField === key;
  return (
    <span
      className={`relative inline-flex max-w-full cursor-text items-center rounded px-1 py-0.5 text-left transition-all ${active ? 'z-10 shadow-[0_0_0_2px_#007EA7]' : ''}`}
      style={{ backgroundColor: meta.soft }}
    >
      <span className="truncate" data-ocr-id={sourceId} data-ocr-value={value}><HighlightedDocumentText value={value} mapping={mapping} /></span>
      <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-montserrat text-[9px] font-bold text-white" style={{ backgroundColor: meta.color }}>
        {index + 1}
      </span>
    </span>
  );
}

function InvoicePreview({
  zoom,
  fields,
  products,
  activeField,
  activeProductField,
  onSelectField,
  onSelectProductField,
  trainingMode = false,
  onAreaExtract,
  onTextExtract,
  documentMappings = {},
}: {
  zoom: number;
  fields: WorkspaceFields;
  products: ProductLine[];
  activeField: string;
  activeProductField: string;
  onSelectField: (key: string) => void;
  onSelectProductField: (key: string) => void;
  trainingMode?: boolean;
  onAreaExtract?: () => void;
  onTextExtract?: (value: string, sourceId: string) => void;
  documentMappings?: Record<string, DocumentTextMapping>;
}) {
  const articleRef = useRef<HTMLElement>(null);
  const [selection, setSelection] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const scale = zoom / 100;

  const pointerPosition = (event: React.PointerEvent<HTMLElement>) => {
    const bounds = articleRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return { x: (event.clientX - bounds.left) / scale, y: (event.clientY - bounds.top) / scale };
  };

  const wordAtPoint = (targetElement: HTMLElement | null, clientX: number) => {
    const valueElement = targetElement?.closest<HTMLElement>('[data-ocr-id]');
    const sourceValue = valueElement?.dataset.ocrValue?.trim();
    if (!valueElement || !sourceValue) return '';
    const bounds = valueElement.getBoundingClientRect();
    const ratio = bounds.width > 0 ? Math.min(0.999, Math.max(0, (clientX - bounds.left) / bounds.width)) : 0;
    const characterIndex = Math.floor(ratio * sourceValue.length);
    const words = Array.from(sourceValue.matchAll(/\S+/g));
    const selectedWord = words.find(match => {
      const start = match.index ?? 0;
      return characterIndex >= start && characterIndex < start + match[0].length;
    }) ?? words.reduce((nearest, match) => {
      if (!nearest) return match;
      const nearestDistance = Math.abs((nearest.index ?? 0) - characterIndex);
      const currentDistance = Math.abs((match.index ?? 0) - characterIndex);
      return currentDistance < nearestDistance ? match : nearest;
    }, words[0]);
    return selectedWord?.[0] ?? sourceValue;
  };

  const copyNativeSelection = (target: EventTarget | null, fallbackClientX?: number) => {
    window.setTimeout(() => {
      const browserSelection = window.getSelection();
      const selectedText = browserSelection?.toString().replace(/\s+/g, ' ').trim();
      const targetElement = target instanceof HTMLElement ? target : null;
      const anchorElement = browserSelection?.anchorNode instanceof HTMLElement
        ? browserSelection.anchorNode
        : browserSelection?.anchorNode?.parentElement;
      const valueElement = targetElement?.closest<HTMLElement>('[data-ocr-id]')
        ?? anchorElement?.closest<HTMLElement>('[data-ocr-id]');
      const sourceId = valueElement?.dataset.ocrId;
      const sourceValue = valueElement?.dataset.ocrValue?.trim();
      const fallbackWord = fallbackClientX === undefined ? '' : wordAtPoint(targetElement, fallbackClientX);
      const extractedText = selectedText || fallbackWord;
      if (!extractedText) return;
      const mappedText = sourceValue && extractedText.toLocaleLowerCase().includes(sourceValue.toLocaleLowerCase())
        ? sourceValue
        : extractedText;
      if (sourceId) onTextExtract?.(mappedText, sourceId);
    }, 0);
  };

  return (
    <div className="flex min-h-[760px] items-start justify-center overflow-auto rounded-b-lg bg-[#AEB3B7] p-6 xl:p-8">
      <article
        ref={articleRef}
        className={`relative min-h-[900px] w-[680px] origin-top bg-white px-14 py-12 text-[#222222] shadow-[0_12px_38px_rgba(16,35,58,0.24)] transition-transform selection:bg-[#BFDFFF] selection:text-[#10233A] ${trainingMode ? 'cursor-crosshair' : ''}`}
        style={{ transform: `scale(${zoom / 100})` }}
        aria-label={trainingMode ? 'Invoice document training canvas' : 'Uploaded invoice with OCR annotations'}
        onPointerDown={trainingMode ? event => {
          if (event.detail > 1) return;
          const textTarget = event.target instanceof HTMLElement
            ? event.target.closest('[data-ocr-id]')
            : null;
          if (textTarget) return;
          const point = pointerPosition(event);
          event.currentTarget.setPointerCapture(event.pointerId);
          setSelection({ startX: point.x, startY: point.y, x: point.x, y: point.y });
        } : undefined}
        onPointerMove={trainingMode ? event => {
          if (!selection) return;
          const point = pointerPosition(event);
          setSelection(current => current ? { ...current, x: point.x, y: point.y } : current);
        } : undefined}
        onPointerUp={trainingMode ? event => {
          if (!selection) return;
          const point = pointerPosition(event);
          const width = Math.abs(point.x - selection.startX);
          const height = Math.abs(point.y - selection.startY);
          setSelection(null);
          if (width >= 8 && height >= 8) onAreaExtract?.();
        } : undefined}
        onMouseUp={event => copyNativeSelection(event.target)}
        onDoubleClick={event => copyNativeSelection(event.target, event.clientX)}
      >
        {trainingMode && selection && (
          <div
            aria-label="Selected document area"
            className="pointer-events-none absolute z-30 border-2 border-dashed border-[#007EA7] bg-[#007EA7]/10"
            style={{
              left: Math.min(selection.startX, selection.x),
              top: Math.min(selection.startY, selection.y),
              width: Math.abs(selection.x - selection.startX),
              height: Math.abs(selection.y - selection.startY),
            }}
          />
        )}
        <div className="flex justify-end font-montserrat text-[10px]">
          <span>I.N.: </span>
          <DocumentAnnotation plain={trainingMode} fieldKey="invoiceNumber" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:invoiceNumber']}>{fields.invoiceNumber}</DocumentAnnotation>
        </div>
        <div className="mt-8 flex items-start justify-between">
          <div>
            <h2 className="font-montserrat text-[34px] font-medium tracking-wide">INVOICE</h2>
            <div className="mt-6 flex gap-7 font-montserrat text-[10px]">
              <div><p className="mb-1 font-semibold uppercase text-[#7288A3]">Date of issue</p><DocumentAnnotation plain={trainingMode} fieldKey="invoiceDate" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:invoiceDate']}>{fields.invoiceDate}</DocumentAnnotation></div>
              <div><p className="mb-1 font-semibold uppercase text-[#7288A3]">Due date</p><DocumentAnnotation plain={trainingMode} fieldKey="dueDate" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:dueDate']}>{fields.dueDate}</DocumentAnnotation></div>
            </div>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#28B7D8] via-[#007EA7] to-[#63B342] text-[18px] font-bold text-white shadow-md">FH</div>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-12 font-montserrat text-[10px] leading-5">
          <div>
            <p className="font-semibold uppercase text-[#7288A3]">Billed to</p>
            <p><DocumentAnnotation plain={trainingMode} fieldKey="companyName" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:companyName']}>{fields.companyName}</DocumentAnnotation></p>
            <p><DocumentAnnotation plain={trainingMode} fieldKey="streetAddress" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:streetAddress']}>{fields.streetAddress}</DocumentAnnotation></p>
            <p><DocumentAnnotation plain={trainingMode} fieldKey="city" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:city']}>{fields.city}</DocumentAnnotation>{' '}<DocumentAnnotation plain={trainingMode} fieldKey="zipCode" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:zipCode']}>{fields.zipCode}</DocumentAnnotation></p>
          </div>
          <div>
            <p className="text-[14px] font-medium">Chicago Park City Group</p><p>9 Birchwood Alley</p><p>Chicago, 964785</p>
            <p><DocumentAnnotation plain={trainingMode} fieldKey="phoneNumber" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:phoneNumber']}>{fields.phoneNumber}</DocumentAnnotation></p>
            <p><DocumentAnnotation plain={trainingMode} fieldKey="email" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:email']}>{fields.email}</DocumentAnnotation></p><p>https://parkcity.com</p>
          </div>
        </div>
        <div className="mt-10 font-montserrat text-[10px]">
          <div className="grid grid-cols-[1fr_92px_70px_82px] border-b-2 border-black pb-1 font-semibold uppercase text-[#7288A3]"><span>Description</span><span>Unit cost</span><span>Qty</span><span className="text-right">Amount</span></div>
          {products.slice(0, 3).map((product, index) => (
            <div key={product.id} className="grid min-h-[62px] grid-cols-[1fr_92px_70px_82px] items-start border-b border-[#333333] py-2.5">
              <div className="flex min-w-0 flex-col items-start gap-1 pr-5">
                <ProductDocumentAnnotation plain={trainingMode} productId={product.id} fieldKey="name" index={index} activeProductField={activeProductField} onSelect={onSelectProductField} mapping={documentMappings[`product:${product.id}:name`]}>{product.name}</ProductDocumentAnnotation>
                <ProductDocumentAnnotation plain={trainingMode} productId={product.id} fieldKey="description" index={index} activeProductField={activeProductField} onSelect={onSelectProductField} mapping={documentMappings[`product:${product.id}:description`]}>{product.description}</ProductDocumentAnnotation>
              </div>
              <div><ProductDocumentAnnotation plain={trainingMode} productId={product.id} fieldKey="price" index={index} activeProductField={activeProductField} onSelect={onSelectProductField} mapping={documentMappings[`product:${product.id}:price`]}>${product.price}</ProductDocumentAnnotation></div>
              <div><ProductDocumentAnnotation plain={trainingMode} productId={product.id} fieldKey="quantity" index={index} activeProductField={activeProductField} onSelect={onSelectProductField} mapping={documentMappings[`product:${product.id}:quantity`]}>{product.quantity}</ProductDocumentAnnotation></div>
              <span className="text-right">${(Number(product.quantity || 0) * Number(product.price || 0)).toFixed(2)}</span>
            </div>
          ))}
          {[1, 2, 3].map(line => <div key={line} className="h-8 border-b border-[#A1B6C6]" />)}
        </div>
        <div className="mt-8 grid grid-cols-[1fr_180px] gap-8 font-montserrat">
          <div><p className="text-[9px] font-semibold uppercase text-[#7288A3]">Invoice total</p><p className="text-[27px]">$ {fields.totalAmount}</p></div>
          <div className="space-y-2 text-[9px]">
            <div className="flex justify-between"><strong>SUBTOTAL</strong><span>$ 3489.00</span></div>
            <div className="flex justify-between"><strong>DISCOUNT RATE</strong><DocumentAnnotation plain={trainingMode} fieldKey="discountRate" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:discountRate']}>{fields.discountRate}%</DocumentAnnotation></div>
            <div className="flex justify-between"><strong>DISCOUNT</strong><DocumentAnnotation plain={trainingMode} fieldKey="totalDiscount" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:totalDiscount']}>$ {fields.totalDiscount}</DocumentAnnotation></div>
            <div className="flex justify-between"><strong>TAX RATE</strong><DocumentAnnotation plain={trainingMode} fieldKey="taxRate" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:taxRate']}>{fields.taxRate}%</DocumentAnnotation></div>
            <div className="flex justify-between border-t border-[#D3E1EC] pt-2 text-[11px]"><strong>TOTAL</strong><DocumentAnnotation plain={trainingMode} fieldKey="totalAmount" activeField={activeField} onSelect={onSelectField} mapping={documentMappings['field:totalAmount']}>$ {fields.totalAmount}</DocumentAnnotation></div>
          </div>
        </div>
        <div className="mt-10 font-montserrat text-[9px]"><strong className="block uppercase text-[#7288A3]">Terms</strong>Please pay within 30 days. Products have 5-year warranty.</div>
      </article>
    </div>
  );
}

function WorkspaceSettings({
  settings,
  onChange,
  onClose,
}: {
  settings: Record<string, boolean>;
  onChange: (key: string) => void;
  onClose: () => void;
}) {
  const options: Array<[string, string]> = [
    ['groupByType', 'Group by Document Type'],
    ['hideSkipped', 'Hide Skipped'],
    ['showEmptyTypes', 'Show Empty Document Types'],
    ['showCompleted', 'Show Completed Tasks'],
  ];

  return (
    <>
      <button aria-label="Close Workspace settings" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={onClose} />
      <div className="fixed right-[72px] top-[108px] z-50 w-[290px] rounded-lg border border-[#D3E1EC] bg-white p-4 shadow-[0_12px_32px_rgba(16,35,58,0.16)]">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-montserrat text-[14px] font-semibold text-[#10233A]">Workspace settings</span>
          <button type="button" aria-label="Close settings" onClick={onClose} className="text-[#7288A3] hover:text-[#10233A]"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          {options.map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <CheckBox checked={settings[key]} onChange={() => onChange(key)} label={label} />
              <span className="font-montserrat text-[13px] text-[#10233A]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function WorkspaceTaskDetail({
  task,
  onBack,
  onUpdate,
  sequentialMode = false,
  queuePosition = 1,
  queueTotal = 1,
  onContinue,
  onComplete,
  trainingMode = false,
  onNextFile,
}: {
  task: WorkspaceTask;
  onBack: () => void;
  onUpdate: (task: WorkspaceTask, returnToList?: boolean) => void;
  sequentialMode?: boolean;
  queuePosition?: number;
  queueTotal?: number;
  onContinue?: (task: WorkspaceTask) => void;
  onComplete: (task: WorkspaceTask) => void | Promise<void>;
  trainingMode?: boolean;
  onNextFile?: (task: WorkspaceTask) => void;
}) {
  const [draft, setDraft] = useState<WorkspaceTask>(task);
  const originalDocumentRef = useRef({
    taskId: task.id,
    fields: { ...(task.originalFields ?? task.fields) },
    products: (task.originalProducts ?? task.products).map(product => ({ ...product })),
  });
  if (originalDocumentRef.current.taskId !== task.id) {
    originalDocumentRef.current = {
      taskId: task.id,
      fields: { ...(task.originalFields ?? task.fields) },
      products: (task.originalProducts ?? task.products).map(product => ({ ...product })),
    };
  }
  const [activeTab, setActiveTab] = useState<TaskTab>('extracted');
  const [zoom, setZoom] = useState(90);
  const [fullScreen, setFullScreen] = useState(false);
  const [comment, setComment] = useState('');
  const [showValidation, setShowValidation] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');
  const [activeField, setActiveField] = useState<keyof WorkspaceFields | ''>(trainingMode ? '' : 'invoiceNumber');
  const [activeProductField, setActiveProductField] = useState('');
  const [remainingTime, setRemainingTime] = useState(() => {
    if (!task.editStartedAt) return task.remainingTimeSeconds ?? CORRECTION_TIME_SECONDS;
    const elapsed = Math.floor((Date.now() - new Date(task.editStartedAt).getTime()) / 1000);
    return Math.max(0, CORRECTION_TIME_SECONDS - elapsed);
  });
  const [timerRunning, setTimerRunning] = useState(!trainingMode && task.status !== 'Completed');

  useEffect(() => {
    setDraft(task);
    const elapsed = task.editStartedAt
      ? Math.floor((Date.now() - new Date(task.editStartedAt).getTime()) / 1000)
      : 0;
    setRemainingTime(Math.max(0, task.editStartedAt ? CORRECTION_TIME_SECONDS - elapsed : task.remainingTimeSeconds ?? CORRECTION_TIME_SECONDS));
    setTimerRunning(!trainingMode && task.status !== 'Completed');
  }, [task, trainingMode]);

  useEffect(() => {
    if (!timerRunning) return;
    const startedAt = task.editStartedAt ? new Date(task.editStartedAt).getTime() : Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const nextRemaining = Math.max(0, CORRECTION_TIME_SECONDS - elapsed);
      setRemainingTime(nextRemaining);
      if (nextRemaining === 0) setTimerRunning(false);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [task.editStartedAt, timerRunning]);

  const formattedRemainingTime = `${String(Math.floor(remainingTime / 60)).padStart(2, '0')}:${String(remainingTime % 60).padStart(2, '0')}`;

  const missingFields = REQUIRED_LABELS
    .filter(([key]) => !draft.fields[key].trim())
    .map(([, label]) => label);
  const missingProducts = draft.products.some(product => !product.name.trim() || !product.price.trim());
  const canComplete = draft.status === 'In Progress' && missingFields.length === 0 && !missingProducts;

  const changeField = (key: keyof WorkspaceFields, value: string) => {
    setDraft(current => ({ ...current, fields: { ...current.fields, [key]: value } }));
    setActiveField(key);
    setActiveProductField('');
    setShowValidation(true);
  };

  const updateProduct = (id: string, key: keyof Omit<ProductLine, 'id'>, value: string) => {
    setDraft(current => ({
      ...current,
      products: current.products.map(product => product.id === id ? { ...product, [key]: value } : product),
    }));
    setShowValidation(true);
  };

  const selectMappedField = (key: keyof WorkspaceFields) => {
    setActiveField(key);
    setActiveProductField('');
  };

  const selectProductField = (key: string) => {
    setActiveProductField(key);
    setActiveField('');
  };

  const acceptTask = () => {
    const next = { ...draft, status: 'In Progress' as TaskStatus };
    setDraft(next);
    onUpdate(next);
    setSavedMessage('Task accepted. You can now update and complete it.');
  };

  const saveHumanCorrection = () => {
    if (trainingMode) {
      onUpdate(draft);
      setSavedMessage('Document training mappings saved successfully.');
      return;
    }
    const savedAt = new Date().toISOString();
    const next: WorkspaceTask = {
      ...draft,
      status: 'In Progress',
      humanCorrected: true,
      correctionCount: (draft.correctionCount ?? 0) + 1,
      lastCorrectedAt: savedAt,
      remainingTimeSeconds: remainingTime,
      correctionDurationSeconds: CORRECTION_TIME_SECONDS - remainingTime,
    };
    setDraft(next);
    recordWorkspaceHumanCorrection(next.id, next.sourceRunId);
    if (sequentialMode && onContinue) {
      onContinue(next);
      return;
    }
    onUpdate(next);
    setSavedMessage(`OCR corrections saved. Human processed documents for ${next.sourceRunId} were updated.`);
  };

  const saveAndOpenNextFile = () => {
    if (!trainingMode || !onNextFile) return;
    onNextFile(draft);
  };

  const completeTask = () => {
    if (!canComplete) {
      setShowValidation(true);
      return;
    }
    const next = {
      ...draft,
      status: 'Completed' as TaskStatus,
      humanCorrected: true,
      correctionCount: (draft.correctionCount ?? 0) + 1,
      lastCorrectedAt: new Date().toISOString(),
      remainingTimeSeconds: remainingTime,
      correctionDurationSeconds: CORRECTION_TIME_SECONDS - remainingTime,
    };
    setTimerRunning(false);
    recordWorkspaceHumanCorrection(next.id, next.sourceRunId);
    onComplete(next);
  };

  const addComment = () => {
    if (!comment.trim()) return;
    const next = {
      ...draft,
      comments: [
        ...draft.comments,
        {
          id: `comment-${Date.now()}`,
          author: 'Albert',
          text: comment.trim(),
          createdAt: new Date().toLocaleString('lt-LT'),
        },
      ],
    };
    setDraft(next);
    onUpdate(next);
    setComment('');
    setSavedMessage('Comment added successfully.');
  };

  const applyTrainingSelection = () => {
    if (activeField) {
      const extractedValue = EMPTY_FIELDS[activeField];
      setDraft(current => ({ ...current, fields: { ...current.fields, [activeField]: extractedValue } }));
      setSavedMessage(`Selected document area assigned to ${fieldDisplayName(activeField)}.`);
      return;
    }
    if (activeProductField) {
      const [productId, productField] = activeProductField.split(':') as [string, ProductFieldKey];
      const sourceProduct = SAMPLE_PRODUCTS.find(product => product.id === productId);
      if (sourceProduct) {
        setDraft(current => ({
          ...current,
          products: current.products.map(product => product.id === productId ? { ...product, [productField]: sourceProduct[productField] } : product),
        }));
        setSavedMessage(`Selected document area assigned to product ${productField}.`);
      }
      return;
    }
    setSavedMessage('Select a field first, then drag over its value in the document.');
  };

  const applySelectedDocumentText = (selectedText: string, sourceId: string) => {
    if (activeField) {
      const meta = FIELD_META[activeField];
      const targetLabel = fieldDisplayName(activeField);
      setDraft(current => ({
        ...(() => {
          const existing = current.documentMappings?.[sourceId];
          const previousTexts = existing?.targetLabel === targetLabel
            ? (existing.texts?.length ? existing.texts : [existing.text])
            : [];
          const normalizedSelection = selectedText.trim();
          const alreadyIncluded = previousTexts.some(text =>
            text.toLocaleLowerCase().includes(normalizedSelection.toLocaleLowerCase()),
          );
          const nextTexts = alreadyIncluded
            ? previousTexts
            : [
                ...previousTexts.filter(text =>
                  !normalizedSelection.toLocaleLowerCase().includes(text.toLocaleLowerCase()),
                ),
                normalizedSelection,
              ];
          const combinedValue = nextTexts.join(' ').replace(/\s+/g, ' ').trim();
          return {
            ...current,
            fields: { ...current.fields, [activeField]: combinedValue },
            documentMappings: {
              ...current.documentMappings,
              [sourceId]: {
                text: combinedValue,
                texts: nextTexts,
                color: meta.color,
                softColor: meta.soft,
                targetLabel,
              },
            },
          };
        })(),
      }));
      setSavedMessage(`Selected document text copied to ${targetLabel}.`);
      return;
    }
    if (activeProductField) {
      const [productId, productField] = activeProductField.split(':') as [string, ProductFieldKey];
      const meta = PRODUCT_FIELD_META[productField];
      const targetLabel = `Product ${meta.label}`;
      setDraft(current => ({
        ...(() => {
          const existing = current.documentMappings?.[sourceId];
          const previousTexts = existing?.targetLabel === targetLabel
            ? (existing.texts?.length ? existing.texts : [existing.text])
            : [];
          const normalizedSelection = selectedText.trim();
          const alreadyIncluded = previousTexts.some(text =>
            text.toLocaleLowerCase().includes(normalizedSelection.toLocaleLowerCase()),
          );
          const nextTexts = alreadyIncluded
            ? previousTexts
            : [
                ...previousTexts.filter(text =>
                  !normalizedSelection.toLocaleLowerCase().includes(text.toLocaleLowerCase()),
                ),
                normalizedSelection,
              ];
          const combinedValue = nextTexts.join(' ').replace(/\s+/g, ' ').trim();
          return {
            ...current,
            products: current.products.map(product => product.id === productId ? { ...product, [productField]: combinedValue } : product),
            documentMappings: {
              ...current.documentMappings,
              [sourceId]: {
                text: combinedValue,
                texts: nextTexts,
                color: meta.color,
                softColor: meta.soft,
                targetLabel,
              },
            },
          };
        })(),
      }));
      setSavedMessage(`Selected document text copied to product ${PRODUCT_FIELD_META[productField].label}.`);
      return;
    }
    setSavedMessage('Select a field on the right first, then double-click text in the document.');
  };

  return (
    <div className="flex min-h-full flex-col gap-6 bg-white px-[72px] py-14">
      <PageHeader
        title={trainingMode ? 'Document training' : 'Human task'}
        leading={
          <button type="button" aria-label={trainingMode ? 'Back to Documents' : 'Back to Workspace'} onClick={onBack} className="text-[#7288A3] transition-colors hover:text-[#007EA7]">
            <ArrowLeft size={20} />
          </button>
        }
        actions={
          <>
            {!trainingMode && <div className="mr-2 flex h-8 items-center gap-2 rounded-md border border-[#D3E1EC] bg-[#F8FDFF] px-3 font-montserrat">
              <span className="text-[12px] font-medium text-[#7288A3]">Remaining time</span>
              <span aria-label="Remaining correction time" className={`min-w-[44px] text-right text-[13px] font-semibold tabular-nums ${remainingTime <= 300 ? 'text-[#D64545]' : 'text-[#10233A]'}`}>{formattedRemainingTime}</span>
            </div>}
            {!trainingMode && draft.status === 'Available' && <PageActionButton onClick={acceptTask}>Accept task</PageActionButton>}
            {(trainingMode || draft.status === 'In Progress') && <PageActionButton onClick={saveHumanCorrection}>Save</PageActionButton>}
            {trainingMode && <PageActionButton onClick={saveAndOpenNextFile} disabled={!onNextFile}>Next file</PageActionButton>}
            {!trainingMode && draft.status !== 'Completed' && <PageActionButton onClick={completeTask} disabled={!canComplete}>Complete task</PageActionButton>}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 font-montserrat text-[12px] text-[#7288A3]">
        <button type="button" onClick={onBack} className="hover:text-[#007EA7]">{trainingMode ? 'Document sets / Documents' : 'Workspace'}</button>
        <span>/</span>
        <span className="max-w-[680px] truncate text-[#10233A]">{draft.name}</span>
        {trainingMode && queueTotal > 1 && (
          <span className="rounded-full bg-[#E5EDF9] px-2.5 py-1 font-semibold text-[#7288A3]">File {queuePosition} of {queueTotal}</span>
        )}
        {!trainingMode && <StatusBadge status={draft.status} />}
      </div>

      {trainingMode && (
        <div className="rounded-lg border border-[#B8D7E5] bg-[#F0FAFD] px-4 py-3 font-montserrat">
          <p className="text-[13px] font-semibold text-[#10233A]">Train document field location</p>
          <p className="text-[12px] text-[#7288A3]">Select a field on the right, then double-click its text in the document or drag over the matching area. The selected value will be assigned to that field.</p>
        </div>
      )}

      {sequentialMode && (
        <div className="flex items-center justify-between rounded-lg border border-[#B8D7E5] bg-[#F0FAFD] px-4 py-3 font-montserrat">
          <div>
            <p className="text-[13px] font-semibold text-[#10233A]">OCR human correction queue</p>
            <p className="text-[12px] text-[#7288A3]">After Save, the next document opens automatically.</p>
          </div>
          <span className="rounded-full bg-[#007EA7] px-3 py-1 text-[12px] font-semibold text-white">{queuePosition} / {queueTotal}</span>
        </div>
      )}

      {!trainingMode && showValidation && (missingFields.length > 0 || missingProducts) && (
        <div role="alert" className="rounded-lg border border-[#F0C2C2] bg-[#FFF5F5] px-4 py-3 font-montserrat text-[13px] text-[#A23B3B]">
          {missingFields.map(label => <p key={label}>The {label} is required.</p>)}
          {missingProducts && <p>The Product Name and Price are required.</p>}
        </div>
      )}
      {savedMessage && (
        <div role="status" className="flex items-center justify-between rounded-lg bg-[#EAF8F1] px-4 py-3 font-montserrat text-[13px] text-[#18794E]">
          <span>{savedMessage}</span>
          <button type="button" aria-label="Close message" onClick={() => setSavedMessage('')}><X size={16} /></button>
        </div>
      )}

      <div className={`grid min-h-[760px] overflow-hidden rounded-xl border border-[#D3E1EC] bg-white ${fullScreen ? 'fixed inset-5 z-[70] grid-cols-[minmax(680px,2fr)_minmax(360px,0.78fr)] shadow-2xl' : 'grid-cols-1 xl:grid-cols-[minmax(680px,2fr)_minmax(360px,0.78fr)]'}`}>
        <section className="flex min-h-0 flex-col border-r border-[#D3E1EC]">
          <div className="flex h-14 items-center justify-between border-b border-[#D3E1EC] px-5">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#007EA7]" />
              <span className="font-montserrat text-[14px] font-semibold text-[#10233A]">Invoice document</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Zoom out" onClick={() => setZoom(value => Math.max(40, value - 10))} className="flex h-8 w-8 items-center justify-center rounded text-[#7288A3] hover:bg-[#E7F4F9]"><Minus size={16} /></button>
              <span className="w-12 text-center font-montserrat text-[12px] text-[#7288A3]">{zoom}%</span>
              <button type="button" aria-label="Zoom in" onClick={() => setZoom(value => Math.min(120, value + 10))} className="flex h-8 w-8 items-center justify-center rounded text-[#7288A3] hover:bg-[#E7F4F9]"><Plus size={16} /></button>
              <button type="button" aria-label={fullScreen ? 'Exit full screen' : 'Enter full screen'} onClick={() => setFullScreen(value => !value)} className="flex h-8 w-8 items-center justify-center rounded text-[#7288A3] hover:bg-[#E7F4F9]"><Maximize2 size={16} /></button>
            </div>
          </div>
          <InvoicePreview
            zoom={zoom}
            fields={originalDocumentRef.current.fields}
            products={originalDocumentRef.current.products}
            activeField={activeField}
            activeProductField={activeProductField}
            onSelectField={key => selectMappedField(key as keyof WorkspaceFields)}
            onSelectProductField={selectProductField}
            trainingMode={trainingMode}
            onAreaExtract={applyTrainingSelection}
            onTextExtract={applySelectedDocumentText}
            documentMappings={draft.documentMappings}
          />
        </section>

        <section className="flex min-h-0 flex-col">
          <div className="flex h-14 items-end gap-8 border-b border-[#D3E1EC] px-6">
            <button
              type="button"
              onClick={() => setActiveTab('extracted')}
              className={`flex h-14 items-center border-b-2 font-montserrat text-[13px] font-semibold ${activeTab === 'extracted' ? 'border-[#007EA7] text-[#007EA7]' : 'border-transparent text-[#7288A3]'}`}
            >
              EXTRACTED DATA
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`flex h-14 items-center gap-2 border-b-2 font-montserrat text-[13px] font-semibold ${activeTab === 'comments' ? 'border-[#007EA7] text-[#007EA7]' : 'border-transparent text-[#7288A3]'}`}
            >
              COMMENTS
              <span className="rounded-full bg-[#E5EDF9] px-2 py-0.5 text-[11px] text-[#4F6783]">{draft.comments.length}</span>
            </button>
          </div>

          {activeTab === 'extracted' ? (
            <div className="flex-1 overflow-y-auto p-4 xl:p-5">
              <h2 className="mb-4 font-montserrat text-[15px] font-semibold leading-5 text-[#10233A]">IDP Sample Invoice Document Information Extraction</h2>
              <div className="grid grid-cols-1 gap-3">
                <MappedFormField fieldKey="invoiceNumber" label="Invoice Number" required value={draft.fields.invoiceNumber} active={activeField === 'invoiceNumber'} onSelect={() => selectMappedField('invoiceNumber')} onChange={value => changeField('invoiceNumber', value)} />
                <MappedFormField fieldKey="invoiceDate" label="Invoice Date" required type="date" value={draft.fields.invoiceDate} active={activeField === 'invoiceDate'} onSelect={() => selectMappedField('invoiceDate')} onChange={value => changeField('invoiceDate', value)} />
                <MappedFormField fieldKey="dueDate" label="Due Date" required type="date" value={draft.fields.dueDate} active={activeField === 'dueDate'} onSelect={() => selectMappedField('dueDate')} onChange={value => changeField('dueDate', value)} />
                <MappedFormField fieldKey="companyName" label="Company Name" required value={draft.fields.companyName} active={activeField === 'companyName'} onSelect={() => selectMappedField('companyName')} onChange={value => changeField('companyName', value)} />
                <MappedFormField fieldKey="streetAddress" label="Street Address" value={draft.fields.streetAddress} active={activeField === 'streetAddress'} onSelect={() => selectMappedField('streetAddress')} onChange={value => changeField('streetAddress', value)} />
                <MappedFormField fieldKey="city" label="City" value={draft.fields.city} active={activeField === 'city'} onSelect={() => selectMappedField('city')} onChange={value => changeField('city', value)} />
                <MappedFormField fieldKey="zipCode" label="Zip Code" value={draft.fields.zipCode} active={activeField === 'zipCode'} onSelect={() => selectMappedField('zipCode')} onChange={value => changeField('zipCode', value)} />
                <MappedFormField fieldKey="phoneNumber" label="Phone Number" value={draft.fields.phoneNumber} active={activeField === 'phoneNumber'} onSelect={() => selectMappedField('phoneNumber')} onChange={value => changeField('phoneNumber', value)} />
                <MappedFormField fieldKey="email" label="E-mail" type="email" value={draft.fields.email} active={activeField === 'email'} onSelect={() => selectMappedField('email')} onChange={value => changeField('email', value)} />
                <MappedFormField fieldKey="taxRate" label="Tax Rate" value={draft.fields.taxRate} active={activeField === 'taxRate'} onSelect={() => selectMappedField('taxRate')} onChange={value => changeField('taxRate', value)} />
                <MappedFormField fieldKey="discountRate" label="Discount Rate" value={draft.fields.discountRate} active={activeField === 'discountRate'} onSelect={() => selectMappedField('discountRate')} onChange={value => changeField('discountRate', value)} />
                <MappedFormField fieldKey="totalDiscount" label="Total Discount" value={draft.fields.totalDiscount} active={activeField === 'totalDiscount'} onSelect={() => selectMappedField('totalDiscount')} onChange={value => changeField('totalDiscount', value)} />
                <MappedFormField fieldKey="totalAmount" label="Total Amount" required value={draft.fields.totalAmount} active={activeField === 'totalAmount'} onSelect={() => selectMappedField('totalAmount')} onChange={value => changeField('totalAmount', value)} />
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-montserrat text-[14px] font-semibold text-[#10233A]">Products <span className="text-[#D64545]">*</span></h3>
                    <p className="font-montserrat text-[11px] text-[#7288A3]">Each invoice row includes its own editable Description.</p>
                  </div>
                  <PageActionButton
                    icon={<Plus size={15} />}
                    onClick={() => setDraft(current => ({
                      ...current,
                      products: [...current.products, { id: `product-${Date.now()}`, name: '', description: '', quantity: '1', price: '' }],
                    }))}
                  >
                    Add
                  </PageActionButton>
                </div>
                <div className="space-y-3">
                  {draft.products.map((product, index) => (
                    <div key={product.id} className="rounded-xl border border-[#D3E1EC] bg-[#F8FDFF] p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#007EA7] px-1.5 font-montserrat text-[11px] font-bold text-white">{index + 1}</span>
                          <span className="font-montserrat text-[12px] font-semibold text-[#10233A]">Product {index + 1}</span>
                        </div>
                        <button type="button" aria-label={`Delete product ${index + 1}`} disabled={draft.products.length === 1} onClick={() => setDraft(current => ({ ...current, products: current.products.filter(item => item.id !== product.id) }))} className="flex h-7 w-7 items-center justify-center rounded text-[#7288A3] hover:bg-[#FFF1F1] hover:text-[#D64545] disabled:cursor-not-allowed disabled:opacity-30"><Trash2 size={14} /></button>
                      </div>
                      <div className="space-y-2">
                        <MappedProductField product={product} index={index} fieldKey="name" active={activeProductField === `${product.id}:name`} onSelect={() => selectProductField(`${product.id}:name`)} onChange={value => updateProduct(product.id, 'name', value)} />
                        <MappedProductField product={product} index={index} fieldKey="description" active={activeProductField === `${product.id}:description`} onSelect={() => selectProductField(`${product.id}:description`)} onChange={value => updateProduct(product.id, 'description', value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <MappedProductField product={product} index={index} fieldKey="quantity" active={activeProductField === `${product.id}:quantity`} onSelect={() => selectProductField(`${product.id}:quantity`)} onChange={value => updateProduct(product.id, 'quantity', value)} />
                          <MappedProductField product={product} index={index} fieldKey="price" active={activeProductField === `${product.id}:price`} onSelect={() => selectProductField(`${product.id}:price`)} onChange={value => updateProduct(product.id, 'price', value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col p-6">
              <div className="flex-1 space-y-3 overflow-y-auto">
                {!draft.comments.length && (
                  <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 text-[#7288A3]">
                    <MessageSquare size={34} strokeWidth={1.5} />
                    <p className="font-montserrat text-[14px] font-medium">No comments yet</p>
                  </div>
                )}
                {draft.comments.map(item => (
                  <div key={item.id} className="rounded-lg bg-[#F8FDFF] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-montserrat text-[13px] font-semibold text-[#10233A]">{item.author}</span>
                      <span className="font-montserrat text-[11px] text-[#7288A3]">{item.createdAt}</span>
                    </div>
                    <p className="font-montserrat text-[13px] leading-5 text-[#10233A]">{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-end gap-2 border-t border-[#D3E1EC] pt-4">
                <textarea aria-label="New comment" value={comment} onChange={event => setComment(event.target.value)} placeholder="Write a comment" className="min-h-[74px] flex-1 resize-none rounded-lg border border-[#D3E1EC] p-3 font-montserrat text-[13px] outline-none focus:border-[#007EA7]" />
                <PageActionButton onClick={addComment} disabled={!comment.trim()}>Add comment</PageActionButton>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function WorkspaceDocumentEditor({
  documentName,
  documentId,
  savedTask,
  filePosition = 1,
  fileTotal = 1,
  onBack,
  onSave,
  onNextFile,
}: {
  documentName: string;
  documentId?: string;
  savedTask?: WorkspaceTask;
  filePosition?: number;
  fileTotal?: number;
  onBack: () => void;
  onSave?: (task: WorkspaceTask) => void;
  onNextFile?: () => void;
}) {
  const [documentTask, setDocumentTask] = useState<WorkspaceTask>(() => savedTask ?? ({
    id: `document-set-${documentId ?? documentName}`,
    name: documentName,
    priority: 0,
    description: `Document from Machine learning / Document sets: ${documentName}`,
    status: 'In Progress',
    createdBy: 'Document set',
    creationDate: new Date().toLocaleString('lt-LT'),
    documentType: 'IDP Sample Invoice',
    sourceRunId: 'DOCUMENT-SET',
    editStartedAt: new Date().toISOString(),
    fields: { ...EMPTY_FIELDS },
    products: SAMPLE_PRODUCTS.map(product => ({ ...product })),
    originalFields: { ...EMPTY_FIELDS },
    originalProducts: SAMPLE_PRODUCTS.map(product => ({ ...product })),
    comments: [],
  }));

  const saveDocumentTask = (nextTask: WorkspaceTask) => {
    setDocumentTask(nextTask);
    onSave?.(nextTask);
  };

  return (
    <WorkspaceTaskDetail
      task={documentTask}
      onBack={onBack}
      onUpdate={saveDocumentTask}
      onComplete={saveDocumentTask}
      onNextFile={onNextFile ? nextTask => {
        saveDocumentTask(nextTask);
        onNextFile();
      } : undefined}
      queuePosition={filePosition}
      queueTotal={fileTotal}
      trainingMode
    />
  );
}

export default function WorkspaceView({
  onCompleteToCompany,
}: {
  onCompleteToCompany?: (task: WorkspaceTask) => void | Promise<void>;
}) {
  const [tasks, setTasks] = useState<WorkspaceTask[]>(loadTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [page, setPage] = useState(1);
  const [columns, setColumns] = useState<ColConfig[]>(INITIAL_COLUMNS);
  const [showColumns, setShowColumns] = useState(false);
  const [settings, setSettings] = useState<Record<string, boolean>>({
    groupByType: true,
    hideSkipped: true,
    showEmptyTypes: false,
    showCompleted: false,
  });
  const [refreshMessage, setRefreshMessage] = useState('');
  const [trainingQueue, setTrainingQueue] = useState<string[]>([]);
  const [trainingQueueTotal, setTrainingQueueTotal] = useState(0);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const { startResize } = useColumnResize(columns, setColumns);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const listTasks = useMemo(() => tasks.filter(task => {
    if (!settings.showCompleted && task.status === 'Completed') return false;
    if (documentType.trim() && !task.documentType.toLowerCase().includes(documentType.trim().toLowerCase())) return false;
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return [task.name, task.description, task.status, task.createdBy, task.creationDate].some(value => String(value).toLowerCase().includes(query));
  }), [documentType, search, settings.showCompleted, tasks]);

  const { sortedRows, changeSort, directionFor } = useMultiColumnSort(listTasks, (row, key) => row[key as keyof WorkspaceTask] as string | number | boolean | undefined);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / ROWS_PER_PAGE));
  const rows = sortedRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const visibleColumns = columns.filter(column => column.visible);
  const selectedTask = selectedTaskId ? tasks.find(task => task.id === selectedTaskId) : undefined;
  const availableCount = tasks.filter(task => task.status === 'Available').length;
  const progressCount = tasks.filter(task => task.status === 'In Progress').length;

  const updateTask = (nextTask: WorkspaceTask, returnToList = false) => {
    setTasks(current => current.map(task => task.id === nextTask.id ? nextTask : task));
    if (returnToList) setSelectedTaskId(null);
  };

  const completeTaskAndOpenCompany = (nextTask: WorkspaceTask) => {
    updateTask(nextTask, true);
    void onCompleteToCompany?.(nextTask);
  };

  const startEditingSession = (task: WorkspaceTask): WorkspaceTask => ({
    ...task,
    status: 'In Progress',
    editStartedAt: new Date().toISOString(),
    remainingTimeSeconds: CORRECTION_TIME_SECONDS,
    correctionDurationSeconds: 0,
  });

  const startAvailableTask = () => {
    const task = tasks.find(item => item.status === 'Available');
    if (!task) return;
    const next = startEditingSession(task);
    setTasks(current => current.map(item => item.id === task.id ? next : item));
    setSelectedTaskId(task.id);
  };

  const openOcrCorrection = (task: WorkspaceTask) => {
    setTrainingQueue([]);
    setTrainingQueueTotal(0);
    const next = startEditingSession(task);
    setTasks(current => current.map(item => item.id === task.id ? next : item));
    setSelectedTaskId(task.id);
  };

  const startSequentialOcrCorrection = () => {
    const queue = tasks.filter(task => task.status !== 'Completed' && !task.humanCorrected).map(task => task.id);
    if (!queue.length) {
      setRefreshMessage('All OCR documents are already completed.');
      return;
    }
    setTrainingQueue(queue);
    setTrainingQueueTotal(queue.length);
    setTasks(current => current.map(task => task.id === queue[0] ? startEditingSession(task) : task));
    setSelectedTaskId(queue[0]);
  };

  const saveAndContinueTraining = (savedTask: WorkspaceTask) => {
    const remaining = trainingQueue.filter(id => id !== savedTask.id);
    const nextTaskId = remaining[0];
    setTasks(current => current.map(task => {
      if (task.id === savedTask.id) return savedTask;
      if (task.id === nextTaskId) return startEditingSession(task);
      return task;
    }));
    setTrainingQueue(remaining);
    if (nextTaskId) {
      setSelectedTaskId(nextTaskId);
      return;
    }
    setTrainingQueueTotal(0);
    setSelectedTaskId(null);
    setRefreshMessage('All OCR documents in this group were corrected and saved.');
  };

  const refreshWorkspace = () => {
    setTasks(current => current.map(task => ({ ...task })));
    setRefreshMessage('Workspace refreshed.');
  };

  if (selectedTask) {
    return (
      <WorkspaceTaskDetail
        key={selectedTask.id}
        task={selectedTask}
        onBack={() => { setSelectedTaskId(null); setTrainingQueue([]); setTrainingQueueTotal(0); }}
        onUpdate={updateTask}
        sequentialMode={trainingQueue.length > 0}
        queuePosition={trainingQueueTotal ? trainingQueueTotal - trainingQueue.length + 1 : 1}
        queueTotal={trainingQueueTotal || 1}
        onContinue={saveAndContinueTraining}
        onComplete={completeTaskAndOpenCompany}
      />
    );
  }

  return (
    <div className="relative flex min-h-full flex-col gap-8 bg-white px-[72px] py-14">
      <PageHeader
        title="Workspace"
        actions={
          <PageActionButton onClick={startAvailableTask} disabled={availableCount === 0}>
            Start available task
          </PageActionButton>
        }
      />

      {refreshMessage && (
        <div role="status" className="flex items-center justify-between rounded-lg bg-[#EAF8F1] px-4 py-3 font-montserrat text-[13px] text-[#18794E]">
          <span>{refreshMessage}</span>
          <button type="button" aria-label="Close refresh message" onClick={() => setRefreshMessage('')}><X size={16} /></button>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block font-montserrat text-[12px] font-medium text-[#7288A3]">Search by document type</label>
            <OcrSearchField
              ariaLabel="Search by document type"
              value={documentType}
              onChange={value => { setDocumentType(value); setPage(1); }}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="grid h-9 grid-cols-[44px_minmax(260px,1fr)_140px_140px_54px] items-center border-b border-[#D3E1EC] bg-white px-2 font-montserrat text-[12px] font-medium text-[#7288A3]">
            <span />
            <span className="text-[#10233A]">Name</span>
            <span className="border-l border-[#D3E1EC] pl-3 text-[#10233A]">Available</span>
            <span className="border-l border-[#D3E1EC] pl-3 text-[#10233A]">In progress</span>
            <span />
          </div>
          <div className="mt-2 grid min-h-11 grid-cols-[44px_minmax(260px,1fr)_140px_140px_54px] items-center rounded-lg bg-[#F8FDFF] px-2 transition-colors hover:bg-[#E7F4F9]">
            <button type="button" aria-label={expanded ? 'Collapse document type' : 'Expand document type'} onClick={() => setExpanded(value => !value)} className="flex h-8 w-8 items-center justify-center rounded text-[#7288A3] hover:bg-[#E7F4F9]">
              {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
            <span className="font-montserrat text-[12px] font-medium text-[#10233A]">IDP Sample Invoice</span>
            <span className="pl-3 font-montserrat text-[12px] text-[#10233A]">{availableCount}</span>
            <span className="pl-3 font-montserrat text-[12px] text-[#10233A]">{progressCount}</span>
            <button type="button" title="EDIT all OCR documents" aria-label="EDIT all OCR documents in sequence" disabled={!tasks.some(task => task.status !== 'Completed' && !task.humanCorrected)} onClick={startSequentialOcrCorrection} className="flex h-8 w-8 items-center justify-center rounded border border-[#D3E1EC] bg-white text-[#7288A3] transition-colors hover:border-[#007EA7] hover:text-[#007EA7] disabled:cursor-not-allowed disabled:opacity-35">
              <PencilLine size={16} />
            </button>
          </div>

          {expanded && (
            <div className="mt-6 bg-white">
              <div className="mb-4 flex items-center justify-between gap-4">
                <OcrSearchField ariaLabel="Search workspace tasks" value={search} onChange={value => { setSearch(value); setPage(1); }} />
                <div className="flex items-center gap-2">
                  <ColumnSettingsButton onClick={() => setShowColumns(true)} />
                  <button
                    type="button"
                    title="REFRESH ALL"
                    aria-label="REFRESH ALL task list"
                    onClick={refreshWorkspace}
                    className="flex h-7 w-7 items-center justify-center border-0 bg-transparent text-[#7288A3] shadow-none outline-none transition-colors hover:text-[#007EA7] focus:ring-0"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div ref={tableScrollRef} className="overflow-x-auto scrollbar-hide">
                <div style={{ minWidth: `${visibleColumns.reduce((sum, column) => sum + column.width, 0) + 70}px` }}>
                  <div className="flex h-8 items-center">
                    {visibleColumns.map((column, index) => {
                      const realIndex = columns.findIndex(item => item.key === column.key);
                      return (
                      <div key={column.key} className="relative flex flex-shrink-0 items-center gap-1 border-r border-[#D3E1EC] px-3 last:border-r-0" style={{ width: column.width }}>
                        <span className="truncate font-montserrat text-[12px] font-medium text-[#7288A3]">{column.label}</span>
                        <ColumnSortButton columnLabel={column.label} direction={directionFor(column.key)} onDirectionChange={direction => { changeSort(column.key, direction); setPage(1); }} />
                        <ResizeHandle onMouseDown={event => startResize(realIndex, event)} />
                      </div>
                    )})}
                    <span className="w-[70px] flex-shrink-0" />
                  </div>

                  <div>
                    {rows.map((task, rowIndex) => (
                      <div key={task.id} className={`flex h-11 items-center rounded-lg ${rowIndex % 2 === 0 ? 'bg-[#F8FDFF]' : 'bg-white'} hover:bg-[#E7F4F9]`}>
                        {visibleColumns.map(column => {
                          const value = column.key === 'priority'
                            ? String(task.priority)
                            : String(task[column.key as keyof WorkspaceTask] ?? '—');
                          return (
                            <div key={column.key} className="flex h-full flex-shrink-0 items-center px-3" style={{ width: column.width }}>
                              {column.key === 'status'
                                ? <StatusBadge status={task.status} />
                                : column.key === 'name'
                                  ? <span className="truncate text-left font-montserrat text-[12px] font-normal text-[#10233A]">{value}</span>
                                  : <span className="truncate font-montserrat text-[12px] text-[#10233A]">{value}</span>}
                            </div>
                          );
                        })}
                        <div className="flex w-[70px] flex-shrink-0 items-center justify-end pr-2">
                          <button type="button" title="OCR correction and human training" aria-label={`Edit OCR training ${task.name}`} onClick={() => openOcrCorrection(task)} className="flex h-8 w-8 items-center justify-center rounded border border-[#D3E1EC] bg-white text-[#7288A3] hover:border-[#007EA7] hover:text-[#007EA7]">
                            <PencilLine size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {!rows.length && (
                <div className="flex min-h-[250px] flex-col items-center justify-center gap-2">
                  <Search size={28} className="text-[#A1B6C6]" />
                  <span className="font-montserrat text-[16px] font-semibold text-[#10233A]">Tasks not found</span>
                  <span className="font-montserrat text-[13px] text-[#7288A3]">Try changing search or Workspace settings.</span>
                </div>
              )}

              <HorizontalTableScrollbar scrollRef={tableScrollRef} />
              <div className="mt-5">
                <TablePagination currentPage={page} totalPages={totalPages} itemCount={sortedRows.length} itemsPerPage={ROWS_PER_PAGE} onPageChange={setPage} />
              </div>
            </div>
          )}
        </div>
      </div>

      {showColumns && (
        <ColumnSettingsPanel
          columns={columns}
          defaultColumns={INITIAL_COLUMNS}
          onSave={next => setColumns(next)}
          onClose={() => setShowColumns(false)}
        />
      )}
    </div>
  );
}
