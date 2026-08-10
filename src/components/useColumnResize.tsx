import { useCallback, useLayoutEffect, useRef } from 'react';
import type { ColConfig } from './ColumnSettingsPanel';

const MIN_COLUMN_WIDTH = 88;
const HEADER_HORIZONTAL_SPACE = 54;
const FIRST_COLUMN_CHECKBOX_SPACE = 30;
const ROW_ACTIONS_SPACE = 96;

function getHeaderWidth(label: string, visibleIndex: number) {
  let measuredTextWidth = label.length * 7;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (context) {
      context.font = '600 12px Montserrat, sans-serif';
      measuredTextWidth = context.measureText(label).width;
    }
  }

  return Math.max(
    MIN_COLUMN_WIDTH,
    Math.ceil(
      measuredTextWidth +
        HEADER_HORIZONTAL_SPACE +
        (visibleIndex === 0 ? FIRST_COLUMN_CHECKBOX_SPACE : 0)
    )
  );
}

function getAvailableColumnsWidth() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;

  const main = document.querySelector<HTMLElement>('[data-app-main="true"]');
  const mainWidth = main?.clientWidth ?? window.innerWidth;
  const pageInset = Math.min(72, Math.max(24, window.innerWidth * 0.05));

  // Table rows reserve their right edge for record actions. The remaining
  // width is shared by visible data columns.
  return Math.max(360, mainWidth - pageInset - ROW_ACTIONS_SPACE);
}

function fitVisibleColumns(columns: ColConfig[], availableWidth: number) {
  const visible = columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => column.visible);

  if (!visible.length || availableWidth <= 0) return columns;

  const minimumWidths = visible.map(({ column }, visibleIndex) =>
    getHeaderWidth(column.label, visibleIndex)
  );
  const preferredWidths = visible.map(({ column }, visibleIndex) =>
    Math.max(column.width, minimumWidths[visibleIndex])
  );
  const minimumTotal = minimumWidths.reduce((sum, width) => sum + width, 0);
  const preferredTotal = preferredWidths.reduce((sum, width) => sum + width, 0);

  let fittedWidths = preferredWidths;

  // Preserve readable headers. If they can fit, proportionally remove only
  // the extra space from wider columns until the whole table fits the screen.
  if (preferredTotal > availableWidth && minimumTotal <= availableWidth) {
    const excess = preferredTotal - availableWidth;
    const reducible = preferredTotal - minimumTotal;

    fittedWidths = preferredWidths.map((width, index) =>
      Math.max(
        minimumWidths[index],
        Math.floor(width - (excess * (width - minimumWidths[index])) / reducible)
      )
    );

    // Rounding can leave a few unused pixels. Add them to the widest column
    // without changing the visual alignment of the remaining headers.
    const fittedTotal = fittedWidths.reduce((sum, width) => sum + width, 0);
    const remainder = Math.max(0, availableWidth - fittedTotal);
    if (remainder > 0) {
      const widestIndex = fittedWidths.indexOf(Math.max(...fittedWidths));
      fittedWidths[widestIndex] += remainder;
    }
  }

  let visibleIndex = 0;
  return columns.map((column) => {
    if (!column.visible) return column;
    const width = fittedWidths[visibleIndex++];
    return column.width === width ? column : { ...column, width };
  });
}

export function useColumnResize(
  columns: ColConfig[],
  setColumns: (cols: ColConfig[]) => void
) {
  const startX = useRef(0);
  const startWidth = useRef(0);
  const colIndex = useRef(-1);
  const fittedVisibilityKey = useRef('');

  useLayoutEffect(() => {
    const visibilityKey = columns
      .filter((column) => column.visible)
      .map((column) => column.key)
      .join('|');

    if (!visibilityKey || fittedVisibilityKey.current === visibilityKey) return;
    fittedVisibilityKey.current = visibilityKey;

    const fitted = fitVisibleColumns(columns, getAvailableColumnsWidth());
    const changed = fitted.some((column, index) => column.width !== columns[index]?.width);
    if (changed) setColumns(fitted);
  }, [columns, setColumns]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const diff = e.clientX - startX.current;
    // Keep enough space for a readable, wrapped header and its sort control.
    // Narrower columns used to clip two-line labels such as "Company code".
    const newWidth = Math.max(MIN_COLUMN_WIDTH, startWidth.current + diff);
    setColumns(
      columns.map((col, i) =>
        i === colIndex.current ? { ...col, width: newWidth } : col
      )
    );
  }, [columns, setColumns]);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  const startResize = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startX.current = e.clientX;
    startWidth.current = columns[index]?.width ?? 150;
    colIndex.current = index;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columns, handleMouseMove, handleMouseUp]);

  return { startResize };
}

export function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      data-column-resize-handle="true"
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="vertical"
      title="Drag to resize column"
      className="group/resize absolute right-2 top-0 z-30 flex h-6 w-3 translate-x-1/2 cursor-col-resize items-start justify-center rounded-full pt-px focus:outline-none"
    >
      <div className="h-[18px] w-px rounded-full bg-[#D3E1EC] transition-[width,background-color,box-shadow] duration-150 group-hover/resize:w-[2px] group-hover/resize:bg-[#A1B6C6] group-active/resize:w-[2px] group-active/resize:bg-[#007EA7] group-active/resize:shadow-[0_0_0_2px_rgba(0,126,167,0.10)]" />
    </div>
  );
}
