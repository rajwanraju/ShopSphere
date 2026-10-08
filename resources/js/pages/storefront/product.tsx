import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext, useParams } from 'react-router-dom';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    EmptyState,
    ErrorAlert,
    PageLoader,
} from '@/components/shared/feedback';
import { useCartMutations } from '@/hooks/use-cart-mutations';
import { fetchStorefrontProduct } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { cn, formatMoney } from '@/lib/utils';
import type { StorefrontOutlet } from '@/layouts/storefront-layout';

const MAX_QUANTITY = 99;

/** Product page: gallery, details, add to cart. */
export default function ProductPage() {
    const { slug } = useOutletContext<StorefrontOutlet>();
    const { productId = '' } = useParams();
    const [activeImage, setActiveImage] = useState(0);
    const [quantity, setQuantity] = useState(1);

    const { add } = useCartMutations(slug);

    const {
        data: product,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: queryKeys.storefrontProduct(slug, Number(productId)),
        queryFn: () => fetchStorefrontProduct(slug, Number(productId)),
        retry: false,
    });

    if (isPending) {
        return <PageLoader />;
    }

    if (isError || !product) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-10">
                <ErrorAlert message={error.message} />
                <div className="mt-4">
                    <EmptyState
                        title="Product not found"
                        description="It may have been removed by the store."
                    />
                </div>
            </div>
        );
    }

    const images = product.images;

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="grid gap-8 md:grid-cols-2">
                {/* Image gallery */}
                <div className="space-y-3">
                    <div className="aspect-square overflow-hidden rounded-xl border bg-muted">
                        {images[activeImage] ? (
                            <img
                                src={images[activeImage]}
                                alt={product.title}
                                className="size-full object-cover"
                            />
                        ) : (
                            <div className="flex size-full items-center justify-center text-muted-foreground">
                                <ShoppingBag className="size-10" />
                            </div>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto">
                            {images.map((image, index) => (
                                <button
                                    key={image}
                                    type="button"
                                    aria-label={`Show image ${index + 1}`}
                                    className={cn(
                                        'size-16 shrink-0 overflow-hidden rounded-md border-2',
                                        index === activeImage
                                            ? 'border-primary'
                                            : 'border-transparent',
                                    )}
                                    onClick={() => setActiveImage(index)}
                                >
                                    <img
                                        src={image}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div>
                    {product.category && (
                        <Badge variant="secondary">
                            {product.category.title}
                        </Badge>
                    )}
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                        {product.title}
                    </h1>
                    <p className="mt-3 text-3xl font-bold">
                        {formatMoney(product.price)}
                    </p>

                    <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                        {product.description}
                    </p>

                    <div className="mt-6 flex items-center gap-3">
                        <div className="flex items-center rounded-md border">
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Decrease quantity"
                                disabled={quantity <= 1}
                                onClick={() =>
                                    setQuantity((value) =>
                                        Math.max(1, value - 1),
                                    )
                                }
                            >
                                <Minus className="size-4" />
                            </Button>
                            <span className="w-10 text-center text-sm font-medium">
                                {quantity}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Increase quantity"
                                disabled={quantity >= MAX_QUANTITY}
                                onClick={() =>
                                    setQuantity((value) =>
                                        Math.min(MAX_QUANTITY, value + 1),
                                    )
                                }
                            >
                                <Plus className="size-4" />
                            </Button>
                        </div>

                        <Button
                            size="lg"
                            className="flex-1"
                            disabled={add.isPending}
                            onClick={() =>
                                add.mutate({ productId: product.id, quantity })
                            }
                        >
                            <ShoppingBag className="size-4" />
                            Add to cart
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
