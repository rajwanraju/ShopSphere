import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    DataTable,
    TablePagination,
    type Column,
} from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { fetchSubscriptions } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, formatMoney } from '@/lib/utils';
import type { StoreSubscription } from '@/types/api';

/** Platform subscription list across all tenant stores. */
export default function SubscriptionsPage() {
    const [page, setPage] = useState(1);

    const { data: subscriptions, isPending } = useQuery({
        queryKey: [...queryKeys.subscriptions, page],
        queryFn: () => fetchSubscriptions(page),
        placeholderData: keepPreviousData,
    });

    const columns: Column<StoreSubscription>[] = [
        {
            key: 'store',
            header: 'Store',
            cell: (subscription) =>
                subscription.store ? (
                    <Link
                        to={`/management/stores/${subscription.store.id}`}
                        className="font-medium hover:underline"
                    >
                        {subscription.store.name}
                    </Link>
                ) : (
                    `Store #${subscription.store_id}`
                ),
        },
        {
            key: 'package_name',
            header: 'Package',
            cell: (subscription) => (
                <div className="text-sm">
                    <p>{subscription.package_name}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatMoney(subscription.package_price)} /{' '}
                        {subscription.package_duration_days} days
                    </p>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (subscription) => (
                <StatusBadge status={subscription.status} />
            ),
        },
        {
            key: 'period',
            header: 'Period',
            cell: (subscription) =>
                subscription.starts_at ? (
                    <span className="text-sm">
                        {formatDate(subscription.starts_at)} →{' '}
                        {formatDate(subscription.ends_at)}
                    </span>
                ) : (
                    '—'
                ),
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            cell: (subscription) => (
                <Button asChild variant="ghost" size="sm">
                    <Link to={`/management/subscriptions/${subscription.id}`}>
                        Details
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Subscriptions"
                description="Store subscriptions created through package onboarding."
            />

            <DataTable
                columns={columns}
                rows={subscriptions?.data ?? []}
                rowKey={(subscription) => subscription.id}
                loading={isPending}
                empty="No subscriptions yet."
            />

            {subscriptions && (
                <TablePagination meta={subscriptions.meta} onPage={setPage} />
            )}
        </div>
    );
}
