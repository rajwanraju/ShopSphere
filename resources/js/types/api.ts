export type UserRole = 'management' | 'store_owner';

export type StoreStatus = 'ACTIVE' | 'INACTIVE';

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export interface Paginated<T> {
    data: T[];
    links?: unknown;
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    store: {
        id: number;
        name: string;
        slug: string;
        status: StoreStatus;
        is_operational: boolean;
        subscription: {
            status: SubscriptionStatus;
            package_name: string;
            package_price: number;
            ends_at: string | null;
        } | null;
    } | null;
}

export interface Package {
    id: number;
    name: string;
    description: string | null;
    price: number;
    duration_days: number;
    is_active: boolean;
    created_at?: string;
}

export interface PaymentChannel {
    id: number;
    name: string;
    account_number: string;
    instructions: string | null;
    is_active: boolean;
}

export interface SubscriptionPayment {
    id: number;
    store_id: number;
    subscription_id: number;
    channel_name: string;
    account_number: string;
    transaction_id: string;
    amount: number;
    status: PaymentStatus;
    rejection_reason: string | null;
    verified_at: string | null;
    created_at: string;
}

export interface StoreSubscription {
    id: number;
    store_id: number;
    package_id: number | null;
    package_name: string;
    package_price: number;
    package_duration_days: number;
    status: SubscriptionStatus;
    starts_at: string | null;
    ends_at: string | null;
    payments?: SubscriptionPayment[];
    store?: { id: number; name: string; slug: string; status: StoreStatus };
}

export interface StoreOwner {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    store_id: number | null;
}

export interface ManagedStore {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    status: StoreStatus;
    is_operational: boolean;
    subscription: StoreSubscription | null;
    owners?: StoreOwner[];
    categories_count?: number;
    products_count?: number;
    orders_count?: number;
    created_at?: string;
}

export interface OnboardingStatus {
    store: {
        id: number;
        name: string;
        slug: string;
        status: StoreStatus;
    };
    subscription: {
        id: number;
        package_name: string;
        package_price: number;
        package_duration_days: number;
        status: SubscriptionStatus;
        ends_at: string | null;
    };
    payments: SubscriptionPayment[];
}

export interface Category {
    id: number;
    store_id: number;
    title: string;
    products_count?: number;
}

export interface Product {
    id: number;
    store_id: number;
    title: string;
    description: string;
    price: number;
    images: string[];
    category?: { id: number; title: string } | null;
    category_id: number;
    created_at?: string;
}

export interface OrderItem {
    id: number;
    product_id: number | null;
    product_title: string;
    product_price: number;
    quantity: number;
    subtotal: number;
}

export interface Order {
    id: number;
    store_id: number;
    order_number: string;
    status: OrderStatus;
    customer: {
        name: string;
        email: string | null;
        phone: string;
        address: string;
    };
    subtotal: number;
    total: number;
    items?: OrderItem[];
    created_at: string;
}

export interface CartItem {
    product_id: number;
    title: string;
    price: number;
    quantity: number;
    line_total: number;
    image: string | null;
}

export interface Cart {
    items: CartItem[];
    subtotal: number;
    count: number;
}

export interface StorefrontStore {
    id: number;
    name: string;
    slug: string;
    description: string | null;
}

export interface SalesReport {
    period_days: number;
    orders_count: number;
    revenue: number;
    daily: { date: string; orders_count: number; revenue: number }[];
    top_products: {
        product_title: string;
        quantity_sold: number;
        revenue: number;
    }[];
}
