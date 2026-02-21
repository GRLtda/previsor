"use client";

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Pagination } from "@/components/shared/pagination"
import { Loader2 } from "lucide-react"

export interface ColumnDef<T> {
  header: React.ReactNode
  accessorKey?: keyof T | string
  cell?: (row: T) => React.ReactNode
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  keyExtractor?: (row: T) => string

  // Selection
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void

  // Pagination
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems?: number
    itemsPerPage?: number
    onPageChange: (page: number) => void
  }

  // Actions
  bulkActions?: (selectedIds: string[]) => React.ReactNode

  // Status
  isLoading?: boolean
  emptyMessage?: string
}

export function DataTable<T extends { id?: string }>({
  data,
  columns,
  keyExtractor,
  selectable,
  selectedIds = [],
  onSelectionChange,
  pagination,
  bulkActions,
  isLoading,
  emptyMessage = "Nenhum registro encontrado.",
}: DataTableProps<T>) {

  const extractKey = keyExtractor || ((row: T) => row.id || JSON.stringify(row))

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange(data.map(extractKey))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const allSelected = data.length > 0 && selectedIds.length === data.length

  return (
    <div className="relative flex flex-col w-full bg-card rounded-xl border border-border overflow-hidden min-h-[700px]">
      <div className="overflow-x-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/30 hover:bg-muted/30 transition-none">
              {selectable && (
                <TableHead className="w-[40px] px-4">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
              )}
              {columns.map((col, i) => (
                <TableHead key={i} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="h-32 text-center relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="mb-2 h-6 w-6 animate-spin" />
                    <span className="text-sm">Carregando dados...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="h-32 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const id = extractKey(row)
                const isSelected = selectedIds.includes(id)
                return (
                  <TableRow
                    key={id}
                    data-state={isSelected ? "selected" : undefined}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted/80"
                  >
                    {selectable && (
                      <TableCell className="px-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectRow(id, !!checked)}
                          aria-label="Selecionar linha"
                        />
                      </TableCell>
                    )}
                    {columns.map((col, i) => (
                      <TableCell key={i} className={col.className}>
                        {col.cell ? col.cell(row) : (col.accessorKey ? String(row[col.accessorKey as keyof T]) : null)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="border-t">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.onPageChange}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {bulkActions && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-4 rounded-full border bg-background/95 backdrop-blur-md px-6 py-3 shadow-lg animate-in slide-in-from-bottom-5">
            <span className="text-sm font-medium text-foreground whitespace-nowrap border-r pr-4">
              {selectedIds.length} selecionado{selectedIds.length > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              {bulkActions(selectedIds)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
