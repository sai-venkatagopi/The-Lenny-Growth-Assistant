import { useCallback, useEffect, useRef, useState } from "react";

interface UseResizablePanelOptions {
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
  direction?: "left" | "right"; // which side is the drag handle on
}

/**
 * Returns [width, isDragging, handleMouseDown]
 * Attach handleMouseDown to the resize-handle div's onMouseDown.
 */
export function useResizablePanel({
  defaultWidth,
  minWidth = 180,
  maxWidth = 600,
  storageKey,
  direction = "right",
}: UseResizablePanelOptions): [number, boolean, (e: React.MouseEvent) => void] {
  const [width, setWidth] = useState<number>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) return Math.max(minWidth, Math.min(maxWidth, Number(saved)));
    }
    return defaultWidth;
  });

  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const delta = direction === "right"
        ? e.clientX - startXRef.current
        : startXRef.current - e.clientX;
      const next = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + delta));
      setWidth(next);
      if (storageKey) localStorage.setItem(storageKey, String(next));
    },
    [direction, minWidth, maxWidth, storageKey]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      setIsDragging(true);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [width, handleMouseMove, handleMouseUp]
  );

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return [width, isDragging, handleMouseDown];
}
