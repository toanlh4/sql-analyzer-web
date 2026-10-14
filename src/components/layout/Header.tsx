import { Keyboard, Moon, PanelLeft, PanelRight, Search, Sun, Upload } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function Header() {
  const metadata = useAppStore((s) => s.manifest?.metadata);
  const nodeCount = useAppStore((s) => (s.manifest ? Object.keys(s.manifest.nodes).length : 0));
  const fileName = useAppStore((s) => s.fileName);
  const theme = useAppStore((s) => s.theme);
  const leftOpen = useAppStore((s) => s.leftOpen);
  const rightOpen = useAppStore((s) => s.rightOpen);
  const { toggleTheme, setLeftOpen, setRightOpen, setSearchOpen, setShortcutsOpen, unload } = useAppStore.getState();

  const info = [
    metadata?.adapter_type,
    metadata?.dbt_version ? `dbt ${metadata.dbt_version}` : null,
    metadata?.colibri_version ? `colibri ${metadata.colibri_version}` : null,
    `${nodeCount} nodes`,
    metadata?.generated_at ? `generated ${new Date(metadata.generated_at).toLocaleString()}` : null,
  ].filter(Boolean);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-950">
      <button type="button" title="Toggle left sidebar (Ctrl+B)" onClick={() => setLeftOpen(!leftOpen)} className="toolbar-btn">
        <PanelLeft className="h-4 w-4" />
      </button>
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="font-semibold text-gray-900 dark:text-gray-100">Colibri</span>
        <span className="truncate text-sm text-gray-700 dark:text-gray-300" title={fileName ?? undefined}>
          {metadata?.dbt_project_name ?? fileName}
        </span>
        <span className="hidden truncate text-xs text-gray-400 lg:inline">{info.join(' · ')}</span>
      </div>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="mx-auto flex w-full max-w-sm items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-sm text-gray-400 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search</span>
        <kbd className="rounded border border-gray-200 px-1 text-[10px] dark:border-gray-700">Ctrl K</kbd>
      </button>

      <button type="button" title="Load another file" onClick={unload} className="toolbar-btn">
        <Upload className="h-4 w-4" />
      </button>
      <button type="button" title="Keyboard shortcuts (?)" onClick={() => setShortcutsOpen(true)} className="toolbar-btn">
        <Keyboard className="h-4 w-4" />
      </button>
      <button type="button" title={`Theme: ${theme}`} onClick={toggleTheme} className="toolbar-btn">
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <button type="button" title="Toggle right sidebar (Ctrl+\)" onClick={() => setRightOpen(!rightOpen)} className="toolbar-btn">
        <PanelRight className="h-4 w-4" />
      </button>
    </header>
  );
}
