import * as React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface SortableHeaderProps<K extends string> {
  label: string;
  sortKey: K;
  currentSortKey?: K | null;
  sortDirection?: SortDirection;
  onSort: (key: K) => void;
  align?: "left" | "center" | "right";
  className?: string;
}

export function SortableHeader<K extends string>({
  label,
  sortKey,
  currentSortKey,
  sortDirection,
  onSort,
  align = "left",
  className,
}: SortableHeaderProps<K>) {
  const isActive = currentSortKey === sortKey;

  return (
    <th
      onClick={() => onSort(sortKey)}
      className={cn(
        "py-3 px-3 sm:px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none cursor-pointer hover:text-foreground hover:bg-muted/40 transition-colors touch-manipulation whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        isActive && "text-foreground font-bold",
        className
      )}
    >
      <div
        className={cn(
          "inline-flex items-center gap-1.5",
          align === "right" && "flex-row-reverse",
          align === "center" && "justify-center"
        )}
      >
        <span>{label}</span>
        {isActive ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary shrink-0" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary shrink-0" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground shrink-0 transition-opacity" />
        )}
      </div>
    </th>
  );
}
