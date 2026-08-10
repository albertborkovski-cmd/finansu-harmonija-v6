import type { ReactNode } from 'react';
import { Columns2 } from 'lucide-react';

interface ColumnSettingsButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/** System-wide COLUMNS action contract. */
export function ColumnSettingsButton({ onClick, disabled = false }: ColumnSettingsButtonProps) {
  return (
    <button
      type="button"
      data-button-family="column-settings"
      aria-label="COLUMNS"
      title="COLUMNS"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-[#7288A3] transition-colors hover:text-[#007EA7] disabled:cursor-not-allowed disabled:text-[#B4B6B8]"
    >
      <Columns2 size={16} />
    </button>
  );
}

interface SaveButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  type?: 'button' | 'submit';
}

/** Exact Save action contract. Width remains contextual; visual design does not. */
export function SaveButton({ onClick, disabled = false, children = 'Save', className = '', type = 'button' }: SaveButtonProps) {
  return (
    <button
      type={type}
      data-system-action="true"
      data-button-family="save"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`flex h-[42px] items-center justify-center rounded-lg px-4 font-montserrat text-[16px] font-semibold leading-6 transition-colors ${
        disabled
          ? 'cursor-not-allowed bg-[#F5F5F5] text-[#B4B6B8]'
          : 'bg-[#007EA7] text-white hover:bg-[#006B8F] active:bg-[#005F80]'
      } ${className}`}
    >
      {children}
    </button>
  );
}
