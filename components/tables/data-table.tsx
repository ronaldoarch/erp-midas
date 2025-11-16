"use client";
import * as React from "react";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, SortingState } from "@tanstack/react-table";

export function DataTable<TData, TValue>({ columns, data }: { columns: ColumnDef<TData, TValue>[]; data: TData[] }) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
	return (
		<div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
			<table className="min-w-full text-sm">
				<thead>
					{table.getHeaderGroups().map((hg) => (
						<tr key={hg.id} className="bg-zinc-50/60 dark:bg-zinc-900/60">
							{hg.headers.map((h) => (
								<th key={h.id} className="px-3 py-2 text-left font-medium text-zinc-600">
									{h.isPlaceholder ? null : (
										<div onClick={h.column.getToggleSortingHandler()} className="cursor-pointer select-none">
											{flexRender(h.column.columnDef.header, h.getContext())}
											{h.column.getIsSorted() ? (h.column.getIsSorted() === "asc" ? " ▲" : " ▼") : null}
										</div>
									)}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => (
						<tr key={row.id} className="border-t border-zinc-200/60 dark:border-zinc-800/60">
							{row.getVisibleCells().map((cell) => (
								<td key={cell.id} className="px-3 py-2 text-zinc-800 dark:text-zinc-200">
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}


