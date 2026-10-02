import { useContext } from 'react';
import { AuthContext } from '@/context/authState';
import type { AuthContextValue } from '@/context/authState';

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within <AuthProvider>');
  return value;
}
