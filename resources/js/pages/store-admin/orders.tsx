import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    DataTable,
    TablePagination,
    type Column,
} from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { fetchAdminOrders } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { formatDateTime, formatMoney } from '@/lib/utils';
import type { Order } from '@/types/api';

const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'] as const;

/** Order listing for the current store. */
export default function OrdersPage() {
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);

    const query = { status: status === 'all' ? undefined : status, page };

    const { data: orders, isPending } = useQuery({
        queryKey: queryKeys.adminOrders(query),
        queryFn: () => fetchAdminOrders(query),
        placeholderData: keepPreviousData,
    });

    const columns: Column<Order>[] = [
        {
            key: 'order_number',
            header: 'Order',
            cell: (order) => (
                <Link
                    to={`/admin/orders/${order.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                >
                    {order.order_number}
                </Link>
            ),
        },
        {
            key: 'customer',
            header: 'Customer',
            cell: (order) => order.customer.name,
        },
        {
            key: 'items',
            header: 'Items',
            cell: (order) => (order.items ? order.items.length : '—'),
        },
        {
            key: 'total',
            header: 'Total',
            cell: (order) => formatMoney(order.total),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (order) => <StatusBadge status={order.status} />,
        },
        {
            key: 'created_at',
            header: 'Placed',
            cell: (order) => formatDateTime(order.created_at),
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            cell: (order) => (
                <Button asChild variant="ghost" size="sm">
                    <Link to={`/admin/orders/${order.id}`}>View</Link>
                </Button>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Orders"
                description="Orders placed in your storefront."
            />

            <div className="mb-4">
                <Select
                    value={status}
                    onValueChange={(value) => {
                        setPage(1);
                        setStatus(value);
                    }}
                >
                    <SelectTrigger
                        className="w-48"
                        aria-label="Filter by status"
                    >
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {statuses.map((value) => (
                            <SelectItem key={value} value={value}>
                                {value}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                columns={columns}
                rows={orders?.data ?? []}
                rowKey={(order) => order.id}
                loading={isPending}
                empty="No orders found."
            />

            {orders && <TablePagination meta={orders.meta} onPage={setPage} />}
        </div>
    );
}
