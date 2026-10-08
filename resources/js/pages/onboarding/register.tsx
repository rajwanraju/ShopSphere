import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    LoaderCircle,
    Store,
} from 'lucide-react';
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
import { PageLoader } from '@/components/shared/feedback';
import InputError from '@/components/input-error';
import { toApiError } from '@/api/client';
import { createStore, fetchAuthUser, fetchPackages } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { cn, formatMoney } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import type { Package as PackagePlan } from '@/types/api';

const detailsSchema = z.object({
    store_name: z
        .string()
        .min(1, 'Store name is required.')
        .max(100, 'Keep the name under 100 characters.'),
    store_description: z
        .string()
        .max(500, 'Keep the description under 500 characters.')
        .optional(),
});

const ownerSchema = z
    .object({
        owner_name: z.string().min(1, 'Your name is required.').max(100),
        owner_email: z
            .string()
            .min(1, 'Email is required.')
            .email('Enter a valid email address.'),
        owner_password: z
            .string()
            .min(8, 'Password must be at least 8 characters.'),
        owner_password_confirmation: z
            .string()
            .min(1, 'Please confirm the password.'),
    })
    .refine(
        (values) =>
            values.owner_password === values.owner_password_confirmation,
        {
            message: 'Passwords do not match.',
            path: ['owner_password_confirmation'],
        },
    );

type DetailsForm = z.infer<typeof detailsSchema>;
type OwnerForm = z.infer<typeof ownerSchema>;

const steps = ['Package', 'Store details', 'Owner account'] as const;

/** Store creation wizard: package → store details → owner account. */
export default function OnboardingRegisterPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const setUser = useAuthStore((state) => state.setUser);

    const [step, setStep] = useState(searchParams.get('package') ? 1 : 0);
    const [packageId, setPackageId] = useState<number | null>(
        searchParams.get('package')
            ? Number(searchParams.get('package'))
            : null,
    );
    const [submitted, setSubmitted] = useState(false);

    const packagesQuery = useQuery({
        queryKey: queryKeys.packages,
        queryFn: fetchPackages,
        staleTime: 5 * 60_000,
    });

    const detailsForm = useForm<DetailsForm>({
        resolver: zodResolver(detailsSchema),
        defaultValues: { store_name: '', store_description: '' },
    });

    const ownerForm = useForm<OwnerForm>({
        resolver: zodResolver(ownerSchema),
        defaultValues: {
            owner_name: '',
            owner_email: '',
            owner_password: '',
            owner_password_confirmation: '',
        },
    });

    async function submitAll() {
        if (packageId === null) {
            setStep(0);

            return;
        }

        setSubmitted(true);

        try {
            const details = detailsForm.getValues();
            const owner = ownerForm.getValues();

            await createStore({
                package_id: packageId,
                store_name: details.store_name,
                store_description: details.store_description || undefined,
                ...owner,
            });

            // The backend starts the new owner's session; sync our user.
            const user = await fetchAuthUser();
            setUser(user);

            toast.success('Your store has been created!');
            void navigate('/onboarding/payment', { replace: true });
        } catch (error) {
            toast.error(toApiError(error).message);
            setSubmitted(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-10">
            <Link
                to="/"
                className="mb-8 flex items-center justify-center gap-2 font-semibold"
            >
                <Store className="size-5" />
                ShopSphere
            </Link>

            {/* Step indicator */}
            <ol className="mb-8 flex items-center justify-center gap-2 text-sm">
                {steps.map((label, index) => (
                    <li key={label} className="flex items-center gap-2">
                        <span
                            className={cn(
                                'flex size-6 items-center justify-center rounded-full border text-xs font-medium',
                                index < step
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : index === step
                                      ? 'border-primary text-primary'
                                      : 'border-border text-muted-foreground',
                            )}
                        >
                            {index < step ? (
                                <Check className="size-3.5" />
                            ) : (
                                index + 1
                            )}
                        </span>
                        <span
                            className={
                                index === step
                                    ? 'font-medium'
                                    : 'text-muted-foreground'
                            }
                        >
                            {label}
                        </span>
                        {index < steps.length - 1 && (
                            <span className="mx-1 text-border">—</span>
                        )}
                    </li>
                ))}
            </ol>

            {step === 0 && (
                <PackageStep
                    plans={packagesQuery.data ?? []}
                    isPending={packagesQuery.isPending}
                    selectedId={packageId}
                    onSelect={setPackageId}
                    onNext={() => setStep(1)}
                />
            )}

            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Store details</CardTitle>
                        <CardDescription>
                            What will your store be called?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="store_name">Store name</Label>
                            <Input
                                id="store_name"
                                autoFocus
                                {...detailsForm.register('store_name')}
                            />
                            <InputError
                                message={
                                    detailsForm.formState.errors.store_name
                                        ?.message
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="store_description">
                                Description (optional)
                            </Label>
                            <Input
                                id="store_description"
                                placeholder="What do you sell?"
                                {...detailsForm.register('store_description')}
                            />
                            <InputError
                                message={
                                    detailsForm.formState.errors
                                        .store_description?.message
                                }
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button variant="outline" onClick={() => setStep(0)}>
                            <ArrowLeft className="size-4" />
                            Back
                        </Button>
                        <Button
                            onClick={async () => {
                                const valid = await detailsForm.trigger();

                                if (valid) {
                                    setStep(2);
                                }
                            }}
                        >
                            Continue
                            <ArrowRight className="size-4" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Owner account</CardTitle>
                        <CardDescription>
                            This account manages{' '}
                            {detailsForm.getValues('store_name') ||
                                'your store'}
                            .
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="owner_name">Your name</Label>
                            <Input
                                id="owner_name"
                                autoFocus
                                {...ownerForm.register('owner_name')}
                            />
                            <InputError
                                message={
                                    ownerForm.formState.errors.owner_name
                                        ?.message
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="owner_email">Email</Label>
                            <Input
                                id="owner_email"
                                type="email"
                                {...ownerForm.register('owner_email')}
                            />
                            <InputError
                                message={
                                    ownerForm.formState.errors.owner_email
                                        ?.message
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="owner_password">Password</Label>
                            <Input
                                id="owner_password"
                                type="password"
                                autoComplete="new-password"
                                {...ownerForm.register('owner_password')}
                            />
                            <InputError
                                message={
                                    ownerForm.formState.errors.owner_password
                                        ?.message
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="owner_password_confirmation">
                                Confirm password
                            </Label>
                            <Input
                                id="owner_password_confirmation"
                                type="password"
                                autoComplete="new-password"
                                {...ownerForm.register(
                                    'owner_password_confirmation',
                                )}
                            />
                            <InputError
                                message={
                                    ownerForm.formState.errors
                                        .owner_password_confirmation?.message
                                }
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button variant="outline" onClick={() => setStep(1)}>
                            <ArrowLeft className="size-4" />
                            Back
                        </Button>
                        <Button
                            disabled={submitted}
                            onClick={async () => {
                                const valid = await ownerForm.trigger();

                                if (valid) {
                                    await submitAll();
                                }
                            }}
                        >
                            {submitted && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            Create store
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}

function PackageStep({
    plans,
    isPending,
    selectedId,
    onSelect,
    onNext,
}: {
    plans: PackagePlan[];
    isPending: boolean;
    selectedId: number | null;
    onSelect: (id: number) => void;
    onNext: () => void;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Choose a package</CardTitle>
                <CardDescription>
                    Your subscription starts with the package you pick.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {isPending ? (
                    <PageLoader label="Loading packages…" />
                ) : plans.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No packages are available right now.
                    </p>
                ) : (
                    plans.map((plan) => (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => onSelect(plan.id)}
                            className={cn(
                                'flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors',
                                selectedId === plan.id
                                    ? 'border-primary bg-primary/5'
                                    : 'hover:bg-muted/50',
                            )}
                        >
                            <span>
                                <span className="block font-medium">
                                    {plan.name}
                                </span>
                                <span className="block text-sm text-muted-foreground">
                                    {plan.duration_days} days
                                    {plan.description
                                        ? ` · ${plan.description}`
                                        : ''}
                                </span>
                            </span>
                            <span className="font-semibold">
                                {formatMoney(plan.price)}
                            </span>
                        </button>
                    ))
                )}
            </CardContent>
            <CardFooter>
                <Button
                    className="ml-auto"
                    disabled={selectedId === null}
                    onClick={onNext}
                >
                    Continue
                    <ArrowRight className="size-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
