import { Link } from 'react-router-dom';
import type { StorefrontStore } from '@/types/api';

/** Storefront footer. */
export function StorefrontFooter({
    store,
    slug,
}: {
    store: StorefrontStore;
    slug: string;
}) {
    return (
        <footer className="border-t bg-muted/30">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
                <p className="font-medium text-foreground">{store.name}</p>
                <nav className="flex gap-4">
                    <Link
                        to={`/store/${slug}`}
                        className="hover:text-foreground"
                    >
                        Shop
                    </Link>
                    <Link
                        to={`/store/${slug}/cart`}
                        className="hover:text-foreground"
                    >
                        Cart
                    </Link>
                </nav>
                <p>
                    © {new Date().getFullYear()} {store.name}. Powered by
                    ShopSphere.
                </p>
            </div>
        </footer>
    );
}
