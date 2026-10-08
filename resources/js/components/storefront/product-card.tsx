import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useCartMutations } from '@/hooks/use-cart-mutations';
import type { Product } from '@/types/api';
import { formatMoney } from '@/lib/utils';

/** Storefront product card: image, title, category, price, add to cart. */
export function ProductCard({
    product,
    slug,
}: {
    product: Product;
    slug: string;
}) {
    const { add } = useCartMutations(slug);

    return (
        <Card className="group gap-0 overflow-hidden py-0">
            <Link to={`/store/${slug}/product/${product.id}`} className="block">
                <div className="aspect-square overflow-hidden bg-muted">
                    {product.images[0] ? (
                        <img
                            src={product.images[0]}
                            alt={product.title}
                            className="size-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                            <ShoppingBag className="size-8" />
                        </div>
                    )}
                </div>
            </Link>
            <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">
                    {product.category?.title ?? 'Uncategorized'}
                </p>
                <Link
                    to={`/store/${slug}/product/${product.id}`}
                    className="line-clamp-1 text-sm font-medium hover:underline"
                >
                    {product.title}
                </Link>
                <p className="mt-1 text-base font-semibold">
                    {formatMoney(product.price)}
                </p>
            </CardContent>
            <CardFooter className="p-3 pt-0">
                <Button
                    size="sm"
                    className="w-full"
                    disabled={add.isPending}
                    onClick={() => add.mutate({ productId: product.id })}
                >
                    <ShoppingBag className="size-4" />
                    Add to cart
                </Button>
            </CardFooter>
        </Card>
    );
}
