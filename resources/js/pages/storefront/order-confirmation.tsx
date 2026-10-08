import { useQuery } from '@tanstack/react-query';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { CheckCircle2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ErrorAlert, PageLoader } from '@/components/shared/feedback';
import { StatusBadge } from '@/components/shared/status-badge';
import { fetchOrderConfirmation } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { formatDateTime, formatMoney } from '@/lib/utils';
import type { StorefrontOutlet } from '@/layouts/storefront-layout';

/** Order confirmation, looked up by unguessable order number. */
export default function OrderConfirmationPage() {
    const { slug } = useOutletContext<StorefrontOutlet>();
    const { orderNumber = '' } = useParams();

    const {
        data: order,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: queryKeys.storefrontOrder(slug, orderNumber),
        queryFn: () => fetchOrderConfirmation(slug, orderNumber),
        retry: false,
        enabled: orderNumber !== '',
    });

    if (isPending) {
        return <PageLoader />;
    }

    if (isError || !order) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-10">
                <ErrorAlert message={error.message} />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-10">
            <div className="mb-6 flex flex-col items-center text-center">
                <CheckCircle2 className="size-12 text-emerald-600" />
                <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                    Thank you for your order!
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Order{' '}
                    <span className="font-medium text-foreground">
                        {order.order_number}
                    </span>{' '}
                    · {formatDateTime(order.created_at)}
                </p>
                <StatusBadge status={order.status} className="mt-2" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Package className="size-4" />
                        Items
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    {(order.items ?? []).map((item) => (
                        <div
                            key={item.id}
                            className="flex justify-between gap-2"
                        >
                            <span className="min-w-0">
                                {item.quantity} × {item.product_title}
                                <span className="block text-xs text-muted-foreground">
                                    {formatMoney(item.product_price)} each
                                </span>
                            </span>
                            <span className="shrink-0">
                                {formatMoney(item.subtotal)}
                            </span>
                        </div>
                    ))}

                    <Separator />

                    <p className="flex justify-between text-base font-semibold">
                        <span>Total</span>
                        <span>{formatMoney(order.total)}</span>
                    </p>

                    <Separator />

                    <div className="text-muted-foreground">
                        <p className="font-medium text-foreground">
                            Delivery to
                        </p>
                        <p>{order.customer.name}</p>
                        <p>{order.customer.phone}</p>
                        {order.customer.email && <p>{order.customer.email}</p>}
                        <p>{order.customer.address}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 text-center">
                <Button asChild>
                    <Link to={`/store/${slug}`}>Continue shopping</Link>
                </Button>
            </div>
        </div>
    );
}
