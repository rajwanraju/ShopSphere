import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    EmptyState,
    ErrorAlert,
    GridSkeleton,
} from '@/components/shared/feedback';
import { TablePagination } from '@/components/shared/data-table';
import { ProductCard } from '@/components/storefront/product-card';
import {
    fetchStorefrontCategories,
    fetchStorefrontProducts,
} from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import type { StorefrontOutlet } from '@/layouts/storefront-layout';

/** Storefront home: all products of the current store, filterable. */
export default function StorefrontHomePage() {
    const { slug } = useOutletContext<StorefrontOutlet>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');

    const categoryId = searchParams.get('category')
        ? Number(searchParams.get('category'))
        : null;
    const q = searchParams.get('q') ?? '';
    const page = Number(searchParams.get('page') ?? '1') || 1;

    const categoriesQuery = useQuery({
        queryKey: queryKeys.storefrontCategories(slug),
        queryFn: () => fetchStorefrontCategories(slug),
        staleTime: 60_000,
    });

    const productsQuery = useQuery({
        queryKey: queryKeys.storefrontProducts(slug, {
            category_id: categoryId,
            q,
            page,
        }),
        queryFn: () =>
            fetchStorefrontProducts(slug, { category_id: categoryId, q, page }),
        placeholderData: keepPreviousData,
    });

    function setParam(key: string, value: string | null) {
        setSearchParams(
            (previous) => {
                const next = new URLSearchParams(previous);

                if (value === null || value === '') {
                    next.delete(key);
                } else {
                    next.set(key, value);
                }

                if (key !== 'page') {
                    next.delete('page');
                }

                return next;
            },
            { preventScrollReset: false },
        );
    }

    const categories = categoriesQuery.data ?? [];
    const products = productsQuery.data;

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="text-2xl font-semibold tracking-tight">Products</h1>

            {/* Search + category filter */}
            <div className="mt-4 flex flex-col gap-3">
                <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setParam('q', searchInput.trim());
                    }}
                >
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                            placeholder="Search products…"
                            className="pl-9"
                            aria-label="Search products"
                        />
                    </div>
                    <Button type="submit" variant="secondary">
                        Search
                    </Button>
                </form>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className={cn(
                            'rounded-full border px-3 py-1.5 text-sm transition-colors',
                            categoryId === null
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted',
                        )}
                        onClick={() => setParam('category', null)}
                    >
                        All
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            className={cn(
                                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                                categoryId === category.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted',
                            )}
                            onClick={() =>
                                setParam('category', String(category.id))
                            }
                        >
                            {category.title}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                {productsQuery.isError ? (
                    <ErrorAlert message={productsQuery.error.message} />
                ) : !products ? (
                    <GridSkeleton />
                ) : products.data.length === 0 ? (
                    <EmptyState
                        title="No products found"
                        description={
                            q || categoryId
                                ? 'Try a different search or category.'
                                : 'This store has not published any products yet.'
                        }
                    />
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {products.data.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    slug={slug}
                                />
                            ))}
                        </div>
                        <TablePagination
                            meta={products.meta}
                            onPage={(next) => setParam('page', String(next))}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
