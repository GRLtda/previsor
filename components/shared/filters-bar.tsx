'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
}

interface Filter {
  key: string
  label: string
  type: 'text' | 'select'
  options?: FilterOption[]
  placeholder?: string
}

interface FiltersBarProps {
  filters: Filter[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onClear: () => void
}

export function FiltersBar({ filters, values, onChange, onClear }: FiltersBarProps) {
  const hasActiveFilters = Object.values(values).some((v) => v && v !== '')

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
      {filters.map((filter) => (
        <div key={filter.key} className="flex-1 min-w-[200px]">
          {filter.type === 'text' ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={filter.placeholder || filter.label}
                value={values[filter.key] || ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
                className="pl-9"
              />
            </div>
          ) : (
            <Select
              value={values[filter.key] || 'all'} // Updated default value to 'all'
              onValueChange={(value) => onChange(filter.key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={filter.placeholder || filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem> // Updated value to 'all'
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  )
}
