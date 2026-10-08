import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/shared/data-table';
import { ErrorAlert, PageLoader } from '@/components/shared/feedback';
import { PageHeader } from '@/components/shared/page-header';
import { fetchSalesReport } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { cn, formatMoney } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';

const periods = [7, 30, 90] as const;

interface DailyRow {
    date: string;
    orders_count: number;
    revenue: number;
}

/** Store dashboard: sales report from the current store's order data only. */
export default function DashboardPage() {
    const storeName = useAuthStore((state) => state.user?.store?.name ?? '');
    const [days, setDays] = useState<number>(30);

    const {
        data: report,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: queryKeys.salesReport(days),
        queryFn: () => fetchSalesReport(days),
    });

    const dailyColumns: Column<DailyRow>[] = [
        { key: 'date', header: 'Date' },
        { key: 'orders_count', header: 'Orders' },
        {
            key: 'revenue',
            header: 'Revenue',
            cell: (row) => formatMoney(row.revenue),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Dashboard"
                description={`Sales overview for ${storeName}.`}
                actions={
                    <div className="flex rounded-md border p-1">
                        {periods.map((period) => (
                            <Button
                                key={period}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    'h-7',
                                    days === period && 'bg-muted font-medium',
                                )}
                                onClick={() => setDays(period)}
                            >
                                {period}d
                            </Button>
                        ))}
                    </div>
                }
            />

            {isError && <ErrorAlert message={error.message} />}

            {isPending ? (
                <PageLoader />
            ) : report ? (
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Orders ({report.period_days} days)
                                </CardTitle>
                                <ShoppingCart className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">
                                    {report.orders_count}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Revenue ({report.period_days} days)
                                </CardTitle>
                                <DollarSign className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">
                                    {formatMoney(report.revenue)}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div>
                            <h2 className="mb-3 font-medium">Daily sales</h2>
                            <DataTable
                                columns={dailyColumns}
                                rows={report.daily}
                                rowKey={(row) => row.date}
                                empty="No orders in this period."
                            />
                        </div>

                        <div>
                            <h2 className="mb-3 font-medium">Top products</h2>
                            {report.top_products.length === 0 ? (
                                <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                                    No product sales in this period.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {report.top_products.map((product) => (
                                        <div
                                            key={product.product_title}
                                            className="flex items-center justify-between rounded-lg border p-3 text-sm"
                                        >
                                            <span className="min-w-0 truncate font-medium">
                                                {product.product_title}
                                            </span>
                                            <span className="shrink-0 text-muted-foreground">
                                                {product.quantity_sold} sold ·{' '}
                                                {formatMoney(product.revenue)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
