import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { dbtCommand } from '../../lib/dbtCommand';

export interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
}

interface Props {
  menu: ContextMenuState;
  onClose: () => void;
}

export function NodeContextMenu({ menu, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const manifest = useAppStore((s) => s.manifest);
  const selectedNodes = useAppStore((s) => s.selectedNodes);
  const folded = useAppStore((s) => s.folded);
  const expandDepth = useAppStore((s) => s.expandDepth);
  const { openDetails, toggleFold, hideNodes, expand, focusNode } = useAppStore.getState();

  // Act on the whole selection if the right-clicked node is part of it.
  const targets = selectedNodes.includes(menu.nodeId) ? selectedNodes : [menu.nodeId];
  const node = manifest?.nodes[menu.nodeId];

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as globalThis.Node)) onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  if (!node || !manifest) return null;

  const items: { label: string; hint?: string; action: () => void }[] = [
    { label: 'Show details', action: () => openDetails(menu.nodeId) },
    { label: 'Focus on this node', action: () => focusNode(menu.nodeId) },
    { label: targets.every((t) => folded.has(t)) ? 'Unfold' : 'Fold', hint: 'Tab', action: () => toggleFold(targets) },
    { label: `Load +${expandDepth} parents`, hint: `Shift+${expandDepth}`, action: () => expand(targets, 'parents', expandDepth) },
    { label: `Load +${expandDepth} children`, hint: `${expandDepth}`, action: () => expand(targets, 'children', expandDepth) },
    {
      label: 'Copy dbt command',
      hint: 'Ctrl+C',
      action: () => void navigator.clipboard.writeText(dbtCommand(targets.map((t) => manifest.nodes[t]).filter((n) => n !== undefined))),
    },
    { label: 'Open documentation', action: () => navigate(`/docs/${encodeURIComponent(menu.nodeId)}`) },
    { label: targets.length > 1 ? `Hide ${targets.length} nodes` : 'Hide', hint: 'H', action: () => hideNodes(targets) },
  ];

  return (
    <div
      ref={ref}
      style={{ left: menu.x, top: menu.y }}
      className="fixed z-50 min-w-52 rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="truncate border-b border-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:border-gray-800">
        {targets.length > 1 ? `${targets.length} nodes selected` : node.name}
      </div>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            item.action();
            onClose();
          }}
          className="flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <span>{item.label}</span>
          {item.hint && <kbd className="text-[10px] text-gray-400">{item.hint}</kbd>}
        </button>
      ))}
    </div>
  );
}
