import { useState } from 'react';
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
    DataTable,
    TablePagination,
    type Column,
} from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageHeader } from '@/components/shared/page-header';
import {
    deleteProduct,
    fetchAdminCategories,
    fetchAdminProducts,
} from '@/api/endpoints';
import { toApiError } from '@/api/client';
import { queryKeys } from '@/lib/query-keys';
import { formatMoney } from '@/lib/utils';
import type { Product } from '@/types/api';

/** Product management for the current store. */
export default function ProductsPage() {
    const queryClient = useQueryClient();
    const [q, setQ] = useState('');
    const [submittedQ, setSubmittedQ] = useState('');
    const [categoryId, setCategoryId] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [deleting, setDeleting] = useState<Product | null>(null);

    const query = {
        q: submittedQ || undefined,
        category_id: categoryId === 'all' ? undefined : Number(categoryId),
        page,
    };

    const { data: products, isPending } = useQuery({
        queryKey: queryKeys.adminProducts(query),
        queryFn: () => fetchAdminProducts(query),
        placeholderData: keepPreviousData,
    });

    const { data: categories } = useQuery({
        queryKey: queryKeys.adminCategories,
        queryFn: fetchAdminCategories,
    });

    const destroy = useMutation({
        mutationFn: (id: number) => deleteProduct(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['admin', 'products'],
            });
            toast.success('Product deleted.');
            setDeleting(null);
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const columns: Column<Product>[] = [
        {
            key: 'title',
            header: 'Product',
            cell: (product) => (
                <div className="flex items-center gap-3">
                    <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {product.images[0] && (
                            <img
                                src={product.images[0]}
                                alt=""
                                className="size-full object-cover"
                            />
                        )}
                    </div>
                    <span className="line-clamp-1 font-medium">
                        {product.title}
                    </span>
                </div>
            ),
        },
        {
            key: 'category',
            header: 'Category',
            cell: (product) => product.category?.title ?? '—',
        },
        {
            key: 'price',
            header: 'Price',
            cell: (product) => formatMoney(product.price),
        },
        {
            key: 'actions',
            header: '',
            className: 'w-24 text-right',
            cell: (product) => (
                <div className="flex justify-end gap-1">
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${product.title}`}
                    >
                        <Link to={`/admin/products/${product.id}/edit`}>
                            <Pencil className="size-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${product.title}`}
                        onClick={() => setDeleting(product)}
                    >
                        <Trash2 className="size-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Products"
                description="Everything your storefront sells."
                actions={
                    <Button asChild>
                        <Link to="/admin/products/new">
                            <Plus className="size-4" />
                            New product
                        </Link>
                    </Button>
                }
            />

            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <form
                    className="relative flex-1"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setPage(1);
                        setSubmittedQ(q.trim());
                    }}
                >
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                        placeholder="Search products…"
                        className="pl-9"
                        aria-label="Search products"
                    />
                </form>

                <Select
                    value={categoryId}
                    onValueChange={(value) => {
                        setPage(1);
                        setCategoryId(value);
                    }}
                >
                    <SelectTrigger
                        className="sm:w-48"
                        aria-label="Filter by category"
                    >
                        <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {(categories ?? []).map((category) => (
                            <SelectItem
                                key={category.id}
                                value={String(category.id)}
                            >
                                {category.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                columns={columns}
                rows={products?.data ?? []}
                rowKey={(product) => product.id}
                loading={isPending}
                empty={
                    <span className="inline-flex flex-col items-center gap-2">
                        <Package className="size-6" />
                        No products yet. Create your first one.
                    </span>
                }
            />

            {products && (
                <TablePagination meta={products.meta} onPage={setPage} />
            )}

            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete “${deleting?.title ?? ''}”?`}
                description="This also removes the product images. This cannot be undone."
                loading={destroy.isPending}
                onConfirm={() => deleting && destroy.mutate(deleting.id)}
            />
        </div>
    );
}
