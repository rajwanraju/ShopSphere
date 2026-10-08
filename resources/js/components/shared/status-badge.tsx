import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<Tone, string> = {
    neutral: 'bg-muted text-muted-foreground',
    success:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    warning:
        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    info: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
};

const statusTones: Record<string, Tone> = {
    // Store / generic
    ACTIVE: 'success',
    INACTIVE: 'danger',
    // Subscription
    PENDING: 'warning',
    EXPIRED: 'neutral',
    CANCELLED: 'neutral',
    // Payment
    APPROVED: 'success',
    REJECTED: 'danger',
    // Order
    PROCESSING: 'info',
    COMPLETED: 'success',
};

/** Consistent colored badge for domain enum statuses. */
export function StatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    const tone = statusTones[status] ?? 'neutral';

    return (
        <Badge
            variant="outline"
            className={cn(toneClasses[tone], 'border-transparent', className)}
        >
            {status}
        </Badge>
    );
}
