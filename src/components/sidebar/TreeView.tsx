import { useState } from 'react';
import { ChevronRight, Folder, FolderOpen } from 'lucide-react';
import type { ColibriNode } from '../../types/colibri';
import { nodeStyle } from '../../lib/nodeStyle';
import type { TreeFolder } from '../../lib/tree';

interface TreeViewProps {
  folder: TreeFolder;
  nodes: Record<string, ColibriNode>;
  isVisible: (id: string) => boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  /** Expand everything (used while searching). */
  forceOpen: boolean;
  depth?: number;
}

function countVisible(folder: TreeFolder, isVisible: (id: string) => boolean): number {
  return folder.items.filter(isVisible).length + folder.folders.reduce((sum, f) => sum + countVisible(f, isVisible), 0);
}

function FolderRow({ folder, depth, ...rest }: TreeViewProps & { depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const count = countVisible(folder, rest.isVisible);
  if (count === 0) return null;
  const isOpen = rest.forceOpen || open;
  const Icon = isOpen ? FolderOpen : Folder;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        style={{ paddingLeft: depth * 12 + 4 }}
        className="flex w-full items-center gap-1 rounded py-1 pr-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <ChevronRight className={`h-3 w-3 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <span className="min-w-0 flex-1 truncate">{folder.name}</span>
        <span className="text-[10px] text-gray-400">{count}</span>
      </button>
      {isOpen && <TreeContents folder={folder} depth={depth + 1} {...rest} />}
    </div>
  );
}

function TreeContents({ folder, depth = 0, ...rest }: TreeViewProps) {
  return (
    <>
      {folder.folders.map((child) => (
        <FolderRow key={child.name} folder={child} depth={depth} {...rest} />
      ))}
      {folder.items.filter(rest.isVisible).map((id) => {
        const node = rest.nodes[id];
        if (!node) return null;
        const style = nodeStyle(node);
        const Icon = style.icon;
        return (
          <button
            key={id}
            type="button"
            title={node.fullName}
            onClick={() => rest.onSelect(id)}
            style={{ paddingLeft: depth * 12 + 20 }}
            className={`flex w-full items-center gap-1.5 rounded py-1 pr-2 text-left text-sm ${
              rest.activeId === id
                ? 'bg-blue-100 font-medium text-blue-800 dark:bg-blue-900/60 dark:text-blue-100'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${style.iconColor}`} />
            <span className="min-w-0 flex-1 truncate">{node.name}</span>
          </button>
        );
      })}
    </>
  );
}

export function TreeView(props: TreeViewProps) {
  return <TreeContents {...props} depth={props.depth ?? 0} />;
}
