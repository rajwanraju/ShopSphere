import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

/** Centered spinner used while routes/queries resolve. */
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
    return (
        <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
            <Spinner />
            <span className="text-sm">{label}</span>
        </div>
    );
}

/** Destructive alert for failed queries or mutations. */
export function ErrorAlert({ message }: { message: string }) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    );
}

/** Placeholder for empty lists. */
export function EmptyState({
    title,
    description,
    icon,
    className,
}: {
    title: string;
    description?: string;
    icon?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-14 text-center',
                className,
            )}
        >
            <div className="text-muted-foreground">
                {icon ?? <Inbox className="size-8" />}
            </div>
            <p className="text-sm font-medium">{title}</p>
            {description && (
                <p className="max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    );
}

/** Row of skeletons approximating a card grid. */
export function GridSkeleton({
    count = 8,
    className,
}: {
    count?: number;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4',
                className,
            )}
        >
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="space-y-2">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ))}
        </div>
    );
}
