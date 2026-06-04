import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  onClear?: () => void
  isLoading?: boolean
  className?: string
}

export function SearchBar({
  placeholder = "Rechercher...",
  value = "",
  onChange,
  onSearch,
  onClear,
  isLoading = false,
  className = "",
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value)
    }
  }

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-asas-silver pointer-events-none" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10"
          disabled={isLoading}
        />
      </div>
      {value && !isLoading && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            onChange?.("")
            onClear?.()
          }}
          className="h-10 w-10"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {isLoading && (
        <div className="px-3 py-2">
          <div className="h-4 w-4 rounded-full border-2 border-asas-gold border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  )
}
