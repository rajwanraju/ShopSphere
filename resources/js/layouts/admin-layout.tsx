import { BarChart3, Package, ShoppingCart, Tags } from 'lucide-react';
import { PanelShell, type PanelNavItem } from '@/components/shared/panel-shell';
import type { AuthUser } from '@/types/api';

const items: PanelNavItem[] = [
    { to: '/admin', label: 'Dashboard', icon: BarChart3, end: true },
    { to: '/admin/categories', label: 'Categories', icon: Tags, end: true },
    { to: '/admin/products', label: 'Products', icon: Package, end: true },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, end: true },
];

/** Store admin panel: only the owner's own store. */
export default function AdminLayout({ user }: { user: AuthUser }) {
    return (
        <PanelShell
            items={items}
            brand={user.store?.name ?? 'My store'}
            brandHref="/admin"
            user={user}
        />
    );
}
