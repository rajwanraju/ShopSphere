import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
    ExternalLink,
    LayoutDashboard,
    LoaderCircle,
    LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { PageLoader } from '@/components/shared/feedback';
import { StatusBadge } from '@/components/shared/status-badge';
import { logout, fetchOnboardingStatus } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { formatDateTime, formatMoney } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import type { SubscriptionPayment } from '@/types/api';

const paymentColumns: Column<SubscriptionPayment>[] = [
    { key: 'channel_name', header: 'Channel' },
    { key: 'transaction_id', header: 'Transaction ID' },
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
        header: 'Note',
        cell: (payment) => payment.rejection_reason ?? '—',
    },
    {
        key: 'created_at',
        header: 'Submitted',
        cell: (payment) => formatDateTime(payment.created_at),
    },
];

/** Post-registration status: subscription verification and next steps. */
export default function OnboardingStatusPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const clearUser = useAuthStore((state) => state.setUser);

    const { data, isPending, isError } = useQuery({
        queryKey: queryKeys.onboardingStatus,
        queryFn: fetchOnboardingStatus,
        refetchInterval: (query) =>
            query.state.data?.subscription.status === 'PENDING'
                ? 20_000
                : false,
    });

    if (isPending) {
        return <PageLoader />;
    }

    if (isError || !data) {
        return (
            <div className="mx-auto max-w-xl px-4 py-10 text-center text-sm text-muted-foreground">
                Could not load your store status.
            </div>
        );
    }

    const { store, subscription, payments } = data;
    const hasPendingPayment = payments.some(
        (payment) => payment.status === 'PENDING',
    );
    const isOperational =
        subscription.status === 'ACTIVE' && store.status === 'ACTIVE';

    async function handleLogout() {
        await logout();
        clearUser(null);
        queryClient.clear();
        void navigate('/login', { replace: true });
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome, {store.name}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Your storefront:{' '}
                        <span className="font-medium text-foreground">
                            /store/{store.slug}
                        </span>
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="size-4" />
                    Sign out
                </Button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Subscription
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 text-sm">
                        <p className="flex justify-between">
                            <span className="text-muted-foreground">
                                Package
                            </span>
                            <span className="font-medium">
                                {subscription.package_name}
                            </span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-muted-foreground">Price</span>
                            <span>
                                {formatMoney(subscription.package_price)}
                            </span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-muted-foreground">
                                Duration
                            </span>
                            <span>
                                {subscription.package_duration_days} days
                            </span>
                        </p>
                        <p className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                                Status
                            </span>
                            <StatusBadge status={subscription.status} />
                        </p>
                        {subscription.ends_at && (
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Valid until
                                </span>
                                <span>
                                    {formatDateTime(subscription.ends_at)}
                                </span>
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Next step</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {isOperational ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Your store is live and ready to manage.
                                </p>
                                <Button asChild>
                                    <Link to="/admin">
                                        <LayoutDashboard className="size-4" />
                                        Go to store panel
                                    </Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link to={`/store/${store.slug}`}>
                                        <ExternalLink className="size-4" />
                                        Visit storefront
                                    </Link>
                                </Button>
                            </>
                        ) : hasPendingPayment ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Your payment is being verified. This page
                                    updates automatically once a manager reviews
                                    it.
                                </p>
                                <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Submit your subscription payment to activate
                                    the store.
                                </p>
                                <Button asChild>
                                    <Link to="/onboarding/payment">
                                        Submit payment
                                    </Link>
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="text-base">Payments</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={paymentColumns}
                        rows={payments}
                        rowKey={(payment) => payment.id}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
