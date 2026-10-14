import { useMemo } from 'react';
import {
  ChevronsDownUp,
  ChevronsUpDown,
  EyeOff,
  ListFilter,
  Layers,
  LayoutGrid,
  Maximize,
  Minimize,
  Network,
  Tag,
  Trash2,
} from 'lucide-react';
import { useAppStore, type BadgeMode } from '../../store/useAppStore';
import { allLayers, allTags } from '../../lib/filters';
import { MultiSelectFilter } from '../common/MultiSelectFilter';
import { Popover } from '../common/Popover';
import { DisplaySettingsPanel } from './DisplaySettingsPanel';

const BADGE_OPTIONS: { value: BadgeMode; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: '1', label: '1' },
  { value: 'all', label: 'All' },
];

function BadgeToggle() {
  const badgeMode = useAppStore((s) => s.badgeMode);
  const setBadgeMode = useAppStore((s) => s.setBadgeMode);
  return (
    <div className="flex items-center gap-2" title="Lineage badges: Off, only on selected / lineage nodes, or on all nodes">
      <span className="text-xs text-gray-500 dark:text-gray-400">Show transformations</span>
      <div role="radiogroup" aria-label="Lineage badges" className="inline-flex rounded-full bg-gray-100 p-0.5 shadow-sm dark:bg-gray-800">
        {BADGE_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={badgeMode === o.value}
            onClick={() => setBadgeMode(o.value)}
            className={`rounded-xl px-1.5 py-0.5 text-xs font-medium transition-all duration-200 ${
              badgeMode === o.value
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function HiddenModels() {
  const hidden = useAppStore((s) => s.hidden);
  const manifest = useAppStore((s) => s.manifest);
  const unhide = useAppStore((s) => s.unhide);
  const unhideAll = useAppStore((s) => s.unhideAll);
  if (hidden.size === 0) return null;
  return (
    <Popover
      trigger={({ toggle }) => (
        <button type="button" title="Hidden models" onClick={toggle} className="toolbar-btn toolbar-btn-active">
          <EyeOff className="h-4 w-4" />
          <span className="text-[10px] font-semibold">{hidden.size}</span>
        </button>
      )}
    >
      {(close) => (
        <div className="w-64 text-sm">
          <div className="mb-2 font-medium text-gray-900 dark:text-gray-100">Hidden Models</div>
          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            {[...hidden].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => unhide(id)}
                title="Show this model"
                className="block w-full truncate rounded px-1.5 py-1 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {manifest?.nodes[id]?.name ?? id}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-secondary mt-2 w-full"
            onClick={() => {
              unhideAll();
              close();
            }}
          >
            Show all hidden models
          </button>
        </div>
      )}
    </Popover>
  );
}

export function GraphToolbar() {
  const manifest = useAppStore((s) => s.manifest);
  const canvasNodes = useAppStore((s) => s.canvasNodes);
  const expandDepth = useAppStore((s) => s.expandDepth);
  const setExpandDepth = useAppStore((s) => s.setExpandDepth);
  const requestLayout = useAppStore((s) => s.requestLayout);
  const setAllFolded = useAppStore((s) => s.setAllFolded);
  const folded = useAppStore((s) => s.folded);
  const layerFilter = useAppStore((s) => s.graphLayerFilter);
  const tagFilter = useAppStore((s) => s.graphTagFilter);
  const setLayerFilter = useAppStore((s) => s.setGraphLayerFilter);
  const setTagFilter = useAppStore((s) => s.setGraphTagFilter);
  const fullscreen = useAppStore((s) => s.fullscreen);
  const setFullscreen = useAppStore((s) => s.setFullscreen);
  const clearCanvas = useAppStore((s) => s.clearCanvas);
  const lineage = useAppStore((s) => s.lineage);
  const addNodes = useAppStore((s) => s.addNodes);
  const relatedOnly = useAppStore((s) => s.relatedOnly);
  const setRelatedOnly = useAppStore((s) => s.setRelatedOnly);

  const loadedNodes = useMemo(
    () => canvasNodes.map((id) => manifest?.nodes[id]).filter((n) => n !== undefined),
    [canvasNodes, manifest],
  );
  const layers = useMemo(() => allLayers(loadedNodes), [loadedNodes]);
  const tags = useMemo(() => allTags(loadedNodes), [loadedNodes]);
  const allFolded = canvasNodes.length > 0 && canvasNodes.every((id) => folded.has(id));
  const lineageMissing = lineage ? [...lineage.nodes].filter((id) => !canvasNodes.includes(id)).length : 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
      <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400" title="Select expand depth used by the + buttons">
        Depth
        <select
          value={expandDepth}
          onChange={(e) => setExpandDepth(Number(e.target.value))}
          className="rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <option key={d} value={d}>
              +{d}
            </option>
          ))}
        </select>
      </label>
      <div className="toolbar-sep" />
      <button type="button" title="Reorganize layout" onClick={requestLayout} className="toolbar-btn">
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        title={allFolded ? 'Unfold all' : 'Fold all'}
        onClick={() => setAllFolded(!allFolded)}
        className="toolbar-btn"
      >
        {allFolded ? <ChevronsUpDown className="h-4 w-4" /> : <ChevronsDownUp className="h-4 w-4" />}
      </button>
      <MultiSelectFilter
        label="Filter by layer"
        icon={<Layers className="h-4 w-4" />}
        options={layers}
        selected={layerFilter}
        onApply={setLayerFilter}
        emptyText="No nodes loaded"
      />
      <MultiSelectFilter
        label="Filter by tag"
        icon={<Tag className="h-4 w-4" />}
        options={tags}
        selected={tagFilter}
        onApply={setTagFilter}
        emptyText="No tags found"
      />
      <HiddenModels />
      {lineage && (
        <button
          type="button"
          title={relatedOnly ? 'Show all columns (Shift+F)' : 'Show only related columns (Shift+F)'}
          onClick={() => setRelatedOnly(!relatedOnly)}
          className={`toolbar-btn ${relatedOnly ? 'toolbar-btn-active' : ''}`}
        >
          <ListFilter className="h-4 w-4" />
        </button>
      )}
      {lineageMissing > 0 && lineage && (
        <button
          type="button"
          title="Load every model in the selected column's lineage (Shift+L)"
          onClick={() => addNodes([...lineage.nodes])}
          className="toolbar-btn toolbar-btn-active"
        >
          <Network className="h-4 w-4" />
          <span className="text-[10px] font-semibold">+{lineageMissing}</span>
        </button>
      )}
      <div className="toolbar-sep" />
      <BadgeToggle />
      <div className="toolbar-sep" />
      <DisplaySettingsPanel />
      <button type="button" title="Clear canvas" onClick={clearCanvas} className="toolbar-btn">
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
        onClick={() => setFullscreen(!fullscreen)}
        className="toolbar-btn"
      >
        {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>
    </div>
  );
}
