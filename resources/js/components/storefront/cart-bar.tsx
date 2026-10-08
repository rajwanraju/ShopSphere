import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchCart } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { useCartStore } from '@/stores/cart';

/**
 * Floating cart bar shown whenever the visitor has items in the cart.
 * Doubles as the initial cart count fetch for this store session.
 */
export function CartBar({ slug }: { slug: string }) {
    const setCount = useCartStore((state) => state.setCount);
    const count = useCartStore((state) => state.counts[slug]);

    useQuery({
        queryKey: queryKeys.cart(slug),
        queryFn: () => fetchCart(slug),
        retry: false,
        staleTime: 60_000,
        select: (cart) => {
            setCount(slug, cart.count);

            return cart.count;
        },
    });

    if (!count || count === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 md:bottom-6">
            <Button asChild size="lg" className="w-full shadow-lg">
                <Link to={`/store/${slug}/cart`}>
                    <ShoppingBag className="size-4" />
                    {count} {count === 1 ? 'item' : 'items'} in cart
                    <span className="ml-auto">View cart →</span>
                </Link>
            </Button>
        </div>
    );
}
