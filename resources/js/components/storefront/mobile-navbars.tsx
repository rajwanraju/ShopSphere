import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, Menu, ShoppingBag, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { fetchStorefrontCategories } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import type { StorefrontStore } from '@/types/api';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cart';

/** Mobile top navbar: menu toggle, brand, cart. */
export function MobileTopNavbar({
    store,
    slug,
}: {
    store: StorefrontStore;
    slug: string;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const count = useCartStore((state) => state.counts[slug] ?? 0);

    return (
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur md:hidden">
            <div className="flex h-12 items-center gap-2 px-3">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open menu"
                    onClick={() => setMenuOpen(true)}
                >
                    <Menu className="size-5" />
                </Button>

                <Link
                    to={`/store/${slug}`}
                    className="flex flex-1 items-center justify-center gap-1.5 font-semibold"
                >
                    <Store className="size-4" />
                    <span className="truncate">{store.name}</span>
                </Link>

                <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Cart"
                >
                    <Link to={`/store/${slug}/cart`}>
                        <ShoppingBag className="size-5" />
                        {count > 0 && (
                            <Badge className="absolute -top-1 -right-1 size-5 rounded-full px-1 text-[10px]">
                                {count}
                            </Badge>
                        )}
                    </Link>
                </Button>
            </div>

            <StorefrontMenubar
                slug={slug}
                open={menuOpen}
                onOpenChange={setMenuOpen}
            />
        </header>
    );
}

/** Mobile bottom navigation bar. */
export function MobileBottomNavbar({ slug }: { slug: string }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const count = useCartStore((state) => state.counts[slug] ?? 0);

    return (
        <>
            <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t bg-background md:hidden">
                <NavLink
                    to={`/store/${slug}`}
                    end
                    className={({ isActive }) =>
                        cn(
                            'flex flex-col items-center gap-0.5 py-2 text-xs',
                            isActive
                                ? 'text-foreground'
                                : 'text-muted-foreground',
                        )
                    }
                >
                    <Home className="size-5" />
                    Home
                </NavLink>

                <button
                    type="button"
                    className="flex flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground"
                    onClick={() => setMenuOpen(true)}
                >
                    <Menu className="size-5" />
                    Categories
                </button>

                <NavLink
                    to={`/store/${slug}/cart`}
                    className={({ isActive }) =>
                        cn(
                            'flex flex-col items-center gap-0.5 py-2 text-xs',
                            isActive
                                ? 'text-foreground'
                                : 'text-muted-foreground',
                        )
                    }
                >
                    <span className="relative">
                        <ShoppingBag className="size-5" />
                        {count > 0 && (
                            <Badge className="absolute -top-2 -right-2 size-4 rounded-full px-1 text-[9px]">
                                {count}
                            </Badge>
                        )}
                    </span>
                    Cart
                </NavLink>
            </nav>

            <div className="h-14 md:hidden" />

            <StorefrontMenubar
                slug={slug}
                open={menuOpen}
                onOpenChange={setMenuOpen}
            />
        </>
    );
}

/** Mobile menubar: categories of the current store. */
export function StorefrontMenubar({
    slug,
    open,
    onOpenChange,
}: {
    slug: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const navigate = useNavigate();

    const { data: categories } = useQuery({
        queryKey: queryKeys.storefrontCategories(slug),
        queryFn: () => fetchStorefrontCategories(slug),
        staleTime: 60_000,
    });

    function goToCategory(categoryId: number | null) {
        onOpenChange(false);

        void navigate(
            categoryId === null
                ? `/store/${slug}`
                : `/store/${slug}?category=${categoryId}`,
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-2 pb-6">
                    <button
                        type="button"
                        className="rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-muted"
                        onClick={() => goToCategory(null)}
                    >
                        All products
                    </button>
                    {(categories ?? []).map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            className="rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => goToCategory(category.id)}
                        >
                            {category.title}
                        </button>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
