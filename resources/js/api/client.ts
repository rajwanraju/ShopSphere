import axios, { AxiosError } from 'axios';

/**
 * SPA API client. Session-cookie based (Sanctum stateful SPA mode);
 * the XSRF token is attached automatically from the cookie.
 */
export const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

/** Auth endpoints live outside /api (Fortify session endpoints). */
export const authApi = axios.create({
    baseURL: '',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

/** Fetch the CSRF cookie before any state-changing auth request. */
export async function prepareCsrf(): Promise<void> {
    if (!document.cookie.includes('XSRF-TOKEN')) {
        await authApi.get('/sanctum/csrf-cookie');
    }
}

export interface ApiError {
    status: number;
    message: string;
    errors: Record<string, string[]>;
}

export function toApiError(error: unknown): ApiError {
    if (error instanceof AxiosError) {
        const status = error.response?.status ?? 0;
        const data = error.response?.data as
            | { message?: string; errors?: Record<string, string[]> }
            | undefined;

        return {
            status,
            message: data?.message ?? error.message ?? 'Request failed.',
            errors: data?.errors ?? {},
        };
    }

    return {
        status: 0,
        message: error instanceof Error ? error.message : 'Unexpected error.',
        errors: {},
    };
}
