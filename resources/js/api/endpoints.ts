import type {
    AuthUser,
    Cart,
    Category,
    ManagedStore,
    OnboardingStatus,
    Order,
    Package,
    Paginated,
    PaymentChannel,
    Product,
    SalesReport,
    StoreSubscription,
    StorefrontStore,
    SubscriptionPayment,
} from '@/types/api';
import { api, authApi, prepareCsrf } from './client';

/* -------------------------------------------------------------------------
 | Auth (Fortify session endpoints + /api/user)
 * ------------------------------------------------------------------------ */

export async function login(email: string, password: string): Promise<void> {
    await prepareCsrf();
    await authApi.post('/login', { email, password });
}

export async function logout(): Promise<void> {
    await prepareCsrf();
    await authApi.post('/logout');
}

export async function fetchAuthUser(): Promise<AuthUser> {
    const { data } = await api.get<{ data: AuthUser }>('/user');

    return data.data;
}

export async function requestPasswordReset(email: string): Promise<string> {
    await prepareCsrf();
    const { data } = await authApi.post<{ status?: string }>(
        '/forgot-password',
        { email },
    );

    return data.status ?? 'Reset link sent.';
}

export async function resetPassword(payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}): Promise<string> {
    await prepareCsrf();
    const { data } = await authApi.post<{ status?: string }>(
        '/reset-password',
        payload,
    );

    return data.status ?? 'Password reset.';
}

/* -------------------------------------------------------------------------
 | SaaS landing (public)
 * ------------------------------------------------------------------------ */

export async function fetchPackages(): Promise<Package[]> {
    const { data } = await api.get<{ data: Package[] }>('/landing/packages');

    return data.data;
}

/* -------------------------------------------------------------------------
 | Onboarding
 * ------------------------------------------------------------------------ */

export interface CreateStorePayload {
    package_id: number;
    store_name: string;
    store_description?: string;
    owner_name: string;
    owner_email: string;
    owner_password: string;
    owner_password_confirmation: string;
}

export async function createStore(payload: CreateStorePayload): Promise<void> {
    await prepareCsrf();
    await api.post('/onboarding/stores', payload);
}

export async function fetchOnboardingChannels(): Promise<PaymentChannel[]> {
    const { data } = await api.get<{ data: PaymentChannel[] }>(
        '/onboarding/payment-channels',
    );

    return data.data;
}

export async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
    const { data } = await api.get<{ data: OnboardingStatus }>(
        '/onboarding/status',
    );

    return data.data;
}

export interface SubmitPaymentPayload {
    payment_channel_id: number;
    account_number: string;
    transaction_id: string;
}

export async function submitPayment(
    payload: SubmitPaymentPayload,
): Promise<SubscriptionPayment> {
    const { data } = await api.post<{ data: SubscriptionPayment }>(
        '/onboarding/payments',
        payload,
    );

    return data.data;
}

/* -------------------------------------------------------------------------
 | Storefront (public)
 * ------------------------------------------------------------------------ */

export async function fetchStorefrontStore(
    slug: string,
): Promise<StorefrontStore> {
    const { data } = await api.get<{ data: StorefrontStore }>(
        `/storefront/${slug}`,
    );

    return data.data;
}

export async function fetchStorefrontCategories(
    slug: string,
): Promise<Category[]> {
    const { data } = await api.get<{ data: Category[] }>(
        `/storefront/${slug}/categories`,
    );

    return data.data;
}

export interface ProductQuery {
    category_id?: number | null;
    q?: string;
    page?: number;
}

export async function fetchStorefrontProducts(
    slug: string,
    query: ProductQuery = {},
): Promise<Paginated<Product>> {
    const { data } = await api.get<Paginated<Product>>(
        `/storefront/${slug}/products`,
        { params: query },
    );

    return data;
}

export async function fetchStorefrontProduct(
    slug: string,
    productId: number,
): Promise<Product> {
    const { data } = await api.get<{ data: Product }>(
        `/storefront/${slug}/products/${productId}`,
    );

    return data.data;
}

export async function fetchCart(slug: string): Promise<Cart> {
    const { data } = await api.get<{ data: Cart }>(`/storefront/${slug}/cart`);

    return data.data;
}

export async function addToCart(
    slug: string,
    productId: number,
    quantity = 1,
): Promise<Cart> {
    const { data } = await api.post<{ data: Cart }>(
        `/storefront/${slug}/cart/items`,
        {
            product_id: productId,
            quantity,
        },
    );

    return data.data;
}

export async function updateCartItem(
    slug: string,
    productId: number,
    quantity: number,
): Promise<Cart> {
    const { data } = await api.patch<{ data: Cart }>(
        `/storefront/${slug}/cart/items/${productId}`,
        { quantity },
    );

    return data.data;
}

export async function removeCartItem(
    slug: string,
    productId: number,
): Promise<Cart> {
    const { data } = await api.delete<{ data: Cart }>(
        `/storefront/${slug}/cart/items/${productId}`,
    );

    return data.data;
}

export async function clearCart(slug: string): Promise<Cart> {
    const { data } = await api.delete<{ data: Cart }>(
        `/storefront/${slug}/cart`,
    );

    return data.data;
}

export interface CheckoutPayload {
    customer_name: string;
    customer_email?: string;
    customer_phone: string;
    customer_address: string;
}

export async function checkout(
    slug: string,
    payload: CheckoutPayload,
): Promise<Order> {
    await prepareCsrf();
    const { data } = await api.post<{ data: Order }>(
        `/storefront/${slug}/checkout`,
        payload,
    );

    return data.data;
}

export async function fetchOrderConfirmation(
    slug: string,
    orderNumber: string,
): Promise<Order> {
    const { data } = await api.get<{ data: Order }>(
        `/storefront/${slug}/orders/${orderNumber}`,
    );

    return data.data;
}

/* -------------------------------------------------------------------------
 | Store admin
 * ------------------------------------------------------------------------ */

export async function fetchAdminCategories(): Promise<Category[]> {
    const { data } = await api.get<{ data: Category[] }>('/store/categories');

    return data.data;
}

export interface CategoryPayload {
    title: string;
}

export async function createCategory(
    payload: CategoryPayload,
): Promise<Category> {
    const { data } = await api.post<{ data: Category }>(
        '/store/categories',
        payload,
    );

    return data.data;
}

export async function updateCategory(
    id: number,
    payload: CategoryPayload,
): Promise<Category> {
    const { data } = await api.put<{ data: Category }>(
        `/store/categories/${id}`,
        payload,
    );

    return data.data;
}

export async function deleteCategory(id: number): Promise<void> {
    await api.delete(`/store/categories/${id}`);
}

export interface AdminProductQuery {
    category_id?: number | null;
    q?: string;
    page?: number;
}

export async function fetchAdminProducts(
    query: AdminProductQuery = {},
): Promise<Paginated<Product>> {
    const { data } = await api.get<Paginated<Product>>('/store/products', {
        params: query,
    });

    return data;
}

export async function fetchAdminProduct(id: number): Promise<Product> {
    const { data } = await api.get<{ data: Product }>(`/store/products/${id}`);

    return data.data;
}

export interface ProductPayload {
    title: string;
    description: string;
    price: number;
    category_id: number;
    images?: File[];
    existing_images?: string[];
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
    await prepareCsrf();

    const form = new FormData();
    form.append('title', payload.title);
    form.append('description', payload.description);
    form.append('price', String(payload.price));
    form.append('category_id', String(payload.category_id));

    payload.images?.forEach((image) => form.append('images[]', image));

    const { data } = await api.post<{ data: Product }>(
        '/store/products',
        form,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
        },
    );

    return data.data;
}

export async function updateProduct(
    id: number,
    payload: ProductPayload,
): Promise<Product> {
    await prepareCsrf();

    const form = new FormData();
    form.append('title', payload.title);
    form.append('description', payload.description);
    form.append('price', String(payload.price));
    form.append('category_id', String(payload.category_id));

    (payload.existing_images ?? []).forEach((path) =>
        form.append('existing_images[]', path),
    );
    payload.images?.forEach((image) => form.append('images[]', image));
    form.append('_method', 'PUT');

    const { data } = await api.post<{ data: Product }>(
        '/store/products/' + id,
        form,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
        },
    );

    return data.data;
}

export async function deleteProduct(id: number): Promise<void> {
    await api.delete(`/store/products/${id}`);
}

export interface AdminOrderQuery {
    status?: string;
    page?: number;
}

export async function fetchAdminOrders(
    query: AdminOrderQuery = {},
): Promise<Paginated<Order>> {
    const { data } = await api.get<Paginated<Order>>('/store/orders', {
        params: query,
    });

    return data;
}

export async function fetchAdminOrder(id: number): Promise<Order> {
    const { data } = await api.get<{ data: Order }>(`/store/orders/${id}`);

    return data.data;
}

export async function updateOrderStatus(
    id: number,
    status: string,
): Promise<Order> {
    const { data } = await api.patch<{ data: Order }>(
        `/store/orders/${id}/status`,
        { status },
    );

    return data.data;
}

export async function fetchSalesReport(days: number): Promise<SalesReport> {
    const { data } = await api.get<{ data: SalesReport }>(
        '/store/reports/sales',
        {
            params: { days },
        },
    );

    return data.data;
}

/* -------------------------------------------------------------------------
 | Platform management
 * ------------------------------------------------------------------------ */

export async function fetchManagedPackages(): Promise<Package[]> {
    const { data } = await api.get<{ data: Package[] }>('/management/packages');

    return data.data;
}

export interface PackagePayload {
    name: string;
    description?: string;
    price: number;
    duration_days: number;
    is_active?: boolean;
}

export async function createPackage(payload: PackagePayload): Promise<Package> {
    const { data } = await api.post<{ data: Package }>(
        '/management/packages',
        payload,
    );

    return data.data;
}

export async function updatePackage(
    id: number,
    payload: PackagePayload,
): Promise<Package> {
    const { data } = await api.put<{ data: Package }>(
        `/management/packages/${id}`,
        payload,
    );

    return data.data;
}

export async function togglePackage(id: number): Promise<Package> {
    const { data } = await api.patch<{ data: Package }>(
        `/management/packages/${id}/status`,
    );

    return data.data;
}

export async function deletePackage(id: number): Promise<void> {
    await api.delete(`/management/packages/${id}`);
}

export interface ManagedStoreQuery {
    q?: string;
    page?: number;
}

export async function fetchManagedStores(
    query: ManagedStoreQuery = {},
): Promise<Paginated<ManagedStore>> {
    const { data } = await api.get<Paginated<ManagedStore>>(
        '/management/stores',
        { params: query },
    );

    return data;
}

export async function fetchManagedStore(id: number): Promise<ManagedStore> {
    const { data } = await api.get<{ data: ManagedStore }>(
        `/management/stores/${id}`,
    );

    return data.data;
}

export async function updateStoreStatus(
    id: number,
    status: 'ACTIVE' | 'INACTIVE',
): Promise<ManagedStore> {
    const { data } = await api.patch<{ data: ManagedStore }>(
        `/management/stores/${id}/status`,
        { status },
    );

    return data.data;
}

export async function fetchSubscriptions(
    page = 1,
): Promise<Paginated<StoreSubscription>> {
    const { data } = await api.get<Paginated<StoreSubscription>>(
        '/management/subscriptions',
        { params: { page } },
    );

    return data;
}

export async function fetchSubscription(
    id: number,
): Promise<StoreSubscription> {
    const { data } = await api.get<{ data: StoreSubscription }>(
        `/management/subscriptions/${id}`,
    );

    return data.data;
}

export interface ManagedPayment {
    id: number;
    store_id: number;
    subscription_id: number;
    channel_name: string;
    account_number: string;
    transaction_id: string;
    amount: number;
    status: string;
    rejection_reason: string | null;
    verified_at: string | null;
    created_at: string;
}

export interface PaymentQuery {
    status?: string;
    page?: number;
}

export interface PaginatedPayment {
    data: (ManagedPayment & {
        store?: { id: number; name: string; slug: string };
    } & {
        subscription?: { id: number; package_name: string; status: string };
    })[];
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
}

export async function fetchPayments(
    query: PaymentQuery = {},
): Promise<PaginatedPayment> {
    const { data } = await api.get<PaginatedPayment>('/management/payments', {
        params: query,
    });

    return data;
}

export async function fetchPayment(
    id: number,
): Promise<PaginatedPayment['data'][number]> {
    const { data } = await api.get<{ data: PaginatedPayment['data'][number] }>(
        `/management/payments/${id}`,
    );

    return data.data;
}

export async function approvePayment(id: number): Promise<ManagedPayment> {
    await prepareCsrf();
    const { data } = await api.post<{ data: ManagedPayment }>(
        `/management/payments/${id}/approve`,
    );

    return data.data;
}

export async function rejectPayment(
    id: number,
    rejectionReason: string,
): Promise<ManagedPayment> {
    await prepareCsrf();
    const { data } = await api.post<{ data: ManagedPayment }>(
        `/management/payments/${id}/reject`,
        {
            rejection_reason: rejectionReason,
        },
    );

    return data.data;
}

export async function fetchPaymentChannels(): Promise<PaymentChannel[]> {
    const { data } = await api.get<{ data: PaymentChannel[] }>(
        '/management/payment-channels',
    );

    return data.data;
}

export interface PaymentChannelPayload {
    name: string;
    account_number: string;
    instructions?: string;
    is_active?: boolean;
}

export async function createPaymentChannel(
    payload: PaymentChannelPayload,
): Promise<PaymentChannel> {
    const { data } = await api.post<{ data: PaymentChannel }>(
        '/management/payment-channels',
        payload,
    );

    return data.data;
}

export async function updatePaymentChannel(
    id: number,
    payload: PaymentChannelPayload,
): Promise<PaymentChannel> {
    const { data } = await api.put<{ data: PaymentChannel }>(
        `/management/payment-channels/${id}`,
        payload,
    );

    return data.data;
}

export async function togglePaymentChannel(
    id: number,
): Promise<PaymentChannel> {
    const { data } = await api.patch<{ data: PaymentChannel }>(
        `/management/payment-channels/${id}/status`,
    );

    return data.data;
}

export async function deletePaymentChannel(id: number): Promise<void> {
    await api.delete(`/management/payment-channels/${id}`);
}
