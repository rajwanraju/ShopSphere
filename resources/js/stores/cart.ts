import { create } from 'zustand';
import { fetchCart } from '@/api/endpoints';

interface CartState {
    /** Cart item count per store slug. */
    counts: Record<string, number>;
    setCount: (slug: string, count: number) => void;
    refresh: (slug: string) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
    counts: {},

    setCount: (slug, count) => {
        set((state) => ({ counts: { ...state.counts, [slug]: count } }));
    },

    refresh: async (slug) => {
        try {
            const cart = await fetchCart(slug);

            get().setCount(slug, cart.count);
        } catch {
            get().setCount(slug, 0);
        }
    },
}));
