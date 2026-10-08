import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { LoaderCircle } from 'lucide-react';
import AuthLayout from '@/layouts/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { toApiError } from '@/api/client';
import { authHomePath, useAuthStore } from '@/stores/auth';

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required.')
        .email('Enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
});

type LoginForm = z.infer<typeof loginSchema>;

/** Store owner and management sign-in. */
export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const login = useAuthStore((state) => state.login);
    const [formError, setFormError] = useState<string | null>(null);

    const form = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const redirectTo =
        location.state &&
        typeof location.state === 'object' &&
        'from' in location.state
            ? String(location.state.from)
            : null;

    async function onSubmit(values: LoginForm) {
        setFormError(null);

        try {
            const user = await login(values.email, values.password);

            toast.success(`Welcome back, ${user.name}!`);
            void navigate(redirectTo ?? authHomePath(user), { replace: true });
        } catch (error) {
            setFormError(toApiError(error).message);
        }
    }

    return (
        <AuthLayout>
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
                Access your store panel or the platform management area.
            </p>

            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
            >
                {formError && <InputError message={formError} />}

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        {...form.register('email')}
                    />
                    <InputError
                        message={form.formState.errors.email?.message}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                            to="/forgot-password"
                            className="text-xs text-muted-foreground hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        {...form.register('password')}
                    />
                    <InputError
                        message={form.formState.errors.password?.message}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                >
                    {form.formState.isSubmitting && (
                        <LoaderCircle className="size-4 animate-spin" />
                    )}
                    Sign in
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have a store?{' '}
                <Link
                    to="/register"
                    className="font-medium text-foreground underline"
                >
                    Create one
                </Link>
            </p>
        </AuthLayout>
    );
}
