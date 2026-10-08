import { create } from 'zustand';
import {
    fetchAuthUser,
    login as loginRequest,
    logout as logoutRequest,
} from '@/api/endpoints';
import type { AuthUser } from '@/types/api';

type AuthStatus = 'idle' | 'loading' | 'ready';

interface AuthState {
    user: AuthUser | null;
    status: AuthStatus;
    pending: Promise<AuthUser | null> | null;
    setUser: (user: AuthUser | null) => void;
    /** Resolve the session user exactly once per page load. */
    ensureLoaded: () => Promise<AuthUser | null>;
    login: (email: string, password: string) => Promise<AuthUser>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    status: 'idle',
    pending: null,

    setUser: (user) => {
        set({ user, status: 'ready', pending: null });
    },

    ensureLoaded: () => {
        const { status, pending, user } = get();

        if (status === 'ready') {
            return Promise.resolve(user);
        }

        if (pending) {
            return pending;
        }

        const promise = fetchAuthUser()
            .then((loaded) => {
                set({ user: loaded, status: 'ready', pending: null });

                return loaded;
            })
            .catch(() => {
                set({ user: null, status: 'ready', pending: null });

                return null;
            });

        set({ pending: promise, status: 'loading' });

        return promise;
    },

    login: async (email, password) => {
        await loginRequest(email, password);

        const user = await fetchAuthUser();

        set({ user, status: 'ready', pending: null });

        return user;
    },

    logout: async () => {
        await logoutRequest();

        set({ user: null, status: 'ready', pending: null });
    },
}));

/** Where a user lands after signing in. */
export function authHomePath(user: AuthUser): string {
    if (user.role === 'management') {
        return '/management';
    }

    return user.store?.is_operational ? '/admin' : '/onboarding/status';
}
