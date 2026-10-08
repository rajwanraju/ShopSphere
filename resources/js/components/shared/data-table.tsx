import type { ReactNode } from 'react';
import type { Paginated } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface Column<T> {
    key: string;
    header: ReactNode;
    /** Render a cell; falls back to the raw value. */
    cell?: (row: T) => ReactNode;
    className?: string;
}

function renderFallback(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    if (value === null || value === undefined) {
        return '—';
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return '—';
}

/** Generic table renderer for domain collections. */
export function DataTable<T>({
    columns,
    rows,
    rowKey,
    loading = false,
    empty,
}: {
    columns: Column<T>[];
    rows: T[];
    rowKey: (row: T) => string | number;
    loading?: boolean;
    empty?: ReactNode;
}) {
    return (
        <div className="w-full overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={cn(
                                    'px-4 py-3 font-medium',
                                    column.className,
                                )}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: 5 }, (_, index) => (
                            <tr key={index} className="border-t">
                                {columns.map((column) => (
                                    <td key={column.key} className="px-4 py-3">
                                        <Skeleton className="h-4 w-full max-w-32" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : rows.length === 0 ? (
                        <tr className="border-t">
                            <td
                                colSpan={columns.length}
                                className="px-4 py-10 text-center text-muted-foreground"
                            >
                                {empty ?? 'Nothing here yet.'}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr
                                key={rowKey(row)}
                                className="border-t transition-colors hover:bg-muted/40"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={cn(
                                            'px-4 py-3 align-middle',
                                            column.className,
                                        )}
                                    >
                                        {column.cell
                                            ? column.cell(row)
                                            : renderFallback(
                                                  (
                                                      row as Record<
                                                          string,
                                                          unknown
                                                      >
                                                  )[column.key],
                                              )}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

/** Prev/next pagination bound to Laravel's paginator meta. */
export function TablePagination({
    meta,
    onPage,
}: {
    meta: Paginated<unknown>['meta'];
    onPage: (page: number) => void;
}) {
    if (meta.last_page <= 1) {
        return null;
    }

    return (
        <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
                Page {meta.current_page} of {meta.last_page} · {meta.total}{' '}
                total
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page <= 1}
                    onClick={() => onPage(meta.current_page - 1)}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => onPage(meta.current_page + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
