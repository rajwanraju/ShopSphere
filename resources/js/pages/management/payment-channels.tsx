import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable, type Column } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ErrorAlert } from '@/components/shared/feedback';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { toApiError } from '@/api/client';
import {
    createPaymentChannel,
    deletePaymentChannel,
    fetchPaymentChannels,
    togglePaymentChannel,
    updatePaymentChannel,
} from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import type { PaymentChannel } from '@/types/api';

const schema = z.object({
    name: z.string().min(1, 'Name is required.').max(100),
    account_number: z.string().min(1, 'Account number is required.').max(100),
    instructions: z.string().max(1000).optional(),
});

type Form = z.infer<typeof schema>;

interface EditorState {
    open: boolean;
    channel: PaymentChannel | null;
}

/** Manual payment channel management: account numbers and instructions. */
export default function PaymentChannelsPage() {
    const queryClient = useQueryClient();
    const [editor, setEditor] = useState<EditorState>({
        open: false,
        channel: null,
    });
    const [deleting, setDeleting] = useState<PaymentChannel | null>(null);

    const form = useForm<Form>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', account_number: '', instructions: '' },
    });

    const {
        data: channels,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: queryKeys.paymentChannels,
        queryFn: fetchPaymentChannels,
    });

    function invalidate() {
        void queryClient.invalidateQueries({
            queryKey: queryKeys.paymentChannels,
        });
        void queryClient.invalidateQueries({
            queryKey: queryKeys.onboardingChannels,
        });
    }

    const create = useMutation({
        mutationFn: (values: Form) => createPaymentChannel(values),
        onSuccess: () => {
            invalidate();
            toast.success('Payment channel created.');
            setEditor({ open: false, channel: null });
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const update = useMutation({
        mutationFn: ({ id, values }: { id: number; values: Form }) =>
            updatePaymentChannel(id, values),
        onSuccess: () => {
            invalidate();
            toast.success('Payment channel updated.');
            setEditor({ open: false, channel: null });
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const toggle = useMutation({
        mutationFn: (id: number) => togglePaymentChannel(id),
        onSuccess: (channel) => {
            invalidate();
            toast.success(
                `Channel ${channel.is_active ? 'activated' : 'deactivated'}.`,
            );
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const destroy = useMutation({
        mutationFn: (id: number) => deletePaymentChannel(id),
        onSuccess: () => {
            invalidate();
            toast.success('Payment channel deleted.');
            setDeleting(null);
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    function openEditor(channel: PaymentChannel | null) {
        form.reset({
            name: channel?.name ?? '',
            account_number: channel?.account_number ?? '',
            instructions: channel?.instructions ?? '',
        });
        setEditor({ open: true, channel });
    }

    function submit(values: Form) {
        if (editor.channel) {
            update.mutate({ id: editor.channel.id, values });
        } else {
            create.mutate(values);
        }
    }

    const saving = create.isPending || update.isPending;

    const columns: Column<PaymentChannel>[] = [
        {
            key: 'name',
            header: 'Channel',
            cell: (channel) => (
                <div className="text-sm">
                    <p className="font-medium">{channel.name}</p>
                    {channel.instructions && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                            {channel.instructions}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'account_number',
            header: 'Account number',
            cell: (channel) => (
                <span className="font-mono text-xs">
                    {channel.account_number}
                </span>
            ),
        },
        {
            key: 'is_active',
            header: 'Status',
            cell: (channel) => (
                <StatusBadge
                    status={channel.is_active ? 'ACTIVE' : 'INACTIVE'}
                />
            ),
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            cell: (channel) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${channel.name}`}
                        onClick={() => openEditor(channel)}
                    >
                        <Pencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={
                            channel.is_active
                                ? 'Deactivate channel'
                                : 'Activate channel'
                        }
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate(channel.id)}
                    >
                        <Power
                            className={
                                channel.is_active
                                    ? 'size-4 text-emerald-600'
                                    : 'size-4 text-muted-foreground'
                            }
                        />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${channel.name}`}
                        onClick={() => setDeleting(channel)}
                    >
                        <Trash2 className="size-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Payment channels"
                description="Manual payment targets offered to store owners during onboarding."
                actions={
                    <Button onClick={() => openEditor(null)}>
                        <Plus className="size-4" />
                        New channel
                    </Button>
                }
            />

            {isError && <ErrorAlert message={error.message} />}

            <DataTable
                columns={columns}
                rows={channels ?? []}
                rowKey={(channel) => channel.id}
                loading={isPending}
                empty="No payment channels yet."
            />

            <Dialog
                open={editor.open}
                onOpenChange={(open) =>
                    setEditor((state) => ({ ...state, open }))
                }
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editor.channel ? 'Edit channel' : 'New channel'}
                        </DialogTitle>
                        <DialogDescription>
                            Store owners copy the account number and submit a
                            transaction ID.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={form.handleSubmit(submit)}
                        className="space-y-4"
                        noValidate
                    >
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                autoFocus
                                {...form.register('name')}
                            />
                            {form.formState.errors.name && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.name.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="account_number">
                                Account number
                            </Label>
                            <Input
                                id="account_number"
                                {...form.register('account_number')}
                            />
                            {form.formState.errors.account_number && (
                                <p className="text-sm text-red-600">
                                    {
                                        form.formState.errors.account_number
                                            .message
                                    }
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instructions">
                                Instructions (optional)
                            </Label>
                            <textarea
                                id="instructions"
                                rows={3}
                                className="flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                {...form.register('instructions')}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setEditor({ open: false, channel: null })
                                }
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {editor.channel ? 'Save changes' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete “${deleting?.name ?? ''}”?`}
                description="It disappears from onboarding immediately. Existing payments keep their snapshot."
                loading={destroy.isPending}
                onConfirm={() => deleting && destroy.mutate(deleting.id)}
            />
        </div>
    );
}
