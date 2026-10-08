import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ErrorAlert, PageLoader } from '@/components/shared/feedback';
import { StatusBadge } from '@/components/shared/status-badge';
import { Invoice } from '@/components/store-admin/invoice';
import { toApiError } from '@/api/client';
import { fetchAdminOrder, updateOrderStatus } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { formatDateTime, formatMoney } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';

const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'] as const;

/** Order details, items, status management and printable invoice. */
export default function OrderDetailPage() {
    const { orderId = '' } = useParams();
    const queryClient = useQueryClient();
    const storeName = useAuthStore((state) => state.user?.store?.name ?? '');
    const [nextStatus, setNextStatus] = useState<string | null>(null);

    const {
        data: order,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: queryKeys.adminOrder(Number(orderId)),
        queryFn: () => fetchAdminOrder(Number(orderId)),
    });

    const changeStatus = useMutation({
        mutationFn: (status: string) =>
            updateOrderStatus(Number(orderId), status),
        onSuccess: (updated) => {
            queryClient.setQueryData(
                queryKeys.adminOrder(Number(orderId)),
                updated,
            );
            void queryClient.invalidateQueries({
                queryKey: ['admin', 'orders'],
            });
            toast.success('Order status updated.');
            setNextStatus(null);
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    if (isPending) {
        return <PageLoader />;
    }

    if (isError || !order) {
        return <ErrorAlert message={error?.message ?? 'Order not found.'} />;
    }

    const selectedStatus = nextStatus ?? order.status;

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="mb-1 -ml-2"
                    >
                        <Link to="/admin/orders">
                            <ArrowLeft className="size-4" />
                            All orders
                        </Link>
                    </Button>
                    <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
                        {order.order_number}
                        <StatusBadge status={order.status} />
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Placed {formatDateTime(order.created_at)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        value={selectedStatus}
                        onValueChange={setNextStatus}
                    >
                        <SelectTrigger
                            className="w-40"
                            aria-label="Order status"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {statuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        disabled={
                            nextStatus === null ||
                            nextStatus === order.status ||
                            changeStatus.isPending
                        }
                        onClick={() =>
                            nextStatus && changeStatus.mutate(nextStatus)
                        }
                    >
                        Update status
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Items</CardTitle>
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
                        <p className="flex justify-between">
                            <span className="text-muted-foreground">
                                Subtotal
                            </span>
                            <span>{formatMoney(order.subtotal)}</span>
                        </p>
                        <p className="flex justify-between text-base font-semibold">
                            <span>Total</span>
                            <span>{formatMoney(order.total)}</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-base">Customer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <p className="font-medium">{order.customer.name}</p>
                        <p className="text-muted-foreground">
                            {order.customer.phone}
                        </p>
                        {order.customer.email && (
                            <p className="text-muted-foreground">
                                {order.customer.email}
                            </p>
                        )}
                        <p className="text-muted-foreground">
                            {order.customer.address}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <Invoice order={order} storeName={storeName} />
            </div>
        </div>
    );
}
