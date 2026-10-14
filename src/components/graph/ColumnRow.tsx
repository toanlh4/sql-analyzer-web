import { memo } from 'react';
import type { ColibriColumn } from '../../types/colibri';
import { DataTypeIcon } from '../common/DataTypeIcon';
import { LineageBadge, lineageLabel } from './LineageBadge';

export const hiddenHandleStyle = { opacity: 0, pointerEvents: 'none' as const, top: '50%' };

export const columnHandleId = (column: string): string => `col:${column}`;

interface ColumnRowProps {
  column: ColibriColumn;
  state: 'selected' | 'related' | 'none';
  dimmed: boolean;
  showBadge: boolean;
  /** Row height in px (display setting). */
  height: number;
  onClick: (column: string) => void;
  onContextMenu: (column: string, x: number, y: number) => void;
}

const STATE_CLASSES = {
  selected: 'bg-blue-500 text-white font-semibold ring-1 ring-blue-500 [&_svg]:!text-white',
  related: 'bg-blue-100 text-blue-800 font-semibold ring-1 ring-blue-400 dark:bg-blue-900 dark:text-blue-100',
  none: 'text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800',
};

function ColumnRowImpl({ column, state, dimmed, showBadge, height, onClick, onContextMenu }: ColumnRowProps) {
  const tooltip = [
    column.columnName,
    column.dataType ? `Type: ${column.dataType}` : null,
    column.contractType ? `Contract type: ${column.contractType}` : null,
    column.lineageType ? `Lineage: ${lineageLabel(column.lineageType)}` : null,
    column.description ? `\n${column.description}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div
      data-column-name={column.columnName}
      style={{ height }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(column.columnName);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(column.columnName, e.clientX, e.clientY);
      }}
      className={`group nodrag nopan flex min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2 text-xs transition-colors duration-100 ${STATE_CLASSES[state]} ${
        dimmed ? 'opacity-40' : ''
      }`}
    >
      <DataTypeIcon column={column} className="h-3 w-3 shrink-0 text-gray-400 group-hover:text-blue-500" />
      <span className="min-w-0 flex-1 truncate" title={tooltip}>
        {column.columnName}
      </span>
      {showBadge && column.lineageType && (
        <span className="shrink-0">
          <LineageBadge type={column.lineageType} />
        </span>
      )}
    </div>
  );
}

export const ColumnRow = memo(ColumnRowImpl);
