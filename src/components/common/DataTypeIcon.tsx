import type { ColibriColumn } from '../../types/colibri';
import { dataTypeIcon } from '../../lib/dataTypeIcon';
import { Tooltip } from './Tooltip';

/** Data type icon with a tooltip showing the full warehouse type (and contract type when it differs). */
export function DataTypeIcon({ column, className }: { column: ColibriColumn; className: string }) {
  const Icon = dataTypeIcon(column.dataType);
  const dataType = column.dataType || 'Unknown type';
  const contract = column.contractType && column.contractType.toLowerCase() !== column.dataType?.toLowerCase() ? column.contractType : null;

  return (
    <Tooltip
      className="shrink-0"
      content={
        <>
          <span className="font-mono">{dataType}</span>
          {contract && <span className="opacity-70"> · contract: <span className="font-mono">{contract}</span></span>}
        </>
      }
    >
      <Icon className={className} aria-label={dataType} />
    </Tooltip>
  );
}
