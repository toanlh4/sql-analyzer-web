import {
  Box,
  Camera,
  Database,
  FileQuestion,
  Layers,
  LayoutDashboard,
  Sprout,
  type LucideIcon,
} from 'lucide-react';
import type { ColibriNode } from '../types/colibri';

export interface NodeStyle {
  icon: LucideIcon;
  /** Card border + background. */
  card: string;
  /** Card border on hover (when not selected). */
  hover: string;
  iconColor: string;
  label: string;
  /** Fill colour for the minimap. */
  minimap: string;
}

const STYLES: Record<string, NodeStyle> = {
  model: {
    icon: Layers,
    card: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/60',
    hover: 'hover:border-blue-300 dark:hover:border-blue-700',
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'Model',
    minimap: '#3b82f6',
  },
  source: {
    icon: Database,
    card: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/60',
    hover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    label: 'Source',
    minimap: '#10b981',
  },
  seed: {
    icon: Sprout,
    card: 'border-lime-200 bg-lime-50 dark:border-lime-800 dark:bg-lime-950/60',
    hover: 'hover:border-lime-300 dark:hover:border-lime-700',
    iconColor: 'text-lime-700 dark:text-lime-400',
    label: 'Seed',
    minimap: '#84cc16',
  },
  snapshot: {
    icon: Camera,
    card: 'border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/60',
    hover: 'hover:border-violet-300 dark:hover:border-violet-700',
    iconColor: 'text-violet-600 dark:text-violet-400',
    label: 'Snapshot',
    minimap: '#8b5cf6',
  },
  exposure: {
    icon: LayoutDashboard,
    card: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/60',
    hover: 'hover:border-orange-300 dark:hover:border-orange-700',
    iconColor: 'text-orange-600 dark:text-orange-400',
    label: 'Exposure',
    minimap: '#f97316',
  },
  unknown: {
    icon: FileQuestion,
    card: 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900',
    hover: 'hover:border-gray-400 dark:hover:border-gray-600',
    iconColor: 'text-gray-500',
    label: 'Unknown',
    minimap: '#9ca3af',
  },
};

export function nodeStyle(node: ColibriNode): NodeStyle {
  return STYLES[node.nodeType] ?? STYLES.unknown;
}

export const ephemeralIcon: LucideIcon = Box;

/**
 * "Layer" used by the layer filter: model type for models (staging, intermediate, ...),
 * otherwise the node type (source, seed, snapshot, exposure).
 */
export function nodeLayer(node: ColibriNode): string {
  if (node.nodeType === 'model') return node.modelType === 'unknown' ? 'other models' : node.modelType;
  return node.nodeType;
}
