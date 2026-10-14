import type { ColibriTree, PathTreeFolder } from '../types/colibri';

/** Generic folder tree for the sidebar: folders by name, leaf node ids under `items`. */
export interface TreeFolder {
  name: string;
  folders: TreeFolder[];
  items: string[];
}

function fromPathFolder(name: string, folder: PathTreeFolder): TreeFolder {
  const folders: TreeFolder[] = [];
  for (const [key, value] of Object.entries(folder)) {
    if (key === '__items__' || value === undefined || Array.isArray(value)) continue;
    folders.push(fromPathFolder(key === '__no_path__' ? '(no path)' : key, value));
  }
  return { name, folders, items: folder.__items__ ?? [] };
}

export function pathTree(tree: ColibriTree): TreeFolder {
  return {
    name: 'root',
    folders: Object.entries(tree.byPath).map(([project, folder]) => fromPathFolder(project, folder)),
    items: [],
  };
}

export function databaseTree(tree: ColibriTree): TreeFolder {
  return {
    name: 'root',
    folders: Object.entries(tree.byDatabase).map(([db, schemas]) => ({
      name: db,
      folders: Object.entries(schemas).map(([schema, ids]) => ({ name: schema, folders: [], items: ids })),
      items: [],
    })),
    items: [],
  };
}
