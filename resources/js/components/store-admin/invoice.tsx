import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Order } from '@/types/api';
import { formatDateTime, formatMoney } from '@/lib/utils';

/**
 * Printable invoice for an order: order information, customer
 * information, products, quantity, price and total.
 */
export function Invoice({
    order,
    storeName,
}: {
    order: Order;
    storeName: string;
}) {
    return (
        <div>
            <div className="mb-4 flex items-center justify-between print:hidden">
                <h2 className="text-lg font-semibold">Invoice</h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                >
                    <Printer className="size-4" />
                    Print
                </Button>
            </div>

            <div id="invoice" className="rounded-lg border p-6 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-lg font-bold">{storeName}</p>
                        <p className="text-muted-foreground">
                            Invoice for order {order.order_number}
                        </p>
                    </div>
                    <div className="text-right text-muted-foreground">
                        <p className="font-medium text-foreground">
                            Order {order.order_number}
                        </p>
                        <p>{formatDateTime(order.created_at)}</p>
                        <p className="mt-1 tracking-wide uppercase">
                            {order.status}
                        </p>
                    </div>
                </div>

                <div className="mt-6 rounded-md bg-muted/50 p-4">
                    <p className="font-medium">Billed to</p>
                    <p>{order.customer.name}</p>
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
                </div>

                <table className="mt-6 w-full text-left">
                    <thead className="border-b text-xs tracking-wide text-muted-foreground uppercase">
                        <tr>
                            <th className="py-2">Product</th>
                            <th className="py-2 text-center">Qty</th>
                            <th className="py-2 text-right">Price</th>
                            <th className="py-2 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(order.items ?? []).map((item) => (
                            <tr
                                key={item.id}
                                className="border-b last:border-0"
                            >
                                <td className="py-2.5">{item.product_title}</td>
                                <td className="py-2.5 text-center">
                                    {item.quantity}
                                </td>
                                <td className="py-2.5 text-right">
                                    {formatMoney(item.product_price)}
                                </td>
                                <td className="py-2.5 text-right">
                                    {formatMoney(item.subtotal)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-4 ml-auto w-full max-w-56 space-y-1.5">
                    <p className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatMoney(order.subtotal)}</span>
                    </p>
                    <Separator />
                    <p className="flex justify-between text-base font-semibold">
                        <span>Total</span>
                        <span>{formatMoney(order.total)}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
