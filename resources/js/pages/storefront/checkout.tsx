import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { LoaderCircle, ShoppingBag } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { EmptyState, PageLoader } from '@/components/shared/feedback';
import InputError from '@/components/input-error';
import { toApiError } from '@/api/client';
import { checkout, fetchCart } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { formatMoney } from '@/lib/utils';
import type { StorefrontOutlet } from '@/layouts/storefront-layout';

const schema = z.object({
    customer_name: z.string().min(1, 'Name is required.').max(100),
    customer_email: z
        .string()
        .email('Enter a valid email address.')
        .optional()
        .or(z.literal('')),
    customer_phone: z.string().min(1, 'Phone number is required.').max(32),
    customer_address: z.string().min(1, 'Address is required.').max(500),
});

type Form = z.infer<typeof schema>;

/** Checkout: cart → form → order → confirmation. */
export default function CheckoutPage() {
    const { slug } = useOutletContext<StorefrontOutlet>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: cart, isPending } = useQuery({
        queryKey: queryKeys.cart(slug),
        queryFn: () => fetchCart(slug),
        retry: false,
    });

    const form = useForm<Form>({
        resolver: zodResolver(schema),
        defaultValues: {
            customer_name: '',
            customer_email: '',
            customer_phone: '',
            customer_address: '',
        },
    });

    const placeOrder = useMutation({
        mutationFn: (values: Form) =>
            checkout(slug, {
                ...values,
                customer_email: values.customer_email || undefined,
            }),
        onSuccess: (order) => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.cart(slug),
            });
            toast.success('Order placed!');
            void navigate(`/store/${slug}/orders/${order.order_number}`, {
                replace: true,
            });
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    if (isPending) {
        return <PageLoader />;
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16">
                <EmptyState
                    title="Nothing to check out"
                    description="Your cart is empty."
                />
                <div className="mt-6 text-center">
                    <Button asChild>
                        <Link
                            to={`/store/${slug}`}
                            className="inline-flex items-center gap-2"
                        >
                            <ShoppingBag className="size-4" />
                            Continue shopping
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>

            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Delivery details
                        </CardTitle>
                        <CardDescription>
                            Where should we send your order?
                        </CardDescription>
                    </CardHeader>
                    <form
                        onSubmit={form.handleSubmit((values) =>
                            placeOrder.mutate(values),
                        )}
                        className="space-y-4"
                        noValidate
                    >
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer_name">Full name</Label>
                                <Input
                                    id="customer_name"
                                    autoFocus
                                    {...form.register('customer_name')}
                                />
                                <InputError
                                    message={
                                        form.formState.errors.customer_name
                                            ?.message
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customer_email">
                                    Email (optional)
                                </Label>
                                <Input
                                    id="customer_email"
                                    type="email"
                                    {...form.register('customer_email')}
                                />
                                <InputError
                                    message={
                                        form.formState.errors.customer_email
                                            ?.message
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customer_phone">Phone</Label>
                                <Input
                                    id="customer_phone"
                                    {...form.register('customer_phone')}
                                />
                                <InputError
                                    message={
                                        form.formState.errors.customer_phone
                                            ?.message
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customer_address">
                                    Address
                                </Label>
                                <Input
                                    id="customer_address"
                                    {...form.register('customer_address')}
                                />
                                <InputError
                                    message={
                                        form.formState.errors.customer_address
                                            ?.message
                                    }
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={placeOrder.isPending}
                            >
                                {placeOrder.isPending && (
                                    <LoaderCircle className="size-4 animate-spin" />
                                )}
                                Place order · {formatMoney(cart.subtotal)}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-base">
                            Order summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {cart.items.map((item) => (
                            <p
                                key={item.product_id}
                                className="flex justify-between gap-2"
                            >
                                <span className="min-w-0 truncate text-muted-foreground">
                                    {item.quantity} × {item.title}
                                </span>
                                <span className="shrink-0">
                                    {formatMoney(item.line_total)}
                                </span>
                            </p>
                        ))}
                        <Separator />
                        <p className="flex justify-between text-base font-semibold">
                            <span>Total</span>
                            <span>{formatMoney(cart.subtotal)}</span>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
