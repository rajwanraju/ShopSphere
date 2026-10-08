import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/shared/feedback';
import { CartBar } from '@/components/storefront/cart-bar';
import { StorefrontFooter } from '@/components/storefront/footer';
import {
    MobileBottomNavbar,
    MobileTopNavbar,
} from '@/components/storefront/mobile-navbars';
import { StorefrontNavbar } from '@/components/storefront/navbar';
import { fetchStorefrontStore } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import type { StorefrontStore } from '@/types/api';

export interface StorefrontOutlet {
    slug: string;
    store: StorefrontStore;
}

/** Storefront chrome shared by every public store page. */
export default function StorefrontLayout() {
    const { slug = '' } = useParams();
    const { pathname } = useLocation();

    const storeQuery = useQuery({
        queryKey: queryKeys.storefrontStore(slug),
        queryFn: () => fetchStorefrontStore(slug),
        retry: false,
        staleTime: 60_000,
    });

    if (storeQuery.isPending) {
        return <PageLoader label="Loading store…" />;
    }

    if (storeQuery.isError || !storeQuery.data) {
        return <StoreUnavailable />;
    }

    const store = storeQuery.data;

    return (
        <div className="flex min-h-svh flex-col">
            {/* Desktop chrome */}
            <div className="hidden md:block">
                <StorefrontNavbar store={store} slug={slug} />
            </div>

            {/* Mobile chrome */}
            <div className="md:hidden">
                <MobileTopNavbar store={store} slug={slug} />
            </div>

            <main className="flex-1 pb-24 md:pb-0">
                <Outlet context={{ slug, store } satisfies StorefrontOutlet} />
            </main>

            <StorefrontFooter store={store} slug={slug} />
            <CartBar slug={slug} />

            {/* Only show the bottom bar on storefront browsing pages, not checkout. */}
            {!pathname.includes('/checkout') && (
                <MobileBottomNavbar slug={slug} />
            )}
        </div>
    );
}

/** Rendered when the store does not exist or is not operational. */
function StoreUnavailable() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
            <Store className="size-10 text-muted-foreground" />
            <div>
                <h1 className="text-lg font-semibold">Store not available</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    This store does not exist or is currently not operating.
                </p>
            </div>
            <Button asChild variant="outline">
                <Link to="/">Back to ShopSphere</Link>
            </Button>
        </div>
    );
}
