import { createContext } from 'react';
import type { UserSession } from '@/types';

export interface AuthContextValue {
  /** null when signed out. */
  session: UserSession | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<UserSession>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
