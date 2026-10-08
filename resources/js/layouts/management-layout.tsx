import {
    Building2,
    CreditCard,
    Layers,
    ReceiptText,
    Wallet,
} from 'lucide-react';
import { PanelShell, type PanelNavItem } from '@/components/shared/panel-shell';
import type { AuthUser } from '@/types/api';

const items: PanelNavItem[] = [
    { to: '/management/packages', label: 'Packages', icon: Layers, end: true },
    { to: '/management/stores', label: 'Stores', icon: Building2, end: true },
    {
        to: '/management/subscriptions',
        label: 'Subscriptions',
        icon: CreditCard,
        end: true,
    },
    {
        to: '/management/payments',
        label: 'Payments',
        icon: ReceiptText,
        end: true,
    },
    {
        to: '/management/payment-channels',
        label: 'Payment channels',
        icon: Wallet,
        end: true,
    },
];

/** SaaS management panel shell. */
export default function ManagementLayout({ user }: { user: AuthUser }) {
    return (
        <PanelShell
            items={items}
            brand="ShopSphere"
            brandHref="/management/packages"
            user={user}
        />
    );
}
