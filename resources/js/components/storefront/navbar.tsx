import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { StorefrontStore } from '@/types/api';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cart';

/** Desktop storefront navbar. */
export function StorefrontNavbar({
    store,
    slug,
}: {
    store: StorefrontStore;
    slug: string;
}) {
    const count = useCartStore((state) => state.counts[slug] ?? 0);

    return (
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
                <Link
                    to={`/store/${slug}`}
                    className="flex items-center gap-2 font-semibold"
                >
                    <Store className="size-5" />
                    {store.name}
                </Link>

                <nav className="flex items-center gap-1 text-sm">
                    <NavLink
                        to={`/store/${slug}`}
                        end
                        className={({ isActive }) =>
                            cn(
                                'rounded-md px-3 py-2 font-medium transition-colors',
                                isActive
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                            )
                        }
                    >
                        Shop
                    </NavLink>
                </nav>

                <div className="ml-auto">
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
            </div>
        </header>
    );
}
