import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/shared/feedback';
import { fetchPackages } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { formatMoney } from '@/lib/utils';
import type { Package as PackagePlan } from '@/types/api';

/** Public SaaS landing page: package selection for new merchants. */
export default function LandingPage() {
    const navigate = useNavigate();

    const {
        data: packages,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: queryKeys.packages,
        queryFn: fetchPackages,
        staleTime: 5 * 60_000,
    });

    return (
        <div className="flex min-h-svh flex-col">
            <header className="border-b">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                    <Link
                        to="/"
                        className="flex items-center gap-2 font-semibold"
                    >
                        <Store className="size-5" />
                        ShopSphere
                    </Link>
                    <Button asChild variant="outline" size="sm">
                        <Link to="/login">Sign in</Link>
                    </Button>
                </div>
            </header>

            <main className="flex-1">
                <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        Launch your own online store
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Pick a package, create your store and start selling in
                        minutes. Pay manually, get verified and go live.
                    </p>
                    <Button
                        size="lg"
                        className="mt-8"
                        onClick={() => void navigate('/register')}
                    >
                        Create your store
                    </Button>
                </section>

                <section className="mx-auto max-w-5xl px-4 pb-20">
                    <h2 className="mb-6 text-center text-2xl font-semibold">
                        Available packages
                    </h2>

                    {isError && <ErrorAlert message={error.message} />}

                    {isPending ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[0, 1, 2].map((index) => (
                                <Skeleton
                                    key={index}
                                    className="h-64 rounded-lg"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {(packages ?? []).map((plan) => (
                                <PackageCard
                                    key={plan.id}
                                    plan={plan}
                                    onSelect={() =>
                                        void navigate(
                                            `/register?package=${plan.id}`,
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <footer className="border-t py-6 text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} ShopSphere. All rights reserved.
            </footer>
        </div>
    );
}

function PackageCard({
    plan,
    onSelect,
}: {
    plan: PackagePlan;
    onSelect: () => void;
}) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                    {plan.description ?? 'Everything you need to sell online.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-3xl font-bold">
                    {formatMoney(plan.price)}
                    <span className="text-sm font-normal text-muted-foreground">
                        {' '}
                        / {plan.duration_days} days
                    </span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                        <Check className="size-4 text-emerald-600" />
                        {plan.duration_days}-day subscription
                    </li>
                    <li className="flex items-center gap-2">
                        <Check className="size-4 text-emerald-600" />
                        Storefront with cart &amp; checkout
                    </li>
                    <li className="flex items-center gap-2">
                        <Check className="size-4 text-emerald-600" />
                        Admin panel with reports
                    </li>
                </ul>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={onSelect}>
                    Choose {plan.name}
                </Button>
            </CardFooter>
        </Card>
    );
}
