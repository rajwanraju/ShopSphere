import { useState } from 'react';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
    DataTable,
    TablePagination,
    type Column,
} from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { toApiError } from '@/api/client';
import { approvePayment, fetchPayments, rejectPayment } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { formatDateTime, formatMoney } from '@/lib/utils';
import type { PaginatedPayment } from '@/api/endpoints';

type ManagedPayment = PaginatedPayment['data'][number];

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const;

const rejectSchema = z.object({
    rejection_reason: z
        .string()
        .min(1, 'A reason is required.')
        .max(500, 'Keep the reason under 500 characters.'),
});

type RejectForm = z.infer<typeof rejectSchema>;

/** Manual payment verification: review, approve or reject. */
export default function PaymentsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] =
        useState<(typeof FILTERS)[number]>('PENDING');
    const [page, setPage] = useState(1);
    const [approving, setApproving] = useState<ManagedPayment | null>(null);
    const [rejecting, setRejecting] = useState<ManagedPayment | null>(null);

    const rejectForm = useForm<RejectForm>({
        resolver: zodResolver(rejectSchema),
        defaultValues: { rejection_reason: '' },
    });

    const query = {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
    };

    const { data: payments, isPending } = useQuery({
        queryKey: queryKeys.payments(query),
        queryFn: () => fetchPayments(query),
        placeholderData: keepPreviousData,
    });

    function invalidate() {
        void queryClient.invalidateQueries({
            queryKey: ['management', 'payments'],
        });
        void queryClient.invalidateQueries({
            queryKey: ['management', 'subscriptions'],
        });
    }

    const approve = useMutation({
        mutationFn: (id: number) => approvePayment(id),
        onSuccess: () => {
            invalidate();
            toast.success('Payment approved. The subscription is now active.');
            setApproving(null);
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const reject = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) =>
            rejectPayment(id, reason),
        onSuccess: () => {
            invalidate();
            toast.success('Payment rejected.');
            setRejecting(null);
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const columns: Column<ManagedPayment>[] = [
        {
            key: 'store',
            header: 'Store',
            cell: (payment) =>
                payment.store ? (
                    <div className="text-sm">
                        <p className="font-medium">{payment.store.name}</p>
                        <p className="text-xs text-muted-foreground">
                            /store/{payment.store.slug}
                        </p>
                    </div>
                ) : (
                    `Store #${payment.store_id}`
                ),
        },
        {
            key: 'subscription',
            header: 'Subscription',
            cell: (payment) =>
                payment.subscription ? (
                    <div className="text-sm">
                        <p>{payment.subscription.package_name}</p>
                        <p className="text-xs text-muted-foreground">
                            {payment.subscription.status}
                        </p>
                    </div>
                ) : (
                    `#${payment.subscription_id}`
                ),
        },
        {
            key: 'transaction_id',
            header: 'Payment',
            cell: (payment) => (
                <div className="text-sm">
                    <p>{payment.channel_name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                        {payment.transaction_id}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                        {payment.account_number}
                    </p>
                </div>
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
            key: 'created_at',
            header: 'Submitted',
            cell: (payment) => (
                <span className="text-sm">
                    {formatDateTime(payment.created_at)}
                </span>
            ),
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            cell: (payment) =>
                payment.status === 'PENDING' ? (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={approve.isPending || reject.isPending}
                            onClick={() => setApproving(payment)}
                        >
                            <Check className="size-4 text-emerald-600" />
                            Approve
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={approve.isPending || reject.isPending}
                            onClick={() => {
                                rejectForm.reset({ rejection_reason: '' });
                                setRejecting(payment);
                            }}
                        >
                            <X className="size-4 text-destructive" />
                            Reject
                        </Button>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">
                        {payment.verified_at
                            ? `Verified ${formatDateTime(payment.verified_at)}`
                            : '—'}
                    </span>
                ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Payments"
                description="Manual payments waiting for verification."
                actions={
                    <div className="flex gap-1 rounded-lg border p-1">
                        {FILTERS.map((filter) => (
                            <Button
                                key={filter}
                                type="button"
                                variant={
                                    statusFilter === filter
                                        ? 'secondary'
                                        : 'ghost'
                                }
                                size="sm"
                                onClick={() => {
                                    setStatusFilter(filter);
                                    setPage(1);
                                }}
                            >
                                {filter}
                            </Button>
                        ))}
                    </div>
                }
            />

            <DataTable
                columns={columns}
                rows={payments?.data ?? []}
                rowKey={(payment) => payment.id}
                loading={isPending}
                empty="No payments found for this filter."
            />

            {payments && (
                <TablePagination meta={payments.meta} onPage={setPage} />
            )}

            <ConfirmDialog
                open={approving !== null}
                onOpenChange={(open) => !open && setApproving(null)}
                destructive={false}
                confirmLabel="Approve payment"
                title="Approve this payment?"
                description={`Approving activates the ${
                    approving?.subscription?.package_name ?? ''
                } subscription for the store's package duration.`}
                loading={approve.isPending}
                onConfirm={() => approving && approve.mutate(approving.id)}
            />

            <Dialog
                open={rejecting !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejecting(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject payment</DialogTitle>
                        <DialogDescription>
                            The subscription stays inactive and the store owner
                            can submit a new payment.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={rejectForm.handleSubmit(
                            (values) =>
                                rejecting &&
                                reject.mutate({
                                    id: rejecting.id,
                                    reason: values.rejection_reason,
                                }),
                        )}
                        className="space-y-4"
                        noValidate
                    >
                        <div className="space-y-2">
                            <Label htmlFor="rejection_reason">Reason</Label>
                            <textarea
                                id="rejection_reason"
                                rows={3}
                                placeholder="e.g. Transaction ID could not be verified with the bank."
                                className="flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                {...rejectForm.register('rejection_reason')}
                            />
                            {rejectForm.formState.errors.rejection_reason && (
                                <p className="text-sm text-red-600">
                                    {
                                        rejectForm.formState.errors
                                            .rejection_reason.message
                                    }
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setRejecting(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={reject.isPending}
                            >
                                Reject payment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
