import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorAlert, PageLoader } from '@/components/shared/feedback';
import InputError from '@/components/input-error';
import { StatusBadge } from '@/components/shared/status-badge';
import { toApiError } from '@/api/client';
import {
    fetchOnboardingChannels,
    fetchOnboardingStatus,
    submitPayment,
} from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { cn, formatMoney } from '@/lib/utils';

const schema = z.object({
    payment_channel_id: z.number().int().positive('Select a payment channel.'),
    account_number: z.string().min(1, 'Account number is required.').max(64),
    transaction_id: z.string().min(1, 'Transaction ID is required.').max(64),
});

type Form = z.infer<typeof schema>;

/** Manual subscription payment: channel, account number, transaction ID. */
export default function OnboardingPaymentPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedChannel, setSelectedChannel] = useState<number | null>(null);

    const statusQuery = useQuery({
        queryKey: queryKeys.onboardingStatus,
        queryFn: fetchOnboardingStatus,
    });
    const channelsQuery = useQuery({
        queryKey: queryKeys.onboardingChannels,
        queryFn: fetchOnboardingChannels,
    });

    const form = useForm<Form>({
        resolver: zodResolver(schema),
        defaultValues: { account_number: '', transaction_id: '' },
    });

    const submit = useMutation({
        mutationFn: (values: Form) => submitPayment(values),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.onboardingStatus,
            });
            toast.success('Payment submitted for verification.');
            void navigate('/onboarding/status');
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    if (statusQuery.isPending || channelsQuery.isPending) {
        return <PageLoader />;
    }

    if (statusQuery.isError || !statusQuery.data) {
        return (
            <div className="mx-auto max-w-xl px-4 py-10">
                <ErrorAlert message="Could not load your subscription. Please try again." />
            </div>
        );
    }

    const { subscription, store } = statusQuery.data;

    if (subscription.status === 'ACTIVE') {
        return (
            <div className="mx-auto max-w-xl px-4 py-16 text-center">
                <h1 className="text-xl font-semibold">
                    Your subscription is active
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    {store.name} is live on the {subscription.package_name}{' '}
                    package.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <Button asChild>
                        <Link to="/admin">Go to store panel</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link to={`/store/${store.slug}`}>
                            Visit storefront
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const hasPendingPayment = (statusQuery.data.payments ?? []).some(
        (payment) => payment.status === 'PENDING',
    );
    const channels = channelsQuery.data ?? [];

    function chooseChannel(id: number) {
        setSelectedChannel(id);
        form.setValue('payment_channel_id', id, { shouldValidate: true });
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-10">
            <h1 className="text-2xl font-semibold tracking-tight">
                Pay for your subscription
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Transfer {formatMoney(subscription.package_price)} for the{' '}
                {subscription.package_name} package (
                {subscription.package_duration_days} days), then submit the
                payment details below. We verify payments manually.
            </p>

            {hasPendingPayment && (
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950">
                    You already have a payment awaiting verification.{' '}
                    <Link
                        to="/onboarding/status"
                        className="font-medium underline"
                    >
                        View its status
                    </Link>
                    .
                </div>
            )}

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Payment channels</CardTitle>
                    <CardDescription>
                        Send the money to one of these accounts, then tell us
                        where to look.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {channels.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            No payment channels are available right now.
                        </p>
                    )}
                    {channels.map((channel) => (
                        <button
                            key={channel.id}
                            type="button"
                            onClick={() => chooseChannel(channel.id)}
                            className={cn(
                                'w-full rounded-lg border p-4 text-left transition-colors',
                                selectedChannel === channel.id
                                    ? 'border-primary bg-primary/5'
                                    : 'hover:bg-muted/50',
                            )}
                        >
                            <span className="flex items-center justify-between">
                                <span className="font-medium">
                                    {channel.name}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {channel.account_number}
                                </span>
                            </span>
                            {channel.instructions && (
                                <span className="mt-1 block text-xs text-muted-foreground">
                                    {channel.instructions}
                                </span>
                            )}
                        </button>
                    ))}
                    <InputError
                        message={
                            form.formState.errors.payment_channel_id?.message
                        }
                    />
                </CardContent>
            </Card>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Transfer details</CardTitle>
                    <CardDescription>
                        Reference the account you paid from and the transaction
                        ID.
                    </CardDescription>
                </CardHeader>
                <form
                    onSubmit={form.handleSubmit((values) =>
                        submit.mutate(values),
                    )}
                    className="space-y-4"
                    noValidate
                >
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="account_number">
                                Your account number
                            </Label>
                            <Input
                                id="account_number"
                                {...form.register('account_number')}
                            />
                            <InputError
                                message={
                                    form.formState.errors.account_number
                                        ?.message
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="transaction_id">
                                Transaction ID
                            </Label>
                            <Input
                                id="transaction_id"
                                {...form.register('transaction_id')}
                            />
                            <InputError
                                message={
                                    form.formState.errors.transaction_id
                                        ?.message
                                }
                            />
                        </div>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            Amount due:{' '}
                            {formatMoney(subscription.package_price)} · Status:
                            <StatusBadge status={subscription.status} />
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="ml-auto"
                            disabled={submit.isPending || channels.length === 0}
                        >
                            {submit.isPending && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            Submit payment
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
