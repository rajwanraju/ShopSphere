import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { LoaderCircle } from 'lucide-react';
import AuthLayout from '@/layouts/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { toApiError } from '@/api/client';
import { requestPasswordReset } from '@/api/endpoints';

const schema = z.object({
    email: z
        .string()
        .min(1, 'Email is required.')
        .email('Enter a valid email address.'),
});

type Form = z.infer<typeof schema>;

/** Request a password reset link. */
export default function ForgotPasswordPage() {
    const [status, setStatus] = useState<string | null>(null);

    const form = useForm<Form>({
        resolver: zodResolver(schema),
        defaultValues: { email: '' },
    });

    async function onSubmit(values: Form) {
        try {
            const message = await requestPasswordReset(values.email);
            setStatus(message);
        } catch (error) {
            toast.error(toApiError(error).message);
        }
    }

    return (
        <AuthLayout>
            <h1 className="text-xl font-semibold">Forgot password</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
                Enter your email and we will send you a reset link.
            </p>

            {status ? (
                <div className="space-y-4">
                    <p className="rounded-md bg-muted p-3 text-sm">{status}</p>
                    <Button asChild variant="outline" className="w-full">
                        <Link to="/login">Back to sign in</Link>
                    </Button>
                </div>
            ) : (
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                    noValidate
                >
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

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting && (
                            <LoaderCircle className="size-4 animate-spin" />
                        )}
                        Send reset link
                    </Button>
                </form>
            )}

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
