import type { ReactNode } from 'react';
import { useLogin, useLogout, useSessionQuery } from '@/api/auth';
import { AuthContext } from '@/context/authState';
import type { AuthContextValue } from '@/context/authState';

/** Exposes the session (owned by TanStack Query) to the component tree. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionQuery = useSessionQuery();
  const login = useLogin();
  const logout = useLogout();

  const value: AuthContextValue = {
    session: sessionQuery.data ?? null,
    isLoading: sessionQuery.isPending,
    signIn: (email) => login.mutateAsync(email),
    signOut: () => logout.mutate(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
