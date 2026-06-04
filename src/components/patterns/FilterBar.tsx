import * as React from "react"
import { Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown"

interface FilterOption {
  id: string
  label: string
  count?: number
}

interface FilterBarProps {
  filters: Record<string, FilterOption[]>
  activeFilters?: Record<string, string[]>
  onFilterChange?: (filterKey: string, selected: string[]) => void
  onClearAll?: () => void
  className?: string
}

export function FilterBar({
  filters,
  activeFilters = {},
  onFilterChange,
  onClearAll,
  className = "",
}: FilterBarProps) {
  const activeCount = Object.values(activeFilters).reduce(
    (sum, arr) => sum + arr.length,
    0
  )

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(filters).map(([key, options]) => (
          <DropdownMenu key={key}>
            <DropdownMenuTrigger asChild>
              <Button
                variant={
                  activeFilters[key]?.length ? "default" : "outline"
                }
                size="sm"
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                {key}
                {activeFilters[key]?.length ? (
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[10px]"
                  >
                    {activeFilters[key].length}
                  </Badge>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{key}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.id}
                  checked={activeFilters[key]?.includes(option.id)}
                  onCheckedChange={(checked) => {
                    const current = activeFilters[key] || []
                    const updated = checked
                      ? [...current, option.id]
                      : current.filter((id) => id !== option.id)
                    onFilterChange?.(key, updated)
                  }}
                >
                  <span className="flex-1">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-asas-silver ml-auto">
                      {option.count}
                    </span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>

      {activeCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(activeFilters).map(([key, selected]) =>
            selected.map((value) => {
              const option = filters[key]?.find((o) => o.id === value)
              return (
                <Badge
                  key={`${key}-${value}`}
                  variant="info"
                  className="flex items-center gap-1.5"
                >
                  {option?.label || value}
                  <button
                    onClick={() => {
                      const updated = selected.filter((id) => id !== value)
                      onFilterChange?.(key, updated)
                    }}
                    className="ml-1 hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })
          )}
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-asas-silver text-xs"
            >
              Réinitialiser
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
