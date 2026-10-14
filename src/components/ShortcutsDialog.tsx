import { useAppStore } from '../store/useAppStore';
import { SHORTCUTS } from '../lib/shortcuts';

export function ShortcutsDialog() {
  const open = useAppStore((s) => s.shortcutsOpen);
  const setOpen = useAppStore((s) => s.setShortcutsOpen);
  if (!open) return null;

  const sections = [...new Set(SHORTCUTS.map((s) => s.section))];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onMouseDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-label="Keyboard Shortcuts"
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h2>
        {sections.map((section) => (
          <div key={section} className="mb-4">
            <h3 className="mb-1.5 text-[10px] font-medium tracking-wide text-gray-500 uppercase">{section}</h3>
            <ul className="space-y-1">
              {SHORTCUTS.filter((s) => s.section === section).map((s) => (
                <li key={`${s.section}-${s.label}`} className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <div className="text-gray-900 dark:text-gray-100">{s.label}</div>
                    <div className="text-xs text-gray-500">{s.description}</div>
                  </div>
                  <kbd className="shrink-0 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[11px] text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {s.keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="flex justify-end">
          <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
