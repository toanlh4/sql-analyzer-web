import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { dbtCommand } from '../../lib/dbtCommand';
import { columnLineage } from '../../lib/lineage';

interface MenuItem {
  label: string;
  hint?: string;
  checked?: boolean;
  disabled?: boolean;
  action: () => void;
}

function useNodeItems(nodeId: string): MenuItem[] {
  const navigate = useNavigate();
  const manifest = useAppStore((s) => s.manifest);
  const selectedNodes = useAppStore((s) => s.selectedNodes);
  const folded = useAppStore((s) => s.folded);
  const expandDepth = useAppStore((s) => s.expandDepth);
  const { openDetails, toggleFold, hideNodes, expand, focusNode } = useAppStore.getState();
  if (!manifest) return [];

  // Act on the whole selection if the right-clicked node is part of it.
  const targets = selectedNodes.includes(nodeId) ? selectedNodes : [nodeId];
  return [
    { label: 'Show details', action: () => openDetails(nodeId) },
    { label: 'Focus on this node', action: () => focusNode(nodeId) },
    { label: targets.every((t) => folded.has(t)) ? 'Unfold' : 'Fold', hint: 'Tab', action: () => toggleFold(targets) },
    { label: `Load +${expandDepth} parents`, hint: `Shift+${expandDepth}`, action: () => expand(targets, 'parents', expandDepth) },
    { label: `Load +${expandDepth} children`, hint: `${expandDepth}`, action: () => expand(targets, 'children', expandDepth) },
    {
      label: 'Copy dbt command',
      hint: 'Ctrl+C',
      action: () => void navigator.clipboard.writeText(dbtCommand(targets.map((t) => manifest.nodes[t]).filter((n) => n !== undefined))),
    },
    { label: 'Open documentation', action: () => navigate(`/docs/${encodeURIComponent(nodeId)}`) },
    { label: targets.length > 1 ? `Hide ${targets.length} nodes` : 'Hide', hint: 'H', action: () => hideNodes(targets) },
  ];
}

function useColumnItems(nodeId: string, column: string): MenuItem[] {
  const index = useAppStore((s) => s.index);
  const selectedColumn = useAppStore((s) => s.selectedColumn);
  const relatedOnly = useAppStore((s) => s.relatedOnly);
  const canvasNodes = useAppStore((s) => s.canvasNodes);
  const lineageKinds = useAppStore((s) => s.lineageKinds);
  const { selectColumn, setRelatedOnly, addNodes, openDetails } = useAppStore.getState();
  if (!index) return [];

  const ref = { node: nodeId, column };
  const isSelected = selectedColumn?.node === nodeId && selectedColumn.column === column;
  const lineage = columnLineage(index, nodeId, column, lineageKinds);
  const missing = [...lineage.nodes].filter((id) => !canvasNodes.includes(id));
  const hasLineage = lineage.columns.size > 1 || lineage.nodes.size > 1;

  return [
    { label: isSelected ? 'Clear lineage' : 'Trace lineage', hint: isSelected ? 'Esc' : 'Click', action: () => selectColumn(ref) },
    {
      label: 'Show only related columns',
      hint: 'Shift+F',
      checked: isSelected && relatedOnly,
      disabled: !hasLineage,
      action: () => setRelatedOnly(!(isSelected && relatedOnly), ref),
    },
    {
      label: missing.length > 0 ? `Load lineage models (+${missing.length})` : 'Load lineage models',
      hint: 'Shift+L',
      disabled: missing.length === 0,
      action: () => {
        if (!isSelected) selectColumn(ref);
        addNodes([...lineage.nodes]);
      },
    },
    {
      label: 'Show column in details',
      action: () => {
        if (!isSelected) selectColumn(ref);
        openDetails(nodeId);
      },
    },
    { label: 'Copy column name', action: () => void navigator.clipboard.writeText(column) },
  ];
}

function MenuBody({ title, items, onClose }: { title: string; items: MenuItem[]; onClose: () => void }) {
  return (
    <>
      <div className="truncate border-b border-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:border-gray-800">{title}</div>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          disabled={item.disabled}
          onClick={() => {
            item.action();
            onClose();
          }}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-gray-700 hover:bg-gray-100 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <span className="w-3.5 shrink-0">{item.checked && <Check className="h-3.5 w-3.5 text-blue-600" />}</span>
          <span className="flex-1">{item.label}</span>
          {item.hint && <kbd className="text-[10px] text-gray-400">{item.hint}</kbd>}
        </button>
      ))}
    </>
  );
}

function NodeMenu({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const items = useNodeItems(nodeId);
  const selectedNodes = useAppStore((s) => s.selectedNodes);
  const name = useAppStore((s) => s.manifest?.nodes[nodeId]?.name ?? nodeId);
  const title = selectedNodes.includes(nodeId) && selectedNodes.length > 1 ? `${selectedNodes.length} nodes selected` : name;
  return <MenuBody title={title} items={items} onClose={onClose} />;
}

function ColumnMenu({ nodeId, column, onClose }: { nodeId: string; column: string; onClose: () => void }) {
  const items = useColumnItems(nodeId, column);
  const name = useAppStore((s) => s.manifest?.nodes[nodeId]?.name ?? nodeId);
  return <MenuBody title={`${name}.${column}`} items={items} onClose={onClose} />;
}

/** Right-click menu for node cards and their columns; state lives in the store. */
export function NodeContextMenu() {
  const ref = useRef<HTMLDivElement>(null);
  const menu = useAppStore((s) => s.contextMenu);
  const closeContextMenu = useAppStore((s) => s.closeContextMenu);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as globalThis.Node)) closeContextMenu();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menu, closeContextMenu]);

  if (!menu) return null;
  // Keep the menu on screen.
  const left = Math.min(menu.x, window.innerWidth - 260);
  const top = Math.min(menu.y, window.innerHeight - 300);

  return (
    <div
      ref={ref}
      style={{ left, top }}
      className="fixed z-50 min-w-60 rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900"
      onContextMenu={(e) => e.preventDefault()}
    >
      {menu.column ? (
        <ColumnMenu nodeId={menu.nodeId} column={menu.column} onClose={closeContextMenu} />
      ) : (
        <NodeMenu nodeId={menu.nodeId} onClose={closeContextMenu} />
      )}
    </div>
  );
}
