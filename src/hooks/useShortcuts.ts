import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { dbtCommand } from '../lib/dbtCommand';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Global keyboard shortcuts. `lineageActive` enables the graph-only shortcuts. */
export function useShortcuts(lineageActive: boolean): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useAppStore.getState();
      if (!s.manifest) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'k') {
        e.preventDefault();
        s.setSearchOpen(!s.searchOpen);
        return;
      }
      if (s.searchOpen || s.shortcutsOpen) {
        if (e.key === 'Escape') {
          s.setSearchOpen(false);
          s.setShortcutsOpen(false);
        }
        return;
      }
      if (isTyping(e.target)) return;

      if (mod && key === 'b') {
        e.preventDefault();
        s.setLeftOpen(!s.leftOpen);
        return;
      }
      if (mod && e.key === '\\') {
        e.preventDefault();
        s.setRightOpen(!s.rightOpen);
        return;
      }
      if (e.key === '?') {
        s.setShortcutsOpen(true);
        return;
      }
      if (!lineageActive) return;

      const targets = s.selectedNodes.length > 0 ? s.selectedNodes : s.detailNode ? [s.detailNode] : [];

      if (e.key === 'Escape') {
        if (s.contextMenu) s.closeContextMenu();
        else if (s.fullscreen) s.setFullscreen(false);
        else s.clearSelection();
        return;
      }
      if (mod && key === 'c') {
        if (window.getSelection()?.toString()) return; // let normal copy work
        const command = dbtCommand(targets.map((id) => s.manifest?.nodes[id]).filter((n) => n !== undefined));
        if (command) {
          e.preventDefault();
          void navigator.clipboard.writeText(command);
        }
        return;
      }
      // Column shortcuts act on the selected (traced) column.
      if (e.shiftKey && !mod && !e.altKey && s.selectedColumn) {
        if (key === 'f') {
          e.preventDefault();
          s.closeContextMenu();
          s.setRelatedOnly(!s.relatedOnly);
          return;
        }
        if (key === 'l' && s.lineage) {
          e.preventDefault();
          s.closeContextMenu();
          s.addNodes([...s.lineage.nodes]);
          return;
        }
      }
      if (mod || e.altKey || targets.length === 0) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        s.toggleFold(targets);
        return;
      }
      if (key === 'h') {
        s.hideNodes(targets);
        return;
      }
      const digit = /^Digit([1-9])$/.exec(e.code);
      if (digit) {
        e.preventDefault();
        s.expand(targets, e.shiftKey ? 'parents' : 'children', Number(digit[1]));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lineageActive]);
}
