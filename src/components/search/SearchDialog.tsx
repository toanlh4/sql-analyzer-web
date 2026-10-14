import { useEffect, useMemo, useRef, useState } from 'react';
import { Columns3, Search } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { nodeStyle } from '../../lib/nodeStyle';
import { manifestNodes } from '../../lib/filters';

type Scope = 'models' | 'columns' | 'descriptions' | 'tags';

const SCOPES: { id: Scope; label: string }[] = [
  { id: 'models', label: 'Models' },
  { id: 'columns', label: 'Columns' },
  { id: 'descriptions', label: 'Descriptions' },
  { id: 'tags', label: 'Tags' },
];

interface Result {
  key: string;
  nodeId: string;
  column?: string;
  title: string;
  subtitle: string;
}

const MAX_RESULTS = 100;

export function SearchDialog() {
  const open = useAppStore((s) => s.searchOpen);
  const setOpen = useAppStore((s) => s.setSearchOpen);
  const manifest = useAppStore((s) => s.manifest);
  const focusNode = useAppStore((s) => s.focusNode);
  const selectColumn = useAppStore((s) => s.selectColumn);
  const [query, setQuery] = useState('');
  const [scopes, setScopes] = useState<Scope[]>(['models', 'columns']);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [open]);

  const nodes = useMemo(() => manifestNodes(manifest), [manifest]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Result[] = [];
    const has = (s: Scope) => scopes.includes(s);
    for (const node of nodes) {
      const nodeMatch =
        (has('models') && (node.name.toLowerCase().includes(q) || node.fullName.toLowerCase().includes(q))) ||
        (has('descriptions') && !!node.description?.toLowerCase().includes(q)) ||
        (has('tags') && node.tags.some((t) => t.toLowerCase().includes(q)));
      if (nodeMatch) out.push({ key: node.id, nodeId: node.id, title: node.name, subtitle: node.fullName });
    }
    if (has('columns') || has('descriptions') || has('tags')) {
      for (const node of nodes) {
        for (const column of Object.values(node.columns)) {
          const match =
            (has('columns') && column.columnName.toLowerCase().includes(q)) ||
            (has('descriptions') && !!column.description?.toLowerCase().includes(q)) ||
            (has('tags') && !!column.tags?.some((t) => t.toLowerCase().includes(q)));
          if (match) {
            out.push({
              key: `${node.id}::${column.columnName}`,
              nodeId: node.id,
              column: column.columnName,
              title: column.columnName,
              subtitle: `${node.name}${column.dataType ? ` · ${column.dataType}` : ''}`,
            });
          }
          if (out.length >= MAX_RESULTS * 3) break;
        }
      }
    }
    // Exact / prefix matches first.
    const rank = (r: Result) => (r.title.toLowerCase() === q ? 0 : r.title.toLowerCase().startsWith(q) ? 1 : 2);
    return out.sort((a, b) => rank(a) - rank(b)).slice(0, MAX_RESULTS);
  }, [query, scopes, nodes]);

  if (!open || !manifest) return null;

  const choose = (r: Result) => {
    focusNode(r.nodeId);
    if (r.column) selectColumn({ node: r.nodeId, column: r.column });
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[12vh]" onMouseDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-label="Search"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-gray-200 px-3 dark:border-gray-800">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter' && results[active]) {
                choose(results[active]);
              } else if (e.key === 'Escape') {
                e.stopPropagation();
                setOpen(false);
              }
            }}
            placeholder="Search for models and columns..."
            className="flex-1 bg-transparent py-3 text-sm text-gray-900 outline-none dark:text-gray-100"
          />
          <kbd className="rounded border border-gray-200 px-1.5 text-[10px] text-gray-400 dark:border-gray-700">Esc</kbd>
        </div>
        <div className="flex items-center gap-1.5 border-b border-gray-200 px-3 py-2 text-xs dark:border-gray-800">
          <span className="text-gray-500">Search in</span>
          {SCOPES.map((s) => {
            const on = scopes.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setScopes(on ? scopes.filter((x) => x !== s.id) : [...scopes, s.id])}
                className={`rounded-full border px-2 py-0.5 ${
                  on
                    ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200'
                    : 'border-gray-200 text-gray-500 dark:border-gray-700'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-1">
          {!query.trim() && <div className="p-6 text-center text-sm text-gray-500">Search across models and columns</div>}
          {query.trim() && results.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">
              No results.
              <div className="text-xs">Try adjusting your search or filters</div>
            </div>
          )}
          {results.map((r, i) => {
            const node = manifest.nodes[r.nodeId];
            const style = node ? nodeStyle(node) : null;
            const Icon = r.column ? Columns3 : style?.icon ?? Columns3;
            return (
              <button
                key={r.key}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(r)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left ${i === active ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${r.column ? 'text-gray-400' : style?.iconColor ?? ''}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-gray-900 dark:text-gray-100">{r.title}</div>
                  <div className="truncate text-xs text-gray-500">{r.subtitle}</div>
                </div>
                <span className="text-[10px] text-gray-400 uppercase">{r.column ? 'column' : node?.nodeType}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
