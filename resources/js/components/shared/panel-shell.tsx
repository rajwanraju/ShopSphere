import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useQueryClient } from '@tanstack/react-query';
import { logout as logoutRequest } from '@/api/endpoints';
import { useAuthStore } from '@/stores/auth';
import type { AuthUser } from '@/types/api';
import { cn } from '@/lib/utils';

export interface PanelNavItem {
    to: string;
    label: string;
    icon: typeof Store;
    end?: boolean;
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0] ?? '')
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function NavLinks({
    items,
    onNavigate,
}: {
    items: PanelNavItem[];
    onNavigate?: () => void;
}) {
    return (
        <nav className="flex flex-col gap-1">
            {items.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        cn(
                            'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )
                    }
                >
                    <item.icon className="size-4" />
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );
}

/**
 * Sidebar shell shared by the store admin and management panels.
 * Renders a fixed sidebar on desktop and a sheet menu on mobile.
 */
export function PanelShell({
    items,
    brand,
    brandHref,
    user,
}: {
    items: PanelNavItem[];
    brand: string;
    brandHref: string;
    user: AuthUser;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    async function handleLogout() {
        try {
            await logoutRequest();
        } catch {
            toast.error('Could not sign out. Please try again.');
            return;
        }

        useAuthStore.getState().setUser(null);
        queryClient.clear();
        void navigate('/login', { replace: true });
    }

    return (
        <div className="flex min-h-svh">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r bg-muted/30 p-4 lg:flex">
                <Link
                    to={brandHref}
                    className="mb-6 flex items-center gap-2 px-2"
                >
                    <Store className="size-5" />
                    <span className="truncate font-semibold">{brand}</span>
                </Link>
                <NavLinks items={items} />
                <div className="mt-auto text-xs text-muted-foreground">
                    Signed in as {user.email}
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
                {/* Top bar */}
                <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background px-4">
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                aria-label="Open menu"
                            >
                                <Menu className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-4">
                            <SheetTitle className="mb-4 flex items-center gap-2">
                                <Store className="size-5" />
                                {brand}
                            </SheetTitle>
                            <NavLinks
                                items={items}
                                onNavigate={() => setMobileOpen(false)}
                            />
                        </SheetContent>
                    </Sheet>

                    <div className="flex-1" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="gap-2 px-2">
                                <Avatar className="size-7">
                                    <AvatarFallback className="text-xs">
                                        {initials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden max-w-40 truncate text-sm sm:inline">
                                    {user.name}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <p className="truncate">{user.name}</p>
                                <p className="text-xs font-normal text-muted-foreground">
                                    {user.email}
                                </p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={handleLogout}
                            >
                                <LogOut className="size-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                <main className="flex-1 p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
