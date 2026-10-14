import { create } from 'zustand';
import type { ColibriManifest } from '../types/colibri';
import { buildGraphIndex, type GraphIndex } from '../lib/graphIndex';
import { columnLineage, expandModels, type ColumnLineage, type Direction } from '../lib/lineage';

export type BadgeMode = 'off' | '1' | 'all';
export type Theme = 'light' | 'dark';

export interface SelectedColumn {
  node: string;
  column: string;
}

/** Right-click menu on a node card, or on one of its columns when `column` is set. */
export interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
  column?: string;
}

export interface DisplaySettings {
  /** Max height of a table node in px; 0 = grow to fit all columns. */
  nodeMaxHeight: number;
  /** Height of one column row in px. */
  rowHeight: number;
  showMinimap: boolean;
}

export const DEFAULT_DISPLAY: DisplaySettings = { nodeMaxHeight: 0, rowHeight: 24, showMinimap: true };

interface AppState {
  manifest: ColibriManifest | null;
  index: GraphIndex | null;
  fileName: string | null;

  /** Node ids currently loaded on the canvas, in insertion order. */
  canvasNodes: string[];
  hidden: Set<string>;
  folded: Set<string>;
  /** Positions set by layout or by dragging. */
  positions: Record<string, { x: number; y: number }>;
  /** Incremented whenever a full re-layout is wanted. */
  layoutRequest: number;

  selectedNodes: string[];
  /** Node shown in the right sidebar. */
  detailNode: string | null;
  selectedColumn: SelectedColumn | null;
  lineage: ColumnLineage | null;
  /** Hide columns that are not part of the selected column's lineage (on nodes in that lineage). */
  relatedOnly: boolean;
  contextMenu: ContextMenuState | null;
  display: DisplaySettings;

  graphLayerFilter: string[];
  graphTagFilter: string[];
  expandDepth: number;
  badgeMode: BadgeMode;

  theme: Theme;
  leftOpen: boolean;
  rightOpen: boolean;
  searchOpen: boolean;
  shortcutsOpen: boolean;
  fullscreen: boolean;

  loadManifest: (manifest: ColibriManifest, fileName: string) => void;
  unload: () => void;

  /** Replace the canvas with a node and one layer of parents/children, then focus it. */
  focusNode: (id: string) => void;
  addNodes: (ids: string[]) => void;
  expand: (ids: string[], direction: Direction, depth: number) => void;
  hideNodes: (ids: string[]) => void;
  unhide: (id: string) => void;
  unhideAll: () => void;
  toggleFold: (ids: string[]) => void;
  setAllFolded: (folded: boolean) => void;
  clearCanvas: () => void;
  requestLayout: () => void;
  setPositions: (positions: Record<string, { x: number; y: number }>) => void;
  movePosition: (id: string, position: { x: number; y: number }) => void;

  setSelectedNodes: (ids: string[]) => void;
  openDetails: (id: string | null) => void;
  selectColumn: (column: SelectedColumn | null) => void;
  clearSelection: () => void;
  /** Select `column` (if given and not already selected) and show only its related columns, or toggle off. */
  setRelatedOnly: (on: boolean, column?: SelectedColumn) => void;
  openContextMenu: (menu: ContextMenuState) => void;
  closeContextMenu: () => void;
  /** Update display settings; pass `relayout: false` for live preview while dragging a slider. */
  setDisplay: (settings: Partial<DisplaySettings>, relayout?: boolean) => void;

  setGraphLayerFilter: (layers: string[]) => void;
  setGraphTagFilter: (tags: string[]) => void;
  setExpandDepth: (depth: number) => void;
  setBadgeMode: (mode: BadgeMode) => void;

  toggleTheme: () => void;
  setLeftOpen: (open: boolean) => void;
  setRightOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
}

const THEME_KEY = 'colibri-theme';
const DISPLAY_KEY = 'colibri-display';

function initialDisplay(): DisplaySettings {
  try {
    const saved = JSON.parse(localStorage.getItem(DISPLAY_KEY) ?? '{}') as Partial<DisplaySettings>;
    return {
      nodeMaxHeight: typeof saved.nodeMaxHeight === 'number' ? saved.nodeMaxHeight : DEFAULT_DISPLAY.nodeMaxHeight,
      rowHeight: typeof saved.rowHeight === 'number' ? saved.rowHeight : DEFAULT_DISPLAY.rowHeight,
      showMinimap: typeof saved.showMinimap === 'boolean' ? saved.showMinimap : DEFAULT_DISPLAY.showMinimap,
    };
  } catch {
    return DEFAULT_DISPLAY;
  }
}

function initialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

const emptyCanvas = {
  canvasNodes: [] as string[],
  hidden: new Set<string>(),
  folded: new Set<string>(),
  positions: {} as Record<string, { x: number; y: number }>,
  selectedNodes: [] as string[],
  detailNode: null,
  selectedColumn: null,
  lineage: null,
  relatedOnly: false,
  contextMenu: null,
};

const theme = initialTheme();
applyTheme(theme);

export const useAppStore = create<AppState>()((set, get) => {
  /** Add ids to the canvas (un-hiding them) and trigger a layout if anything changed. */
  const mergeIntoCanvas = (ids: Iterable<string>) => {
    const { canvasNodes, hidden, manifest } = get();
    if (!manifest) return;
    const present = new Set(canvasNodes);
    const nextHidden = new Set(hidden);
    const added: string[] = [];
    for (const id of ids) {
      if (!manifest.nodes[id]) continue;
      nextHidden.delete(id);
      if (!present.has(id)) {
        present.add(id);
        added.push(id);
      }
    }
    if (added.length === 0 && nextHidden.size === hidden.size) return;
    set((s) => ({ canvasNodes: [...s.canvasNodes, ...added], hidden: nextHidden, layoutRequest: s.layoutRequest + 1 }));
  };

  return {
    manifest: null,
    index: null,
    fileName: null,
    ...emptyCanvas,
    layoutRequest: 0,
    graphLayerFilter: [],
    graphTagFilter: [],
    expandDepth: 1,
    badgeMode: '1',
    display: initialDisplay(),
    theme,
    leftOpen: true,
    rightOpen: true,
    searchOpen: false,
    shortcutsOpen: false,
    fullscreen: false,

    loadManifest: (manifest, fileName) =>
      set({ manifest, index: buildGraphIndex(manifest), fileName, ...emptyCanvas, hidden: new Set(), folded: new Set(), graphLayerFilter: [], graphTagFilter: [] }),
    unload: () => set({ manifest: null, index: null, fileName: null, ...emptyCanvas, hidden: new Set(), folded: new Set() }),

    focusNode: (id) => {
      const { index, manifest } = get();
      if (!index || !manifest?.nodes[id]) return;
      const ids = [id, ...expandModels(index, [id], 'parents', 1), ...expandModels(index, [id], 'children', 1)];
      set((s) => ({
        canvasNodes: ids,
        hidden: new Set(),
        positions: {},
        selectedNodes: [id],
        detailNode: id,
        selectedColumn: null,
        lineage: null,
        relatedOnly: false,
        layoutRequest: s.layoutRequest + 1,
      }));
    },
    addNodes: (ids) => mergeIntoCanvas(ids),
    expand: (ids, direction, depth) => {
      const { index } = get();
      if (!index || ids.length === 0) return;
      mergeIntoCanvas(expandModels(index, ids, direction, depth));
    },
    hideNodes: (ids) =>
      set((s) => {
        const hidden = new Set(s.hidden);
        ids.forEach((id) => hidden.add(id));
        return {
          hidden,
          selectedNodes: s.selectedNodes.filter((id) => !hidden.has(id)),
          detailNode: s.detailNode && hidden.has(s.detailNode) ? null : s.detailNode,
        };
      }),
    unhide: (id) =>
      set((s) => {
        const hidden = new Set(s.hidden);
        hidden.delete(id);
        return { hidden };
      }),
    unhideAll: () => set({ hidden: new Set() }),
    toggleFold: (ids) =>
      set((s) => {
        const folded = new Set(s.folded);
        const foldAll = ids.some((id) => !folded.has(id));
        ids.forEach((id) => (foldAll ? folded.add(id) : folded.delete(id)));
        return { folded };
      }),
    setAllFolded: (fold) => set((s) => ({ folded: fold ? new Set(s.canvasNodes) : new Set() })),
    clearCanvas: () => set({ ...emptyCanvas, hidden: new Set(), folded: new Set() }),
    requestLayout: () => set((s) => ({ layoutRequest: s.layoutRequest + 1 })),
    setPositions: (positions) => set({ positions }),
    movePosition: (id, position) => set((s) => ({ positions: { ...s.positions, [id]: position } })),

    setSelectedNodes: (ids) => set({ selectedNodes: ids }),
    openDetails: (id) => set((s) => ({ detailNode: id, rightOpen: id ? true : s.rightOpen })),
    selectColumn: (column) => {
      const { index, relatedOnly } = get();
      // Turning off the lineage also turns off "related only"; re-layout since node heights change back.
      const clear = () => set((s) => ({ selectedColumn: null, lineage: null, relatedOnly: false, layoutRequest: s.layoutRequest + (relatedOnly ? 1 : 0) }));
      if (!column || !index) {
        clear();
        return;
      }
      const current = get().selectedColumn;
      if (current && current.node === column.node && current.column === column.column) {
        clear();
        return;
      }
      set((s) => ({
        selectedColumn: column,
        lineage: columnLineage(index, column.node, column.column),
        layoutRequest: s.layoutRequest + (relatedOnly ? 1 : 0),
      }));
    },
    clearSelection: () =>
      set((s) => ({
        selectedNodes: [],
        selectedColumn: null,
        lineage: null,
        relatedOnly: false,
        contextMenu: null,
        layoutRequest: s.layoutRequest + (s.relatedOnly ? 1 : 0),
      })),
    setRelatedOnly: (on, column) => {
      const { index, selectedColumn } = get();
      const target = column ?? selectedColumn;
      if (!index || !target) return;
      const sameColumn = selectedColumn?.node === target.node && selectedColumn.column === target.column;
      set((s) => ({
        selectedColumn: target,
        lineage: sameColumn && s.lineage ? s.lineage : columnLineage(index, target.node, target.column),
        relatedOnly: on,
        layoutRequest: s.layoutRequest + 1,
      }));
    },
    openContextMenu: (contextMenu) => set({ contextMenu }),
    closeContextMenu: () => set({ contextMenu: null }),
    setDisplay: (settings, relayout = true) =>
      set((s) => {
        const display = { ...s.display, ...settings };
        localStorage.setItem(DISPLAY_KEY, JSON.stringify(display));
        return { display, layoutRequest: s.layoutRequest + (relayout ? 1 : 0) };
      }),

    setGraphLayerFilter: (graphLayerFilter) => set({ graphLayerFilter }),
    setGraphTagFilter: (graphTagFilter) => set({ graphTagFilter }),
    setExpandDepth: (expandDepth) => set({ expandDepth }),
    setBadgeMode: (badgeMode) => set({ badgeMode }),

    toggleTheme: () => {
      const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
      set({ theme: next });
    },
    setLeftOpen: (leftOpen) => set({ leftOpen }),
    setRightOpen: (rightOpen) => set({ rightOpen }),
    setSearchOpen: (searchOpen) => set({ searchOpen }),
    setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
    setFullscreen: (fullscreen) => set({ fullscreen }),
  };
});
