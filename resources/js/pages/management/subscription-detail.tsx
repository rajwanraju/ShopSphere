import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { ErrorAlert, PageLoader } from '@/components/shared/feedback';
import { StatusBadge } from '@/components/shared/status-badge';
import { fetchSubscription } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, formatDateTime, formatMoney } from '@/lib/utils';
import type { SubscriptionPayment } from '@/types/api';

/** Subscription details with its manual payment history. */
export default function SubscriptionDetailPage() {
    const { subscriptionId = '' } = useParams();

    const {
        data: subscription,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: queryKeys.subscription(Number(subscriptionId)),
        queryFn: () => fetchSubscription(Number(subscriptionId)),
    });

    const columns: Column<SubscriptionPayment>[] = [
        { key: 'channel_name', header: 'Channel' },
        {
            key: 'account_number',
            header: 'Account number',
            cell: (payment) => (
                <span className="font-mono text-xs">
                    {payment.account_number}
                </span>
            ),
        },
        {
            key: 'transaction_id',
            header: 'Transaction ID',
            cell: (payment) => (
                <span className="font-mono text-xs">
                    {payment.transaction_id}
                </span>
            ),
        },
        {
            key: 'amount',
            header: 'Amount',
            cell: (payment) => formatMoney(payment.amount),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (payment) => <StatusBadge status={payment.status} />,
        },
        {
            key: 'rejection_reason',
            header: 'Rejection reason',
            cell: (payment) => payment.rejection_reason ?? '—',
        },
        {
            key: 'verified_at',
            header: 'Verified',
            cell: (payment) =>
                payment.verified_at ? formatDateTime(payment.verified_at) : '—',
        },
        {
            key: 'created_at',
            header: 'Submitted',
            cell: (payment) => formatDateTime(payment.created_at),
        },
    ];

    if (isPending) {
        return <PageLoader />;
    }

    if (isError || !subscription) {
        return (
            <ErrorAlert message={error?.message ?? 'Subscription not found.'} />
        );
    }

    return (
        <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
                <Link to="/management/subscriptions">
                    <ArrowLeft className="size-4" />
                    All subscriptions
                </Link>
            </Button>

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {subscription.package_name} subscription
                </h1>
                <StatusBadge status={subscription.status} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Subscription
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p className="flex justify-between">
                            <span className="text-muted-foreground">
                                Package
                            </span>
                            <span>{subscription.package_name}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-muted-foreground">Price</span>
                            <span>
                                {formatMoney(subscription.package_price)} /{' '}
                                {subscription.package_duration_days} days
                            </span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-muted-foreground">
                                Started
                            </span>
                            <span>
                                {subscription.starts_at
                                    ? formatDate(subscription.starts_at)
                                    : '—'}
                            </span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-muted-foreground">Ends</span>
                            <span>
                                {subscription.ends_at
                                    ? formatDate(subscription.ends_at)
                                    : '—'}
                            </span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Store</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {subscription.store ? (
                            <>
                                <p className="flex items-center justify-between">
                                    <Link
                                        to={`/management/stores/${subscription.store.id}`}
                                        className="font-medium hover:underline"
                                    >
                                        {subscription.store.name}
                                    </Link>
                                    <StatusBadge
                                        status={subscription.store.status}
                                    />
                                </p>
                                <p className="text-muted-foreground">
                                    /store/{subscription.store.slug}
                                </p>
                            </>
                        ) : (
                            <p className="text-muted-foreground">
                                Store #{subscription.store_id}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <h2 className="mt-8 mb-3 text-lg font-semibold">Payments</h2>
            <DataTable
                columns={columns}
                rows={subscription.payments ?? []}
                rowKey={(payment) => payment.id}
                empty="No payments submitted for this subscription."
            />
        </div>
    );
}
