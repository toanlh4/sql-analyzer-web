import type { LineageType } from '../../types/colibri';

const BADGES: Record<string, { letter: string; label: string; className: string }> = {
  'pass-through': { letter: 'P', label: 'Pass-through', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
  rename: { letter: 'R', label: 'Rename', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800' },
  transformation: { letter: 'T', label: 'Transformation', className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800' },
  unknown: { letter: 'U', label: 'Unknown', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
};

export function lineageLabel(type: LineageType | undefined): string {
  return BADGES[type ?? 'unknown']?.label ?? String(type);
}

export function LineageBadge({ type }: { type: LineageType | undefined }) {
  const badge = BADGES[type ?? 'unknown'] ?? BADGES.unknown;
  return (
    <span
      title={badge.label}
      className={`inline-flex h-4 w-4 items-center justify-center rounded-full border font-mono text-[10px] font-medium shadow-sm ${badge.className}`}
    >
      {badge.letter}
    </span>
  );
}
