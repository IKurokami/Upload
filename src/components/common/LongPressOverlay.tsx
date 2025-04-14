import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

export type Action = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
};

type LongPressOverlayProps = {
  rect: DOMRect | null;
  actions: Action[];
  onClose: () => void;
  highlightRadius?: number;
  renderHighlighted?: () => React.ReactNode;
};

const overlayRoot =
  document.getElementById("long-press-overlay-root") || document.body;

export const LongPressOverlay: React.FC<LongPressOverlayProps> = ({
  rect,
  actions,
  onClose,
  highlightRadius = 8,
  renderHighlighted,
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  useLayoutEffect(() => {
    if (!rect || !menuRef.current) return;

    const menu = menuRef.current;
    // Estimate menu size
    const menuRect = menu.getBoundingClientRect();
    const overlayWidth = menuRect.width;
    const overlayHeight = menuRect.height;

    const gap = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Try bottom
    let top = rect.bottom + gap;
    let left = rect.left;

    // Prefer bottom
    if (top + overlayHeight <= viewportHeight) {
      // If fits, do nothing
    } else {
      // Try top
      const tryTop = rect.top - gap - overlayHeight;
      if (tryTop >= 0) {
        top = tryTop - gap;
      } else {
        // Try left
        const tryLeft = rect.left - gap - overlayWidth;
        if (tryLeft >= 0) {
          top = rect.top;
          left = tryLeft;
        } else {
          // Try right
          const tryRight = rect.right + gap;
          if (tryRight + overlayWidth <= viewportWidth) {
            top = rect.top;
            left = tryRight;
          } else {
            // Clamp to viewport
            top = Math.max(
              gap,
              Math.min(viewportHeight - overlayHeight - gap, rect.top)
            );
            left = Math.max(
              gap,
              Math.min(viewportWidth - overlayWidth - gap, rect.left)
            );
          }
        }
      }
    }

    // Clamp left/right to viewport
    left = Math.max(gap, Math.min(viewportWidth - overlayWidth - gap, left));
    // Clamp top/bottom to viewport
    top = Math.max(gap, Math.min(viewportHeight - overlayHeight - gap, top));

    setMenuPos({ top, left });
  }, [rect, actions.length]);

  if (!rect) return null;

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    top: menuPos.top,
    left: menuPos.left,
    zIndex: 10002,
    minWidth: 160,
    background: "var(--background, #fff)",
    borderRadius: 8,
    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
    padding: 8,
  };

  // Highlight box style
  const highlightStyle: React.CSSProperties = {
    position: "fixed",
    top: rect.top - highlightRadius,
    left: rect.left - highlightRadius,
    width: rect.width + highlightRadius * 2,
    height: rect.height + highlightRadius * 2,
    zIndex: 10003,
    pointerEvents: "none",
    transition: "all 0.2s",
  };

  // Blur overlay style
  const blurStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 10001,
    backdropFilter: "blur(6px)",
    background: "rgba(0,0,0,0.08)",
    transition: "backdrop-filter 0.2s",
  };

  return ReactDOM.createPortal(
    <>
      <div style={blurStyle} onClick={onClose} aria-label="Close overlay" />
      {renderHighlighted && (
        <div style={highlightStyle}>{renderHighlighted()}</div>
      )}
      <div
        ref={menuRef}
        style={menuStyle}
        className="bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md"
      >
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className={`relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none w-full transition-colors
              ${
                action.destructive
                  ? "text-destructive-foreground hover:bg-destructive/10 dark:hover:bg-destructive/40 hover:text-destructive-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }
            `}
            tabIndex={0}
            type="button"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </>,
    overlayRoot
  );
};
