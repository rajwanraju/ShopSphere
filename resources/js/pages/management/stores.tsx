import { useState } from 'react';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Power, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DataTable,
    TablePagination,
    type Column,
} from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { toApiError } from '@/api/client';
import { fetchManagedStores, updateStoreStatus } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { formatMoney } from '@/lib/utils';
import type { ManagedStore } from '@/types/api';

interface ToggleState {
    store: ManagedStore;
    activate: boolean;
}

/** Platform store management: view, search, activate, deactivate. */
export default function StoresPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [toggling, setToggling] = useState<ToggleState | null>(null);

    const query = { q: submittedSearch || undefined, page };

    const { data: stores, isPending } = useQuery({
        queryKey: queryKeys.managedStores(query),
        queryFn: () => fetchManagedStores(query),
        placeholderData: keepPreviousData,
    });

    const setStatus = useMutation({
        mutationFn: ({
            id,
            status,
        }: {
            id: number;
            status: 'ACTIVE' | 'INACTIVE';
        }) => updateStoreStatus(id, status),
        onSuccess: (store) => {
            void queryClient.invalidateQueries({
                queryKey: ['management', 'stores'],
            });
            toast.success(
                `${store.name} is now ${store.status.toLowerCase()}.`,
            );
            setToggling(null);
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const columns: Column<ManagedStore>[] = [
        {
            key: 'name',
            header: 'Store',
            cell: (store) => (
                <div>
                    <Link
                        to={`/management/stores/${store.id}`}
                        className="font-medium hover:underline"
                    >
                        {store.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                        /store/{store.slug}
                    </p>
                </div>
            ),
        },
        {
            key: 'subscription',
            header: 'Subscription',
            cell: (store) =>
                store.subscription ? (
                    <div className="text-sm">
                        <p>{store.subscription.package_name}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatMoney(store.subscription.package_price)} ·{' '}
                            {store.subscription.status}
                        </p>
                    </div>
                ) : (
                    '—'
                ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (store) => <StatusBadge status={store.status} />,
        },
        {
            key: 'is_operational',
            header: 'Operational',
            cell: (store) => (store.is_operational ? 'Yes' : 'No'),
        },
        {
            key: 'products_count',
            header: 'Products',
            cell: (store) => store.products_count ?? '—',
        },
        {
            key: 'orders_count',
            header: 'Orders',
            cell: (store) => store.orders_count ?? '—',
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            cell: (store) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={setStatus.isPending}
                        onClick={() =>
                            setToggling({
                                store,
                                activate: store.status !== 'ACTIVE',
                            })
                        }
                    >
                        <Power className="size-4" />
                        {store.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                        <Link to={`/management/stores/${store.id}`}>
                            Details
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Stores"
                description="All tenant stores on the platform."
            />

            <form
                className="relative mb-4 max-w-sm"
                onSubmit={(event) => {
                    event.preventDefault();
                    setPage(1);
                    setSubmittedSearch(search.trim());
                }}
            >
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name or slug…"
                    className="pl-9"
                    aria-label="Search stores"
                />
            </form>

            <DataTable
                columns={columns}
                rows={stores?.data ?? []}
                rowKey={(store) => store.id}
                loading={isPending}
                empty="No stores found."
            />

            {stores && <TablePagination meta={stores.meta} onPage={setPage} />}

            <ConfirmDialog
                open={toggling !== null}
                onOpenChange={(open) => !open && setToggling(null)}
                destructive={toggling?.activate === false}
                title={
                    toggling?.activate
                        ? `Activate “${toggling?.store.name ?? ''}”?`
                        : `Deactivate “${toggling?.store.name ?? ''}”?`
                }
                description={
                    toggling?.activate
                        ? 'The store becomes reachable again (if its subscription is active).'
                        : 'The storefront and admin panel immediately become unavailable to this store.'
                }
                confirmLabel={toggling?.activate ? 'Activate' : 'Deactivate'}
                loading={setStatus.isPending}
                onConfirm={() =>
                    toggling &&
                    setStatus.mutate({
                        id: toggling.store.id,
                        status: toggling.activate ? 'ACTIVE' : 'INACTIVE',
                    })
                }
            />
        </div>
    );
}
