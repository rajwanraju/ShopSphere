import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Fallback for unknown routes. */
export default function NotFoundPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
            <Compass className="size-10 text-muted-foreground" />
            <div>
                <h1 className="text-lg font-semibold">Page not found</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    The page you are looking for does not exist.
                </p>
            </div>
            <Button asChild variant="outline">
                <Link to="/">Go home</Link>
            </Button>
        </div>
    );
}
