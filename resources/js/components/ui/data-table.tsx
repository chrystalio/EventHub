"use client"

import * as React from "react"
import {
    ColumnDef,
    SortingState,
    flexRender,
    getCoreRowModel,
    useReactTable,
    ColumnFiltersState,
    getFilteredRowModel,
    getPaginationRowModel,
    OnChangeFn,
    getSortedRowModel,
    getExpandedRowModel,
    ExpandedState,
    Row
} from '@tanstack/react-table';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from '@/components/ui/data-table-pagination';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    columnFilters?: ColumnFiltersState
    onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
    renderSubComponent?: (row: Row<TData>) => React.ReactElement;
}


export function DataTable<TData, TValue>({columns, data, columnFilters, onColumnFiltersChange, renderSubComponent }: DataTableProps<TData, TValue>) {
    const [internalFilters, setInternalFilters] = React.useState<ColumnFiltersState>([])
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [expanded, setExpanded] = React.useState<ExpandedState>({})

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            expanded,
            columnFilters: columnFilters ?? internalFilters,
        },
        onExpandedChange: setExpanded,
        getExpandedRowModel: getExpandedRowModel(),
        onColumnFiltersChange:
            onColumnFiltersChange ??
            ((updater) =>
                typeof updater === "function"
                    ? setInternalFilters(updater(internalFilters))
                    : setInternalFilters(updater)),
    })

    return (
        <div>
            <Table className="w-full">
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            // Use React.Fragment to group the main row and its potential sub-row
                            <React.Fragment key={row.id}>
                                <TableRow data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>

                                {row.getIsExpanded() && renderSubComponent && (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="p-0">
                                            {renderSubComponent(row)}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <DataTablePagination table={table} />
        </div>
    )
}
