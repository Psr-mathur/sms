import * as React from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface AutocompleteOption {
  value: string;
  label: string;
  subLabel?: string;
}

export interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  className,
  error = false,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Alphabetically sort options A-Z by label
  const sortedOptions = React.useMemo(() => {
    return [...options].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
    );
  }, [options]);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return sortedOptions;
    const query = search.toLowerCase().trim();
    return sortedOptions.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(query);
      const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(query) : false;
      return matchLabel || matchSub;
    });
  }, [sortedOptions, search]);

  const selectedOption = sortedOptions.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between rounded-md border bg-background px-3 py-2.5 text-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation min-h-[42px]",
            error ? "border-destructive text-destructive" : "border-input text-foreground",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate text-left font-medium">
            {selectedOption ? (
              <span>
                {selectedOption.label}
                {selectedOption.subLabel && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    {selectedOption.subLabel}
                  </span>
                )}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0 z-[60] shadow-lg border-card-border bg-popover"
      >
        <div className="flex items-center border-b border-border px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex h-9 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="p-1 hover:bg-muted rounded text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin touch-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent/80 touch-manipulation",
                    isSelected && "bg-accent/50 font-semibold"
                  )}
                >
                  <div className="flex flex-col text-left min-w-0 pr-2">
                    <span className="truncate">{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-[11px] font-normal text-muted-foreground truncate">
                        {opt.subLabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
