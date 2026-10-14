import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Hover tooltip rendered in a portal, so it isn't clipped by scrolling containers
 * (like a node's column list) or scaled by the canvas zoom.
 */
export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <span
      className={`inline-flex ${className}`}
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: r.left + r.width / 2, y: r.top });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{ left: pos.x, top: pos.y - 6 }}
            className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-full rounded-md bg-gray-900 px-2 py-1 text-[11px] whitespace-nowrap text-white shadow-lg dark:bg-gray-100 dark:text-gray-900"
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}
