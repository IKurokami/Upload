import { useRef, useCallback } from "react";

type UseLongPressOptions = {
  onLongPress: (e: React.SyntheticEvent) => void;
  onClick?: (e: React.SyntheticEvent) => void;
  delay?: number;
  disabled?: boolean;
};

export function useLongPress({
  onLongPress,
  onClick,
  delay = 500,
  disabled = false,
}: UseLongPressOptions) {
  const timerRef = useRef<number | null>(null);
  const targetRef = useRef<EventTarget | null>(null);

  const start = useCallback(
    (e: React.SyntheticEvent) => {
      if (disabled) return;
      targetRef.current = e.target;
      timerRef.current = window.setTimeout(() => {
        onLongPress(e);
        timerRef.current = null;
      }, delay);
    },
    [onLongPress, delay, disabled]
  );

  const clear = useCallback(
    (e: React.SyntheticEvent, shouldTriggerClick = true) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        if (onClick && shouldTriggerClick && !disabled) {
          onClick(e);
        }
      }
    },
    [onClick, disabled]
  );

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: (e: React.SyntheticEvent) => clear(e),
    onMouseLeave: (e: React.SyntheticEvent) => clear(e, false),
    onTouchEnd: (e: React.SyntheticEvent) => clear(e),
    onTouchCancel: (e: React.SyntheticEvent) => clear(e, false),
  };
}
