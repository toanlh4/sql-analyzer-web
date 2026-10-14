import { useMemo, useState } from 'react';
import { ArrowDownWideNarrow, FlaskConical } from 'lucide-react';
import type { ColibriColumn, ColibriTest } from '../../types/colibri';
import { DataTypeIcon } from '../common/DataTypeIcon';
import { LineageBadge } from '../graph/LineageBadge';

export function testLabel(test: ColibriTest): string {
  const name = test.name ?? test.unique_id?.split('.')[2] ?? 'test';
  return test.namespace ? `${test.namespace}.${name}` : name;
}

export function TestChips({ tests }: { tests: ColibriTest[] | undefined }) {
  if (!tests || tests.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tests.map((test, i) => (
        <span
          key={test.unique_id ?? i}
          title={test.unique_id ?? undefined}
          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] ${
            test.config?.severity?.toLowerCase() === 'warn'
              ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
          }`}
        >
          <FlaskConical className="h-2.5 w-2.5" />
          {testLabel(test)}
        </span>
      ))}
    </div>
  );
}

interface ColumnsTableProps {
  columns: Record<string, ColibriColumn>;
  selectedColumn?: string | null;
  onColumnClick?: (column: string) => void;
  /** Wide layout for the documentation page. */
  wide?: boolean;
}

export function ColumnsTable({ columns, selectedColumn, onColumnClick, wide = false }: ColumnsTableProps) {
  const [filter, setFilter] = useState('');
  const [sortByTests, setSortByTests] = useState(false);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = Object.values(columns).filter((c) => !q || c.columnName.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
    if (sortByTests) list.sort((a, b) => (b.tests?.length ?? 0) - (a.tests?.length ?? 0));
    return list;
  }, [columns, filter, sortByTests]);

  if (Object.keys(columns).length === 0) return <p className="text-sm text-gray-500">No columns.</p>;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search columns..."
          className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <button
          type="button"
          onClick={() => setSortByTests(!sortByTests)}
          title="Sort by tests"
          className={`toolbar-btn ${sortByTests ? 'toolbar-btn-active' : ''}`}
        >
          <ArrowDownWideNarrow className="h-3.5 w-3.5" />
          {wide && <span className="text-xs">Sort by tests</span>}
        </button>
      </div>
      <table className="w-full table-fixed text-left text-xs">
        <thead className="text-[10px] tracking-wide text-gray-500 uppercase">
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className={`py-1.5 pr-2 font-medium ${wide ? 'w-1/4' : 'w-2/5'}`}>Column Name</th>
            <th className={`py-1.5 pr-2 font-medium ${wide ? 'w-1/6' : 'w-1/4'}`}>Type</th>
            {wide && <th className="py-1.5 pr-2 font-medium">Description</th>}
            <th className={`py-1.5 font-medium ${wide ? 'w-1/4' : ''}`}>{wide ? 'Tests' : 'Lineage / Tests'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((column) => {
            const active = selectedColumn === column.columnName;
            return (
              <tr
                key={column.columnName}
                onClick={() => onColumnClick?.(column.columnName)}
                className={`border-b border-gray-100 align-top dark:border-gray-900 ${onColumnClick ? 'cursor-pointer' : ''} ${
                  active ? 'bg-blue-50 dark:bg-blue-950/60' : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <td className="py-1.5 pr-2">
                  <div className="flex items-center gap-1.5">
                    <DataTypeIcon column={column} className="h-3 w-3 shrink-0 text-gray-400" />
                    <span className="truncate font-medium text-gray-900 dark:text-gray-100" title={column.columnName}>
                      {column.columnName}
                    </span>
                  </div>
                  {!wide && column.description && <p className="mt-0.5 line-clamp-2 text-gray-500">{column.description}</p>}
                </td>
                <td className="truncate py-1.5 pr-2 font-mono text-[11px] text-gray-600 dark:text-gray-400" title={column.contractType ?? column.dataType ?? ''}>
                  {column.dataType ?? '—'}
                </td>
                {wide && <td className="py-1.5 pr-2 text-gray-600 dark:text-gray-400">{column.description || <span className="text-gray-400">No description available</span>}</td>}
                <td className="py-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    {!wide && column.lineageType && <LineageBadge type={column.lineageType} />}
                    <TestChips tests={column.tests} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
