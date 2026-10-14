export interface ShortcutDef {
  keys: string;
  section: string;
  label: string;
  description: string;
}

/** Keyboard shortcuts, matching the original dbt-colibri report. */
export const SHORTCUTS: ShortcutDef[] = [
  { keys: 'Ctrl+K', section: 'Global', label: 'Search', description: 'Open search across models and columns.' },
  { keys: 'Ctrl+B', section: 'Global', label: 'Toggle left sidebar', description: 'Show or hide the left navigation sidebar.' },
  { keys: 'Ctrl+\\', section: 'Global', label: 'Toggle right sidebar', description: 'Show or hide the right metadata sidebar.' },
  { keys: '?', section: 'Global', label: 'Keyboard shortcuts', description: 'Show this help.' },
  { keys: 'Tab', section: 'Lineage — Selection', label: 'Toggle fold', description: 'Fold or unfold the currently selected node(s).' },
  { keys: 'H', section: 'Lineage — Selection', label: 'Hide selected', description: 'Hide the currently selected node(s) from the graph.' },
  { keys: 'Ctrl+C', section: 'Lineage — Selection', label: 'Copy dbt command', description: 'Copy a dbt command for the current selection.' },
  { keys: 'Escape', section: 'Lineage — Selection', label: 'Clear selection', description: 'Deselect all nodes and close any open context menus.' },
  { keys: 'Shift+F', section: 'Lineage — Column', label: 'Show only related columns', description: 'Toggle hiding columns outside the selected column\'s lineage in its source and target tables.' },
  { keys: 'Shift+L', section: 'Lineage — Column', label: 'Load lineage models', description: 'Add every model in the selected column\'s lineage to the graph.' },
  { keys: 'Right-click', section: 'Lineage — Column', label: 'Column menu', description: 'Open the column context menu.' },
  { keys: 'Escape', section: 'Lineage — View', label: 'Exit fullscreen', description: 'Exit lineage fullscreen mode.' },
  { keys: '1 … 9', section: 'Lineage — Depth', label: 'Load +N children', description: 'Load N layers of downstream (child) models from the current selection.' },
  { keys: 'Shift+1 … 9', section: 'Lineage — Depth', label: 'Load +N parents', description: 'Load N layers of upstream (parent) models from the current selection.' },
];
