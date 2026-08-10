import { Trash2 } from 'lucide-react';

interface BulkDeleteButtonProps {
  selectedCount: number;
  onDelete: () => void;
  label?: string;
  className?: string;
}

export function BulkDeleteButton({ selectedCount, onDelete, label = 'Delete selected records', className = '' }: BulkDeleteButtonProps) {
  const disabled = selectedCount === 0;
  return (
    <button
      type="button"
      data-button-family="bulk-delete"
      aria-label={label}
      title="ALL DELETE"
      disabled={disabled}
      onClick={disabled ? undefined : onDelete}
      className={`flex h-4 w-4 items-center justify-center text-[#7288A3] transition-colors enabled:hover:text-[#D64545] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <Trash2 size={16} />
    </button>
  );
}

interface RowDeleteButtonProps {
  onDelete: () => void;
  label?: string;
  className?: string;
  title?: string;
  variant?: 'outlined' | 'plain';
}

export function RowDeleteButton({ onDelete, label = 'Delete record', className = '', title = 'DELETE', variant = 'outlined' }: RowDeleteButtonProps) {
  return (
    <button
      type="button"
      data-button-family="row-delete"
      aria-label={label}
      title={title}
      onClick={event => {
        event.stopPropagation();
        onDelete();
      }}
      className={`${variant === 'plain'
        ? 'flex h-4 w-4 items-center justify-center text-[#7288A3] transition-colors hover:text-[#D64545]'
        : 'flex h-7 w-7 items-center justify-center rounded border-2 border-[#D3E1EC] bg-white text-[#7288A3] transition-colors hover:border-[#D64545] hover:text-[#D64545]'} ${className}`}
    >
      <Trash2 size={16} />
    </button>
  );
}
