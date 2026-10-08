import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';

/** Centered layout for authentication screens. */
export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-4">
            <Link
                to="/"
                className="mb-6 flex items-center gap-2 text-lg font-semibold"
            >
                <Store className="size-6" />
                ShopSphere
            </Link>
            <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
                {children}
            </div>
        </div>
    );
}
