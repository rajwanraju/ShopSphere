import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ErrorAlert, PageLoader } from '@/components/shared/feedback';
import { PageHeader } from '@/components/shared/page-header';
import { ImageUploader } from '@/components/shared/image-uploader';
import { toApiError } from '@/api/client';
import {
    createProduct,
    fetchAdminCategories,
    fetchAdminProduct,
    updateProduct,
} from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
    title: z.string().min(1, 'Title is required.').max(150),
    description: z.string().min(1, 'Description is required.').max(5000),
    price: z.coerce
        .number({ message: 'Price is required.' })
        .min(0, 'Price cannot be negative.'),
    category_id: z.coerce
        .number({ message: 'Select a category.' })
        .int()
        .positive('Select a category.'),
});

type Form = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

/**
 * The API returns full asset URLs; the backend expects stored relative
 * paths back in `existing_images`, so normalize on load.
 */
function toRelativePath(url: string): string {
    return url.replace(/^.*?\/storage\//, '');
}

/** Create / edit product form. Images go through the uploader component. */
export default function ProductFormPage() {
    const { productId } = useParams();
    const isEdit = productId !== undefined;
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);

    const { data: categories } = useQuery({
        queryKey: queryKeys.adminCategories,
        queryFn: fetchAdminCategories,
    });

    const productQuery = useQuery({
        queryKey: queryKeys.adminProduct(Number(productId)),
        queryFn: () => fetchAdminProduct(Number(productId)),
        enabled: isEdit,
    });

    const form = useForm<FormInput, unknown, Form>({
        resolver: zodResolver(schema),
        defaultValues: { title: '', description: '', price: 0, category_id: 0 },
    });

    useEffect(() => {
        if (productQuery.data) {
            const product = productQuery.data;

            form.reset({
                title: product.title,
                description: product.description,
                price: product.price,
                category_id: product.category_id,
            });
            setExistingImages(product.images.map(toRelativePath));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productQuery.data, form]);

    const save = useMutation({
        mutationFn: (values: Form) => {
            const payload = {
                ...values,
                images: newFiles.length > 0 ? newFiles : undefined,
                existing_images: existingImages,
            };

            return isEdit
                ? updateProduct(Number(productId), payload)
                : createProduct(payload);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['admin', 'products'],
            });
            toast.success(isEdit ? 'Product updated.' : 'Product created.');
            void navigate('/admin/products');
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    if (isEdit && productQuery.isPending) {
        return <PageLoader />;
    }

    if (isEdit && (productQuery.isError || !productQuery.data)) {
        return <ErrorAlert message="Product not found." />;
    }

    function submit(values: Form) {
        save.mutate(values);
    }

    return (
        <div className="mx-auto max-w-2xl">
            <PageHeader
                title={isEdit ? 'Edit product' : 'New product'}
                actions={
                    <Button asChild variant="outline">
                        <Link to="/admin/products">Back</Link>
                    </Button>
                }
            />

            <form
                onSubmit={form.handleSubmit(submit)}
                className="space-y-4"
                noValidate
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" {...form.register('title')} />
                            {form.formState.errors.title && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.title.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={
                                    form.watch('category_id')
                                        ? String(form.watch('category_id'))
                                        : ''
                                }
                                onValueChange={(value) =>
                                    form.setValue(
                                        'category_id',
                                        Number(value),
                                        { shouldValidate: true },
                                    )
                                }
                            >
                                <SelectTrigger className="w-full" id="category">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
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
                            {form.formState.errors.category_id && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.category_id.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Price</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                {...form.register('price')}
                            />
                            {form.formState.errors.price && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.price.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                rows={5}
                                className="flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                {...form.register('description')}
                            />
                            {form.formState.errors.description && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.description.message}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Images</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ImageUploader
                            existingImages={existingImages}
                            onExistingChange={setExistingImages}
                            newFiles={newFiles}
                            onNewFilesChange={setNewFiles}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" asChild>
                        <Link to="/admin/products">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={save.isPending}>
                        {save.isPending && (
                            <LoaderCircle className="size-4 animate-spin" />
                        )}
                        {isEdit ? 'Save changes' : 'Create product'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
