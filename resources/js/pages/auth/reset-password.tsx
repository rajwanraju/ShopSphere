import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { LoaderCircle } from 'lucide-react';
import AuthLayout from '@/layouts/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { resetPassword } from '@/api/endpoints';
import { toApiError } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

const schema = z
    .object({
        token: z.string().min(1),
        email: z
            .string()
            .min(1, 'Email is required.')
            .email('Enter a valid email address.'),
        password: z.string().min(8, 'Password must be at least 8 characters.'),
        password_confirmation: z
            .string()
            .min(1, 'Please confirm the password.'),
    })
    .refine((values) => values.password === values.password_confirmation, {
        message: 'Passwords do not match.',
        path: ['password_confirmation'],
    });

type Form = z.infer<typeof schema>;

/** Complete a password reset using the link's token. */
export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const setUser = useAuthStore((state) => state.setUser);

    const form = useForm<Form>({
        resolver: zodResolver(schema),
        defaultValues: {
            token: searchParams.get('token') ?? '',
            email: searchParams.get('email') ?? '',
            password: '',
            password_confirmation: '',
        },
    });

    async function onSubmit(values: Form) {
        try {
            const message = await resetPassword(values);
            toast.success(message);
            // The password reset logs the user in on the backend session.
            setUser(null);
            void navigate('/login', { replace: true });
        } catch (error) {
            toast.error(toApiError(error).message);
        }
    }

    return (
        <AuthLayout>
            <h1 className="text-xl font-semibold">Reset password</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
                Choose a new password for your account.
            </p>

            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
            >
                <input type="hidden" {...form.register('token')} />

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        {...form.register('email')}
                    />
                    <InputError
                        message={form.formState.errors.email?.message}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        {...form.register('password')}
                    />
                    <InputError
                        message={form.formState.errors.password?.message}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">
                        Confirm password
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        autoComplete="new-password"
                        {...form.register('password_confirmation')}
                    />
                    <InputError
                        message={
                            form.formState.errors.password_confirmation?.message
                        }
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
                    Reset password
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link
                    to="/login"
                    className="font-medium text-foreground underline"
                >
                    Back to sign in
                </Link>
            </p>
        </AuthLayout>
    );
}
