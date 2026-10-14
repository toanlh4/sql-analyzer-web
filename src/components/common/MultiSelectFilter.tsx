import { useState, type ReactNode } from 'react';
import { Popover } from './Popover';

interface MultiSelectFilterProps {
  label: string;
  icon: ReactNode;
  options: string[];
  selected: string[];
  onApply: (selected: string[]) => void;
  emptyText: string;
  align?: 'left' | 'right';
}

/** Button + popover with checkboxes and Clear / Cancel / Apply, like the original layer and tag filters. */
export function MultiSelectFilter({ label, icon, options, selected, onApply, emptyText, align }: MultiSelectFilterProps) {
  const [draft, setDraft] = useState<string[]>(selected);

  return (
    <Popover
      align={align}
      trigger={({ open, toggle }) => (
        <button
          type="button"
          title={label}
          onClick={() => {
            if (!open) setDraft(selected);
            toggle();
          }}
          className={`toolbar-btn ${selected.length > 0 ? 'toolbar-btn-active' : ''}`}
        >
          {icon}
          {selected.length > 0 && <span className="text-[10px] font-semibold">{selected.length}</span>}
        </button>
      )}
    >
      {(close) => (
        <div className="w-60 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-gray-100">{label}</span>
            <button type="button" className="text-xs text-blue-600 hover:underline dark:text-blue-400" onClick={() => setDraft([])}>
              Clear
            </button>
          </div>
          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            {options.length === 0 && <div className="py-2 text-xs text-gray-500">{emptyText}</div>}
            {options.map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <input
                  type="checkbox"
                  className="accent-blue-600"
                  checked={draft.includes(option)}
                  onChange={(e) => setDraft(e.target.checked ? [...draft, option] : draft.filter((d) => d !== option))}
                />
                <span className="truncate capitalize text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2 border-t border-gray-200 pt-2 dark:border-gray-700">
            <button type="button" className="btn-secondary" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onApply(draft);
                close();
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}
