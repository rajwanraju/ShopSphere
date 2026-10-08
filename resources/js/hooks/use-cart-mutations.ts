import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    addToCart,
    clearCart,
    removeCartItem,
    updateCartItem,
} from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { toApiError } from '@/api/client';
import type { Cart } from '@/types/api';
import { useCartStore } from '@/stores/cart';

interface AddVariables {
    productId: number;
    quantity?: number;
    silent?: boolean;
}

/**
 * Cart mutations for a storefront, shared by the product card, product
 * page and cart page so behaviour never diverges between them.
 */
export function useCartMutations(slug: string) {
    const queryClient = useQueryClient();
    const setCount = useCartStore((state) => state.setCount);

    function syncCart(cart: Cart) {
        queryClient.setQueryData(queryKeys.cart(slug), cart);
        setCount(slug, cart.count);
    }

    const add = useMutation({
        mutationFn: ({ productId, quantity }: AddVariables) =>
            addToCart(slug, productId, quantity ?? 1),
        onSuccess: (cart, variables) => {
            syncCart(cart);

            if (!variables.silent) {
                toast.success('Added to cart');
            }
        },
        onError: (error) => toast.error(toApiError(error).message),
    });

    const update = useMutation({
        mutationFn: ({
            productId,
            quantity,
        }: {
            productId: number;
            quantity: number;
        }) => updateCartItem(slug, productId, quantity),
        onSuccess: syncCart,
        onError: (error) => toast.error(toApiError(error).message),
    });

    const remove = useMutation({
        mutationFn: (productId: number) => removeCartItem(slug, productId),
        onSuccess: syncCart,
        onError: (error) => toast.error(toApiError(error).message),
    });

    const clear = useMutation({
        mutationFn: () => clearCart(slug),
        onSuccess: syncCart,
        onError: (error) => toast.error(toApiError(error).message),
    });

    return { add, update, remove, clear };
}
