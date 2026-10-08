import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ErrorAlert } from '@/components/shared/feedback';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { toApiError } from '@/api/client';
import {
    createPackage,
    deletePackage,
    fetchManagedPackages,
    togglePackage,
    updatePackage,
} from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { cn, formatMoney } from '@/lib/utils';
import type { Package as PackagePlan } from '@/types/api';

const schema = z.object({
    name: z.string().min(1, 'Name is required.').max(100),
    description: z.string().max(500).optional(),
    price: z.coerce
        .number({ message: 'Price is required.' })
        .min(0, 'Price cannot be negative.'),
    duration_days: z.coerce
        .number({ message: 'Duration is required.' })
        .int('Use whole days.')
        .min(1, 'At least one day.'),
});

type Form = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

interface EditorState {
    open: boolean;
    plan: PackagePlan | null;
}

/** SaaS package management. */
export default function PackagesPage() {
    const queryClient = useQueryClient();
    const [editor, setEditor] = useState<EditorState>({
        open: false,
        plan: null,
    });
    const [deleting, setDeleting] = useState<PackagePlan | null>(null);

    const form = useForm<FormInput, unknown, Form>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            description: '',
            price: 0,
            duration_days: 30,
        },
    });

    const {
        data: plans,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: queryKeys.managedPackages,
        queryFn: fetchManagedPackages,
    });

    function invalidate() {
        void queryClient.invalidateQueries({
            queryKey: queryKeys.managedPackages,
        });
        void queryClient.invalidateQueries({ queryKey: queryKeys.packages });
    }

    const create = useMutation({
        mutationFn: (values: Form) => createPackage(values),
        onSuccess: () => {
            invalidate();
            toast.success('Package created.');
            setEditor({ open: false, plan: null });
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const update = useMutation({
        mutationFn: ({ id, values }: { id: number; values: Form }) =>
            updatePackage(id, values),
        onSuccess: () => {
            invalidate();
            toast.success('Package updated.');
            setEditor({ open: false, plan: null });
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const toggle = useMutation({
        mutationFn: (id: number) => togglePackage(id),
        onSuccess: (plan) => {
            invalidate();
            toast.success(
                `Package ${plan.is_active ? 'activated' : 'deactivated'}.`,
            );
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const destroy = useMutation({
        mutationFn: (id: number) => deletePackage(id),
        onSuccess: () => {
            invalidate();
            toast.success('Package deleted.');
            setDeleting(null);
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    function openEditor(plan: PackagePlan | null) {
        form.reset({
            name: plan?.name ?? '',
            description: plan?.description ?? '',
            price: plan?.price ?? 0,
            duration_days: plan?.duration_days ?? 30,
        });
        setEditor({ open: true, plan });
    }

    function submit(values: Form) {
        if (editor.plan) {
            update.mutate({ id: editor.plan.id, values });
        } else {
            create.mutate(values);
        }
    }

    const saving = create.isPending || update.isPending;

    return (
        <div>
            <PageHeader
                title="Packages"
                description="Subscription plans merchants can choose from."
                actions={
                    <Button onClick={() => openEditor(null)}>
                        <Plus className="size-4" />
                        New package
                    </Button>
                }
            />

            {isError && <ErrorAlert message={error.message} />}

            {isPending ? (
                <p className="text-sm text-muted-foreground">
                    Loading packages…
                </p>
            ) : (plans ?? []).length === 0 ? (
                <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                    No packages yet.
                </p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(plans ?? []).map((plan) => (
                        <Card
                            key={plan.id}
                            className={cn(!plan.is_active && 'opacity-70')}
                        >
                            <CardHeader className="flex-row items-start justify-between">
                                <CardTitle className="text-base">
                                    {plan.name}
                                </CardTitle>
                                <StatusBadge
                                    status={
                                        plan.is_active ? 'ACTIVE' : 'INACTIVE'
                                    }
                                />
                            </CardHeader>
                            <CardContent className="flex-1 text-sm">
                                <p className="text-2xl font-bold">
                                    {formatMoney(plan.price)}
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {' '}
                                        / {plan.duration_days} days
                                    </span>
                                </p>
                                {plan.description && (
                                    <p className="mt-2 line-clamp-2 text-muted-foreground">
                                        {plan.description}
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter className="gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Edit ${plan.name}`}
                                    onClick={() => openEditor(plan)}
                                >
                                    <Pencil className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={
                                        plan.is_active
                                            ? 'Deactivate'
                                            : 'Activate'
                                    }
                                    disabled={toggle.isPending}
                                    onClick={() => toggle.mutate(plan.id)}
                                >
                                    <Power
                                        className={cn(
                                            'size-4',
                                            plan.is_active
                                                ? 'text-emerald-600'
                                                : 'text-muted-foreground',
                                        )}
                                    />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Delete ${plan.name}`}
                                    className="ml-auto"
                                    onClick={() => setDeleting(plan)}
                                >
                                    <Trash2 className="size-4 text-destructive" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog
                open={editor.open}
                onOpenChange={(open) =>
                    setEditor((state) => ({ ...state, open }))
                }
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editor.plan ? 'Edit package' : 'New package'}
                        </DialogTitle>
                        <DialogDescription>
                            {editor.plan
                                ? 'Update the plan details.'
                                : 'Define a new subscription plan.'}
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
                            <Label htmlFor="description">
                                Description (optional)
                            </Label>
                            <Input
                                id="description"
                                {...form.register('description')}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...form.register('price')}
                                />
                                {form.formState.errors.price && (
                                    <p className="text-sm text-red-600">
                                        {form.formState.errors.price.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration_days">
                                    Duration (days)
                                </Label>
                                <Input
                                    id="duration_days"
                                    type="number"
                                    min="1"
                                    {...form.register('duration_days')}
                                />
                                {form.formState.errors.duration_days && (
                                    <p className="text-sm text-red-600">
                                        {
                                            form.formState.errors.duration_days
                                                .message
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setEditor({ open: false, plan: null })
                                }
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {editor.plan ? 'Save changes' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete “${deleting?.name ?? ''}”?`}
                description="Existing subscriptions are unaffected, but new merchants can no longer pick it."
                loading={destroy.isPending}
                onConfirm={() => deleting && destroy.mutate(deleting.id)}
            />
        </div>
    );
}
