/**
 * Centralized React Query cache keys.
 */
export const queryKeys = {
    packages: ['packages'] as const,

    onboardingStatus: ['onboarding', 'status'] as const,
    onboardingChannels: ['onboarding', 'channels'] as const,

    storefrontStore: (slug: string) => ['storefront', slug, 'store'] as const,
    storefrontCategories: (slug: string) =>
        ['storefront', slug, 'categories'] as const,
    storefrontProducts: (slug: string, query: unknown) =>
        ['storefront', slug, 'products', query] as const,
    storefrontProduct: (slug: string, id: number) =>
        ['storefront', slug, 'product', id] as const,
    storefrontOrder: (slug: string, orderNumber: string) =>
        ['storefront', slug, 'order', orderNumber] as const,
    cart: (slug: string) => ['storefront', slug, 'cart'] as const,

    adminCategories: ['admin', 'categories'] as const,
    adminProducts: (query: unknown) => ['admin', 'products', query] as const,
    adminProduct: (id: number) => ['admin', 'product', id] as const,
    adminOrders: (query: unknown) => ['admin', 'orders', query] as const,
    adminOrder: (id: number) => ['admin', 'order', id] as const,
    salesReport: (days: number) => ['admin', 'sales-report', days] as const,

    managedPackages: ['management', 'packages'] as const,
    managedStores: (query: unknown) => ['management', 'stores', query] as const,
    managedStore: (id: number) => ['management', 'store', id] as const,
    subscriptions: ['management', 'subscriptions'] as const,
    subscription: (id: number) => ['management', 'subscription', id] as const,
    payments: (query: unknown) => ['management', 'payments', query] as const,
    payment: (id: number) => ['management', 'payment', id] as const,
    paymentChannels: ['management', 'payment-channels'] as const,
};
