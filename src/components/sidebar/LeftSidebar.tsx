import { useMemo, useState } from 'react';
import { Layers, Search, Tag, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { allLayers, allTags, manifestNodes, matchesFilters } from '../../lib/filters';
import { databaseTree, pathTree } from '../../lib/tree';
import { MultiSelectFilter } from '../common/MultiSelectFilter';
import { TreeView } from './TreeView';

type TreeMode = 'path' | 'database';

export function LeftSidebar() {
  const manifest = useAppStore((s) => s.manifest);
  const detailNode = useAppStore((s) => s.detailNode);
  const focusNode = useAppStore((s) => s.focusNode);
  const [mode, setMode] = useState<TreeMode>('path');
  const [query, setQuery] = useState('');
  const [layers, setLayers] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const nodes = useMemo(() => manifestNodes(manifest), [manifest]);
  const layerOptions = useMemo(() => allLayers(nodes), [nodes]);
  const tagOptions = useMemo(() => allTags(nodes), [nodes]);
  const tree = useMemo(() => {
    if (!manifest) return null;
    return mode === 'path' ? pathTree(manifest.tree) : databaseTree(manifest.tree);
  }, [manifest, mode]);

  const q = query.trim().toLowerCase();
  const isVisible = useMemo(() => {
    const cache = new Map<string, boolean>();
    return (id: string) => {
      let visible = cache.get(id);
      if (visible === undefined) {
        const node = manifest?.nodes[id];
        visible =
          !!node &&
          matchesFilters(node, layers, tags) &&
          (!q || node.name.toLowerCase().includes(q) || node.fullName.toLowerCase().includes(q) || node.tags.some((t) => t.toLowerCase().includes(q)));
        cache.set(id, visible);
      }
      return visible;
    };
  }, [manifest, layers, tags, q]);

  if (!manifest || !tree) return null;
  const filtering = q.length > 0 || layers.length > 0 || tags.length > 0;
  const anyVisible = nodes.some((n) => isVisible(n.id));

  return (
    <aside className="flex h-full w-full flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="space-y-2 border-b border-gray-200 p-3 dark:border-gray-800">
        <div className="inline-flex w-full rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
          {(['path', 'database'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md px-2 py-1 text-xs font-medium ${
                mode === m ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-100' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {m === 'path' ? 'Path' : 'Database'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models, sources..."
              className="w-full rounded-md border border-gray-200 bg-white py-1.5 pr-7 pl-7 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-blue-900"
            />
            {query && (
              <button type="button" title="Clear" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <MultiSelectFilter
            label="Filter by layer"
            icon={<Layers className="h-4 w-4" />}
            options={layerOptions}
            selected={layers}
            onApply={setLayers}
            emptyText="No layers available"
            align="right"
          />
          <MultiSelectFilter
            label="Filter by tag"
            icon={<Tag className="h-4 w-4" />}
            options={tagOptions}
            selected={tags}
            onApply={setTags}
            emptyText="No tags in this project"
            align="right"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {anyVisible ? (
          <TreeView folder={tree} nodes={manifest.nodes} isVisible={isVisible} activeId={detailNode} onSelect={focusNode} forceOpen={filtering} />
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            <p>No models found</p>
            {filtering && (
              <button
                type="button"
                className="mt-2 text-xs text-blue-600 hover:underline dark:text-blue-400"
                onClick={() => {
                  setQuery('');
                  setLayers([]);
                  setTags([]);
                }}
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
