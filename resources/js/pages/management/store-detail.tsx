import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ErrorAlert, PageLoader } from '@/components/shared/feedback';
import { StatusBadge } from '@/components/shared/status-badge';
import { toApiError } from '@/api/client';
import { fetchManagedStore, updateStoreStatus } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, formatMoney } from '@/lib/utils';

/** Platform view of a single tenant store. */
export default function StoreDetailPage() {
    const { storeId = '' } = useParams();
    const queryClient = useQueryClient();
    const [toggling, setToggling] = useState(false);

    const {
        data: store,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: queryKeys.managedStore(Number(storeId)),
        queryFn: () => fetchManagedStore(Number(storeId)),
    });

    const setStatus = useMutation({
        mutationFn: (status: 'ACTIVE' | 'INACTIVE') =>
            updateStoreStatus(Number(storeId), status),
        onSuccess: (updated) => {
            void queryClient.invalidateQueries({
                queryKey: ['management', 'stores'],
            });
            queryClient.setQueryData(
                queryKeys.managedStore(Number(storeId)),
                updated,
            );
            toast.success(
                `${updated.name} is now ${updated.status.toLowerCase()}.`,
            );
            setToggling(false);
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    if (isPending) {
        return <PageLoader />;
    }

    if (isError || !store) {
        return <ErrorAlert message={error?.message ?? 'Store not found.'} />;
    }

    const activate = store.status !== 'ACTIVE';

    return (
        <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
                <Link to="/management/stores">
                    <ArrowLeft className="size-4" />
                    All stores
                </Link>
            </Button>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
                        {store.name}
                        <StatusBadge status={store.status} />
                        <span
                            className={
                                store.is_operational
                                    ? 'text-sm font-normal text-emerald-600'
                                    : 'text-sm font-normal text-muted-foreground'
                            }
                        >
                            {store.is_operational
                                ? 'Operational'
                                : 'Not operational'}
                        </span>
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        /store/{store.slug} · joined{' '}
                        {formatDate(store.created_at ?? '')}
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={() => setToggling(true)}
                    disabled={setStatus.isPending}
                >
                    <Power className="size-4" />
                    {activate ? 'Activate store' : 'Deactivate store'}
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Store</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {store.description && (
                            <p className="text-muted-foreground">
                                {store.description}
                            </p>
                        )}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-xl font-semibold">
                                    {store.categories_count ?? 0}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Categories
                                </p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-xl font-semibold">
                                    {store.products_count ?? 0}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Products
                                </p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-xl font-semibold">
                                    {store.orders_count ?? 0}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Orders
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle className="text-base">
                            Subscription
                        </CardTitle>
                        {store.subscription && (
                            <Link
                                to={`/management/subscriptions/${store.subscription.id}`}
                                className="text-sm text-muted-foreground hover:underline"
                            >
                                View details
                            </Link>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {store.subscription ? (
                            <>
                                <p className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Package
                                    </span>
                                    <span>
                                        {store.subscription.package_name}
                                    </span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Price
                                    </span>
                                    <span>
                                        {formatMoney(
                                            store.subscription.package_price,
                                        )}{' '}
                                        /{' '}
                                        {
                                            store.subscription
                                                .package_duration_days
                                        }{' '}
                                        days
                                    </span>
                                </p>
                                <p className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Status
                                    </span>
                                    <StatusBadge
                                        status={store.subscription.status}
                                    />
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Period
                                    </span>
                                    <span>
                                        {store.subscription.starts_at
                                            ? `${formatDate(store.subscription.starts_at)} → ${formatDate(
                                                  store.subscription.ends_at,
                                              )}`
                                            : 'Not started'}
                                    </span>
                                </p>
                            </>
                        ) : (
                            <p className="text-muted-foreground">
                                No subscription yet.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Owners</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {(store.owners ?? []).length === 0 ? (
                            <p className="text-muted-foreground">
                                No owner accounts.
                            </p>
                        ) : (
                            (store.owners ?? []).map((owner) => (
                                <p
                                    key={owner.id}
                                    className="flex justify-between"
                                >
                                    <span className="font-medium">
                                        {owner.name}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {owner.email}
                                    </span>
                                </p>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            <ConfirmDialog
                open={toggling}
                onOpenChange={setToggling}
                destructive={!activate}
                title={
                    activate
                        ? `Activate “${store.name}”?`
                        : `Deactivate “${store.name}”?`
                }
                description={
                    activate
                        ? 'The store becomes reachable again (if its subscription is active).'
                        : 'The storefront and admin panel immediately become unavailable to this store.'
                }
                confirmLabel={activate ? 'Activate' : 'Deactivate'}
                loading={setStatus.isPending}
                onConfirm={() =>
                    setStatus.mutate(activate ? 'ACTIVE' : 'INACTIVE')
                }
            />
        </div>
    );
}
