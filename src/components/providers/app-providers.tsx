'use client';

import { PropsWithChildren } from 'react';
import { AuthUserProvider } from '@/lib/auth/auth-user-context';

export function AppProviders({ children }: PropsWithChildren) {
  return <AuthUserProvider>{children}</AuthUserProvider>;
}
