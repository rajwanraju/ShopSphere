import { useQuery } from '@tanstack/react-query';
import { Link, useOutletContext } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
    EmptyState,
    ErrorAlert,
    PageLoader,
} from '@/components/shared/feedback';
import { useCartMutations } from '@/hooks/use-cart-mutations';
import { fetchCart } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { formatMoney } from '@/lib/utils';
import { useState } from 'react';
import type { StorefrontOutlet } from '@/layouts/storefront-layout';

/** Visitor cart for the current store, fully store isolated. */
export default function CartPage() {
    const { slug } = useOutletContext<StorefrontOutlet>();
    const [confirmClear, setConfirmClear] = useState(false);

    const { update, remove, clear } = useCartMutations(slug);

    const {
        data: cart,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: queryKeys.cart(slug),
        queryFn: () => fetchCart(slug),
        retry: false,
    });

    if (isPending) {
        return <PageLoader />;
    }

    if (isError) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-10">
                <ErrorAlert message={error.message} />
            </div>
        );
    }

    if (cart.items.length === 0) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16">
                <EmptyState
                    title="Your cart is empty"
                    description="Browse the shop and add something you like."
                />
                <div className="mt-6 text-center">
                    <Button asChild>
                        <Link to={`/store/${slug}`}>
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
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Your cart
                </h1>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmClear(true)}
                >
                    <Trash2 className="size-4" />
                    Clear cart
                </Button>
            </div>

            <Card className="mt-4">
                <CardContent className="divide-y p-0">
                    {cart.items.map((item) => (
                        <div
                            key={item.product_id}
                            className="flex items-center gap-4 p-4"
                        >
                            <div className="size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <Link
                                    to={`/store/${slug}/product/${item.product_id}`}
                                    className="line-clamp-1 font-medium hover:underline"
                                >
                                    {item.title}
                                </Link>
                                <p className="text-sm text-muted-foreground">
                                    {formatMoney(item.price)} each
                                </p>
                            </div>

                            <div className="flex items-center rounded-md border">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label={`Decrease ${item.title} quantity`}
                                    disabled={update.isPending}
                                    onClick={() =>
                                        update.mutate({
                                            productId: item.product_id,
                                            quantity: item.quantity - 1,
                                        })
                                    }
                                >
                                    <Minus className="size-3.5" />
                                </Button>
                                <span className="w-8 text-center text-sm">
                                    {item.quantity}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label={`Increase ${item.title} quantity`}
                                    disabled={
                                        update.isPending || item.quantity >= 99
                                    }
                                    onClick={() =>
                                        update.mutate({
                                            productId: item.product_id,
                                            quantity: item.quantity + 1,
                                        })
                                    }
                                >
                                    <Plus className="size-3.5" />
                                </Button>
                            </div>

                            <p className="hidden w-20 text-right font-medium sm:block">
                                {formatMoney(item.line_total)}
                            </p>

                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Remove ${item.title}`}
                                disabled={remove.isPending}
                                onClick={() => remove.mutate(item.product_id)}
                            >
                                <Trash2 className="size-4 text-muted-foreground" />
                            </Button>
                        </div>
                    ))}
                </CardContent>

                <CardHeader className="border-t">
                    <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-stretch gap-4">
                    <div className="space-y-1.5 text-sm">
                        <p className="flex justify-between">
                            <span className="text-muted-foreground">Items</span>
                            <span>{cart.count}</span>
                        </p>
                        <Separator />
                        <p className="flex justify-between text-base font-semibold">
                            <span>Total</span>
                            <span>{formatMoney(cart.subtotal)}</span>
                        </p>
                    </div>
                    <Button asChild size="lg" className="w-full">
                        <Link to={`/store/${slug}/checkout`}>
                            Proceed to checkout
                        </Link>
                    </Button>
                </CardFooter>
            </Card>

            <ConfirmDialog
                open={confirmClear}
                onOpenChange={setConfirmClear}
                title="Clear cart?"
                description="All items will be removed from your cart."
                confirmLabel="Clear cart"
                loading={clear.isPending}
                onConfirm={() =>
                    clear.mutate(undefined, {
                        onSuccess: () => setConfirmClear(false),
                    })
                }
            />
        </div>
    );
}
