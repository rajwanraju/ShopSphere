import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { toApiError } from '@/api/client';
import {
    createCategory,
    deleteCategory,
    fetchAdminCategories,
    updateCategory,
} from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import type { Category } from '@/types/api';

const schema = z.object({
    title: z.string().min(1, 'Title is required.').max(100),
});
type Form = z.infer<typeof schema>;

interface EditorState {
    open: boolean;
    category: Category | null;
}

/** Category management for the current store. */
export default function CategoriesPage() {
    const queryClient = useQueryClient();
    const [editor, setEditor] = useState<EditorState>({
        open: false,
        category: null,
    });
    const [deleting, setDeleting] = useState<Category | null>(null);

    const form = useForm<Form>({
        resolver: zodResolver(schema),
        defaultValues: { title: '' },
    });

    const { data: categories, isPending } = useQuery({
        queryKey: queryKeys.adminCategories,
        queryFn: fetchAdminCategories,
    });

    function invalidate() {
        void queryClient.invalidateQueries({
            queryKey: queryKeys.adminCategories,
        });
        // Product pages show category names and counts.
        void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    }

    const create = useMutation({
        mutationFn: (values: Form) => createCategory(values),
        onSuccess: () => {
            invalidate();
            toast.success('Category created.');
            setEditor({ open: false, category: null });
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const update = useMutation({
        mutationFn: ({ id, values }: { id: number; values: Form }) =>
            updateCategory(id, values),
        onSuccess: () => {
            invalidate();
            toast.success('Category updated.');
            setEditor({ open: false, category: null });
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const destroy = useMutation({
        mutationFn: (id: number) => deleteCategory(id),
        onSuccess: () => {
            invalidate();
            toast.success('Category deleted.');
            setDeleting(null);
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    function openEditor(category: Category | null) {
        form.reset({ title: category?.title ?? '' });
        setEditor({ open: true, category });
    }

    function submit(values: Form) {
        if (editor.category) {
            update.mutate({ id: editor.category.id, values });
        } else {
            create.mutate(values);
        }
    }

    const columns: Column<Category>[] = [
        {
            key: 'title',
            header: 'Title',
            cell: (category) => (
                <span className="font-medium">{category.title}</span>
            ),
        },
        {
            key: 'products_count',
            header: 'Products',
            cell: (category) => category.products_count ?? '—',
        },
        {
            key: 'actions',
            header: '',
            className: 'w-24 text-right',
            cell: (category) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${category.title}`}
                        onClick={() => openEditor(category)}
                    >
                        <Pencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${category.title}`}
                        onClick={() => setDeleting(category)}
                    >
                        <Trash2 className="size-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    const pending = create.isPending || update.isPending;

    return (
        <div>
            <PageHeader
                title="Categories"
                description="Organize your products into categories."
                actions={
                    <Button onClick={() => openEditor(null)}>
                        <Plus className="size-4" />
                        New category
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                rows={categories ?? []}
                rowKey={(category) => category.id}
                loading={isPending}
                empty="No categories yet."
            />

            <Dialog
                open={editor.open}
                onOpenChange={(open) =>
                    setEditor((state) => ({ ...state, open }))
                }
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editor.category ? 'Edit category' : 'New category'}
                        </DialogTitle>
                        <DialogDescription>
                            Category titles are unique within your store.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={form.handleSubmit(submit)}
                        className="space-y-4"
                        noValidate
                    >
                        <div className="space-y-2">
                            <Input
                                placeholder="Category title"
                                autoFocus
                                {...form.register('title')}
                            />
                            {form.formState.errors.title && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.title.message}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setEditor({ open: false, category: null })
                                }
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={pending}>
                                {editor.category ? 'Save changes' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete “${deleting?.title ?? ''}”?`}
                description="Products in this category will keep existing but lose their category."
                loading={destroy.isPending}
                onConfirm={() => deleting && destroy.mutate(deleting.id)}
            />
        </div>
    );
}
