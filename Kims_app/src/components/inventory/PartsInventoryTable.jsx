import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,

  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function PartsInventoryTable({ data, onEdit, onDelete }) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  // Define columns
  const columns = useMemo(
    () => [
      {
        accessorKey: 'machine_model',
        header: 'Machine/Model',
        cell: ({ getValue }) => (
          <div className="font-medium text-slate-900 min-w-[150px]">
            {getValue() || '-'}
          </div>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: 'unique_id',
        header: 'Fleet ID',
        cell: ({ getValue }) => (
          <div className="text-slate-700 min-w-[80px]">
            {getValue() || '-'}
          </div>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: 'nbl_code',
        header: 'NBL Code',
        cell: ({ getValue }) => (
          <div className="text-slate-700 min-w-[80px]">
            {getValue() || '-'}
          </div>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: 'serial_number',
        header: 'Serial No.',
        cell: ({ getValue }) => (
          <div className="text-slate-700 min-w-[100px]">
            {getValue() || '-'}
          </div>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: 'part_description',
        header: 'Part Description',
        cell: ({ getValue }) => (
          <div className="font-medium text-slate-900 min-w-[200px]">
            {getValue() || '-'}
          </div>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: 'quantity_on_hand',
        header: 'Qty',
        cell: ({ getValue }) => (
          <div className="text-center min-w-[60px]">
            <Badge variant="secondary">{getValue() || '0'}</Badge>
          </div>
        ),
      },
      {
        accessorKey: 'service_interval',
        header: 'Service Interval',
        cell: ({ getValue }) => {
          const interval = getValue();
          return (
            <div className="min-w-[120px]">
              {interval ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {interval}
                </Badge>
              ) : (
                '-'
              )}
            </div>
          );
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: 'part_number_oem',
        header: 'OEM Part #',
        cell: ({ getValue }) => (
          <div className="font-mono text-xs text-slate-700 min-w-[120px]">
            {getValue() || '-'}
          </div>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: 'part_number_aftermarket',
        header: 'Aftermarket #',
        cell: ({ getValue }) => (
          <div className="font-mono text-xs text-slate-600 min-w-[120px]">
            {getValue() || '-'}
          </div>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: 'notes_capacities',
        header: 'Notes',
        cell: ({ getValue }) => {
          const notes = getValue();
          return (
            <div className="text-sm text-slate-600 min-w-[150px] max-w-[250px] truncate" title={notes}>
              {notes || '-'}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row.original)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(row.original.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Get unique values for dropdown filters
  const uniqueValues = useMemo(() => {
    return {
      machine_model: [...new Set(data.map(item => item.machine_model).filter(Boolean))].filter(v => v && v.trim()).sort(),
      service_interval: [...new Set(data.map(item => item.service_interval).filter(Boolean))].filter(v => v && v.trim()).sort(),
      unique_id: [...new Set(data.map(item => item.unique_id).filter(Boolean))].filter(v => v && v.trim()).sort(),
      nbl_code: [...new Set(data.map(item => item.nbl_code).filter(Boolean))].filter(v => v && v.trim()).sort(),
    };
  }, [data]);

  const getColumnFilterValue = (columnId) => {
    const value = table.getColumn(columnId)?.getFilterValue();
    return value || undefined;
  };

  const setColumnFilterValue = (columnId, value) => {
    table.getColumn(columnId)?.setFilterValue(value);
  };

  const clearAllFilters = () => {
    setGlobalFilter('');
    setColumnFilters([]);
  };

  const activeFiltersCount = columnFilters.length + (globalFilter ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Global Search and Quick Actions */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search all columns..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-md"
            />
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters ({activeFiltersCount})
            </Button>
          )}
        </div>
      </Card>

      {/* Column Filters */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Machine/Model</label>
            <Select
              value={getColumnFilterValue('machine_model')}
              onValueChange={(value) => setColumnFilterValue('machine_model', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All machines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All machines</SelectItem>
                {uniqueValues.machine_model.map(value => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Service Interval</label>
            <Select
              value={getColumnFilterValue('service_interval')}
              onValueChange={(value) => setColumnFilterValue('service_interval', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All intervals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All intervals</SelectItem>
                {uniqueValues.service_interval.map(value => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Fleet ID</label>
            <Select
              value={getColumnFilterValue('unique_id')}
              onValueChange={(value) => setColumnFilterValue('unique_id', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All fleet IDs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All fleet IDs</SelectItem>
                {uniqueValues.unique_id.map(value => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">NBL Code</label>
            <Select
              value={getColumnFilterValue('nbl_code')}
              onValueChange={(value) => setColumnFilterValue('nbl_code', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All NBL codes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All NBL codes</SelectItem>
                {uniqueValues.nbl_code.map(value => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-slate-200">
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider bg-slate-50"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="text-slate-400">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                    No parts found matching your filters.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              of {table.getFilteredRowModel().rows.length} results
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="100">100 rows</SelectItem>
                <SelectItem value="200">200 rows</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600 px-2">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
