"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  Loader2,
} from "lucide-react"

export type DataTableAlign = "left" | "center" | "right"

export type DataTableColumn<T> = {
  id: string
  header: ReactNode
  cell: (row: T, index: number) => ReactNode
  /** Si true, el header es clickeable y dispara onSortChange. */
  sortable?: boolean
  /**
   * Ancho de columna.
   * - string/number → fijo (p. ej. "12rem", 160)
   * - "auto" / omitido → flexible
   */
  width?: string | number | "auto"
  minWidth?: string | number
  maxWidth?: string | number
  /** Oculta la columna (también se puede controlar vía columnVisibility). */
  hidden?: boolean
  align?: DataTableAlign
  headerClassName?: string
  cellClassName?: string
  /** Header solo para lectores de pantalla (columnas de iconos/acciones). */
  srOnlyHeader?: boolean
}

export type DataTableSortState = {
  id: string
  order: "asc" | "desc"
}

export type DataTableColumnVisibility = Record<string, boolean>

function toCssSize(value: string | number | undefined): string | undefined {
  if (value == null) return undefined
  return typeof value === "number" ? `${value}px` : value
}

function columnStyle(col: DataTableColumn<unknown>): CSSProperties | undefined {
  const width =
    col.width != null && col.width !== "auto" ? toCssSize(col.width) : undefined
  const minWidth = toCssSize(col.minWidth)
  const maxWidth = toCssSize(col.maxWidth)
  if (!width && !minWidth && !maxWidth) return undefined
  return {
    width,
    minWidth: minWidth ?? width,
    maxWidth,
  }
}

const alignClass: Record<DataTableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  sort,
  onSortChange,
  loading = false,
  empty = "Sin resultados.",
  minWidth = "40rem",
  stickyHeader = true,
  /** Visibilidad controlada: false = oculta. Si falta la key, se usa column.hidden. */
  columnVisibility,
  onColumnVisibilityChange,
  /** Muestra botón para ocultar/mostrar columnas. */
  showColumnToggle = false,
  toolbar,
  footer,
  className,
  tableClassName,
  onRowClick,
}: {
  columns: Array<DataTableColumn<T>>
  data: T[]
  getRowId: (row: T, index: number) => string | number
  sort?: DataTableSortState | null
  onSortChange?: (next: DataTableSortState) => void
  loading?: boolean
  empty?: ReactNode
  minWidth?: string | number
  stickyHeader?: boolean
  columnVisibility?: DataTableColumnVisibility
  onColumnVisibilityChange?: (next: DataTableColumnVisibility) => void
  showColumnToggle?: boolean
  toolbar?: ReactNode
  footer?: ReactNode
  className?: string
  tableClassName?: string
  onRowClick?: (row: T, index: number) => void
}) {
  const [toggleOpen, setToggleOpen] = useState(false)
  const [uncontrolledVisibility, setUncontrolledVisibility] =
    useState<DataTableColumnVisibility>({})
  const toggleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!toggleOpen) return
    function onPointerDown(e: PointerEvent) {
      if (!toggleRef.current?.contains(e.target as Node)) {
        setToggleOpen(false)
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [toggleOpen])

  const visibility = columnVisibility ?? uncontrolledVisibility
  const setVisibility = onColumnVisibilityChange ?? setUncontrolledVisibility

  const visibleColumns = useMemo(
    () =>
      columns.filter((col) => {
        if (visibility[col.id] === false) return false
        if (visibility[col.id] === true) return true
        return !col.hidden
      }),
    [columns, visibility],
  )

  function isColumnVisible(col: DataTableColumn<T>): boolean {
    if (visibility[col.id] === false) return false
    if (visibility[col.id] === true) return true
    return !col.hidden
  }

  function toggleColumn(id: string) {
    const col = columns.find((c) => c.id === id)
    if (!col) return
    const currentlyVisible = isColumnVisible(col)
    // No permitir ocultar la última columna visible.
    if (currentlyVisible && visibleColumns.length <= 1) return
    setVisibility({
      ...visibility,
      [id]: !currentlyVisible,
    })
  }

  function handleSort(col: DataTableColumn<T>) {
    if (!col.sortable || !onSortChange) return
    if (sort?.id === col.id) {
      onSortChange({
        id: col.id,
        order: sort.order === "asc" ? "desc" : "asc",
      })
      return
    }
    onSortChange({ id: col.id, order: "asc" })
  }

  const tableMinWidth = toCssSize(minWidth)

  return (
    <div className={cn("space-y-3", className)}>
      {toolbar || showColumnToggle ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
            {toolbar}
          </div>
          {showColumnToggle ? (
            <div className="relative" ref={toggleRef}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                aria-expanded={toggleOpen}
                onClick={() => setToggleOpen((o) => !o)}
              >
                <Columns3 className="size-3.5" />
                Columnas
              </Button>
              {toggleOpen ? (
                <div className="absolute right-0 z-20 mt-1 min-w-[12rem] rounded-lg border border-border bg-card p-2 shadow-md">
                  <p className="mb-1.5 px-1 text-[11px] font-medium text-muted-foreground">
                    Mostrar / ocultar
                  </p>
                  <ul className="space-y-0.5">
                    {columns.map((col) => {
                      const visible = isColumnVisible(col)
                      const label =
                        typeof col.header === "string"
                          ? col.header
                          : col.id
                      return (
                        <li key={col.id}>
                          <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted">
                            <input
                              type="checkbox"
                              className="size-3.5 accent-primary"
                              checked={visible}
                              disabled={visible && visibleColumns.length <= 1}
                              onChange={() => toggleColumn(col.id)}
                            />
                            <span className="truncate">{label}</span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table
          className={cn(
            "w-full text-left text-sm",
            tableClassName,
          )}
          style={tableMinWidth ? { minWidth: tableMinWidth } : undefined}
        >
          <thead
            className={cn(
              "bg-muted/50 text-muted-foreground",
              stickyHeader && "sticky top-0 z-10",
            )}
          >
            <tr>
              {visibleColumns.map((col) => {
                const active = sort?.id === col.id
                const align = col.align ?? "left"
                const sortable = Boolean(col.sortable && onSortChange)
                const content = col.srOnlyHeader ? (
                  <span className="sr-only">{col.header}</span>
                ) : (
                  col.header
                )

                return (
                  <th
                    key={col.id}
                    scope="col"
                    style={columnStyle(col as DataTableColumn<unknown>)}
                    className={cn(
                      "px-3 py-2.5 font-medium",
                      alignClass[align],
                      col.headerClassName,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md transition-colors hover:text-foreground",
                          active && "text-foreground",
                          align === "right" && "ml-auto",
                          align === "center" && "mx-auto",
                        )}
                        onClick={() => handleSort(col)}
                      >
                        {content}
                        {active ? (
                          sort.order === "asc" ? (
                            <ArrowDown className="size-3.5 shrink-0" />
                          ) : (
                            <ArrowUp className="size-3.5 shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 shrink-0 opacity-40" />
                        )}
                      </button>
                    ) : (
                      content
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={Math.max(visibleColumns.length, 1)}
                  className="px-3 py-10 text-center text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Cargando…
                  </span>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(visibleColumns.length, 1)}
                  className="px-3 py-10 text-center text-muted-foreground"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={getRowId(row, index)}
                  className={cn(
                    "align-top",
                    onRowClick &&
                      "cursor-pointer hover:bg-muted/40",
                  )}
                  onClick={
                    onRowClick
                      ? () => onRowClick(row, index)
                      : undefined
                  }
                >
                  {visibleColumns.map((col) => {
                    const align = col.align ?? "left"
                    return (
                      <td
                        key={col.id}
                        style={columnStyle(col as DataTableColumn<unknown>)}
                        className={cn(
                          "px-3 py-2.5",
                          alignClass[align],
                          col.cellClassName,
                        )}
                      >
                        {col.cell(row, index)}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer ? <div>{footer}</div> : null}
    </div>
  )
}
