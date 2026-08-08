import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/lib/db";

const config: Record<ItemStatus, { label: string; className: string }> = {
  in_stock: {
    label: "In Stock",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  low_stock: {
    label: "Low Stock",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export default function StatusBadge({ status }: { status: ItemStatus }) {
  const { label, className } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border shrink-0 whitespace-nowrap",
        className
      )}
    >
      {label}
    </span>
  );
}
