import { Settings2 } from 'lucide-react';
import { DEFAULT_DISPLAY, useAppStore } from '../../store/useAppStore';
import { Popover } from '../common/Popover';
import { ALL_LINEAGE_KINDS, LINEAGE_KINDS, type LineageKind } from '../../lib/lineage';

const HEIGHT_PRESETS = [
  { label: 'Fit all', value: 0 },
  { label: 'S', value: 300 },
  { label: 'M', value: 500 },
  { label: 'L', value: 800 },
];

const ROW_PRESETS = [
  { label: 'Compact', value: 18 },
  { label: 'Default', value: 24 },
  { label: 'Comfortable', value: 32 },
];

function Presets({ options, value, onPick }: { options: { label: string; value: number }[]; value: number; onPick: (v: number) => void }) {
  return (
    <div className="inline-flex w-full rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={() => onPick(o.value)}
          className={`flex-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${
            value === o.value ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-100' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Slider that previews live while dragging and re-runs the layout once on release.
 */
function Slider({ min, max, step, value, disabled, onChange }: { min: number; max: number; step: number; value: number; disabled?: boolean; onChange: (v: number, commit: boolean) => void }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value), false)}
      onPointerUp={(e) => onChange(Number(e.currentTarget.value), true)}
      onKeyUp={(e) => onChange(Number(e.currentTarget.value), true)}
      className="w-full accent-blue-600 disabled:opacity-40"
    />
  );
}

function LineageKindsSetting() {
  const lineageKinds = useAppStore((s) => s.lineageKinds);
  const setLineageKinds = useAppStore((s) => s.setLineageKinds);
  const toggle = (kind: LineageKind) =>
    setLineageKinds(lineageKinds.includes(kind) ? lineageKinds.filter((k) => k !== kind) : [...lineageKinds, kind]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900 dark:text-gray-100">Lineage types</span>
        <span className="text-xs text-gray-500">
          {lineageKinds.length === ALL_LINEAGE_KINDS.length ? 'All' : `${lineageKinds.length} of ${ALL_LINEAGE_KINDS.length}`}
        </span>
      </div>
      <div className="space-y-1">
        {LINEAGE_KINDS.map((k) => {
          const checked = lineageKinds.includes(k.value);
          const isLast = checked && lineageKinds.length === 1;
          return (
            <label
              key={k.value}
              title={isLast ? 'At least one lineage type must stay selected' : k.description}
              className={`flex items-center gap-2 ${isLast ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input type="checkbox" className="accent-blue-600" checked={checked} disabled={isLast} onChange={() => toggle(k.value)} />
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{k.label}</span>
            </label>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-500">Which expressions to follow when tracing a column's lineage.</p>
    </div>
  );
}

export function DisplaySettingsPanel() {
  const display = useAppStore((s) => s.display);
  const setDisplay = useAppStore((s) => s.setDisplay);
  const requestLayout = useAppStore((s) => s.requestLayout);
  const fitAll = display.nodeMaxHeight === 0;

  return (
    <Popover
      align="right"
      trigger={({ open, toggle }) => (
        <button type="button" title="Display settings" onClick={toggle} className={`toolbar-btn ${open ? 'toolbar-btn-active' : ''}`}>
          <Settings2 className="h-4 w-4" />
        </button>
      )}
    >
      {() => (
        <div className="w-64 space-y-4 p-1 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900 dark:text-gray-100">Table height</span>
              <span className="text-xs text-gray-500">{fitAll ? 'Fit all columns' : `max ${display.nodeMaxHeight}px`}</span>
            </div>
            <Presets options={HEIGHT_PRESETS} value={display.nodeMaxHeight} onPick={(v) => setDisplay({ nodeMaxHeight: v })} />
            <Slider
              min={150}
              max={1500}
              step={10}
              value={fitAll ? 1500 : display.nodeMaxHeight}
              onChange={(v, commit) => (commit ? requestLayout() : setDisplay({ nodeMaxHeight: v }, false))}
            />
            <p className="text-[11px] text-gray-500">Tables taller than this get a scroll bar (mouse wheel scrolls the column list).</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900 dark:text-gray-100">Row height</span>
              <span className="text-xs text-gray-500">{display.rowHeight}px</span>
            </div>
            <Presets options={ROW_PRESETS} value={display.rowHeight} onPick={(v) => setDisplay({ rowHeight: v })} />
            <Slider min={16} max={48} step={1} value={display.rowHeight} onChange={(v, commit) => (commit ? requestLayout() : setDisplay({ rowHeight: v }, false))} />
          </div>

          <LineageKindsSetting />

          <label className="flex cursor-pointer items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-gray-100">Show minimap</span>
            <input
              type="checkbox"
              className="accent-blue-600"
              checked={display.showMinimap}
              onChange={(e) => setDisplay({ showMinimap: e.target.checked }, false)}
            />
          </label>

          <button type="button" className="btn-secondary w-full" onClick={() => setDisplay(DEFAULT_DISPLAY)}>
            Reset to defaults
          </button>
        </div>
      )}
    </Popover>
  );
}
