"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DecoratedText } from "@/components/ui/decorated-text";

export const BackgroundRippleEffect = ({
  rows,
  cols = 27,
  cellSize = 56,
}: {
  rows?: number;
  cols?: number;
  cellSize?: number;
}) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const [calculatedRows, setCalculatedRows] = useState(rows || 8);
  const ref = useRef<any>(null);

  // Calculate rows based on viewport height
  useEffect(() => {
    if (!rows) {
      const calculateRows = () => {
        // Get the actual container height (accounting for padding-top)
        const container = ref.current?.parentElement;
        const containerHeight = container ? container.offsetHeight : window.innerHeight;
        // Calculate rows to fill the height, add extra for overflow
        const calculated = Math.ceil(containerHeight / cellSize) + 3;
        setCalculatedRows(calculated);
      };
      
      // Use requestAnimationFrame to ensure DOM is ready
      const timeoutId = setTimeout(calculateRows, 0);
      window.addEventListener('resize', calculateRows);
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', calculateRows);
      };
    } else {
      setCalculatedRows(rows);
    }
  }, [rows, cellSize]);

  const finalRows = rows || calculatedRows;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 h-full w-full",
        "[--cell-border-color:var(--color-neutral-300)] [--cell-fill-color:var(--color-neutral-100)] [--cell-shadow-color:var(--color-neutral-500)]",
        "dark:[--cell-border-color:var(--color-neutral-700)] dark:[--cell-fill-color:var(--color-neutral-900)] dark:[--cell-shadow-color:var(--color-neutral-800)]",
      )}
    >
      <div className="relative h-full w-full overflow-hidden pointer-events-auto">
        <div className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-hidden" />
        <div className="absolute inset-0 flex items-start justify-center pointer-events-auto">
          <DivGrid
            key={`base-${rippleKey}`}
            className="relative z-[3] pointer-events-auto"
            rows={finalRows}
            cols={cols}
            cellSize={cellSize}
            borderColor="var(--cell-border-color)"
            fillColor="var(--cell-fill-color)"
            clickedCell={clickedCell}
            onCellClick={(row, col) => {
              setClickedCell({ row, col });
              setRippleKey((k) => k + 1);
              // Reset after animation completes (max duration is ~2000ms)
              setTimeout(() => {
                setClickedCell(null);
              }, 2500);
            }}
            interactive
          />
        </div>
      </div>
    </div>
  );
};

type DivGridProps = {
  className?: string;
  rows: number;
  cols: number;
  cellSize: number; // in pixels
  borderColor: string;
  fillColor: string;
  clickedCell: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
};

type CellStyle = React.CSSProperties & {
  ["--delay"]?: string;
  ["--duration"]?: string;
};

const DivGrid = ({
  className,
  rows = 7,
  cols = 30,
  cellSize = 56,
  borderColor = "#3f3f46",
  fillColor = "rgba(14,165,233,0.3)",
  clickedCell = null,
  onCellClick = () => {},
  interactive = true,
}: DivGridProps) => {
  const cells = useMemo(
    () => Array.from({ length: rows * cols }, (_, idx) => idx),
    [rows, cols],
  );

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: rows * cellSize,
  };

  return (
    <div className={cn("relative z-[3]", className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const delay = clickedCell ? Math.max(0, distance * 55) : 0; // ms
        const duration = 200 + distance * 80; // ms

        const style: CellStyle = clickedCell
          ? {
              "--delay": `${delay}ms`,
              "--duration": `${duration}ms`,
            }
          : {};

        const animationStyle = clickedCell
          ? {
              animation: `cell-ripple ${duration}ms ease-out ${delay}ms`,
              animationFillMode: 'none' as const,
            }
          : {};

        return (
          <div
            key={idx}
            className={cn(
              "cell relative border-[0.5px] opacity-50 transition-opacity duration-150 will-change-transform hover:opacity-80 dark:shadow-[0px_0px_40px_1px_var(--cell-shadow-color)_inset] block w-full h-full",
              !interactive && "pointer-events-none",
            )}
            style={{
              backgroundColor: fillColor,
              borderColor: borderColor,
              ...style,
              ...animationStyle,
            }}
            onClick={
              interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined
            }
          >
            <DecoratedText
              className="absolute inset-0 pointer-events-none"
              showIcons={true}
              bordered={false}
              flicker={false}
              glowEffect={false}
            />
          </div>
        );
      })}
    </div>
  );
};
