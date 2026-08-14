"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
};

type AuthUserContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
};

const CACHE_TTL_MS = 60_000;

let cachedUser: AuthUser | null = null;
let cachedAt = 0;
let inFlightRequest: Promise<AuthUser | null> | null = null;

async function fetchMe(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load authenticated user.");
  }

  const payload = (await response.json()) as { user?: AuthUser };
  if (!payload.user) {
    throw new Error("Invalid user payload.");
  }

  return payload.user;
}

async function getUserWithCache(forceRefresh: boolean): Promise<AuthUser | null> {
  const now = Date.now();
  const hasFreshCache = !forceRefresh && now - cachedAt < CACHE_TTL_MS;

  if (hasFreshCache) {
    return cachedUser;
  }

  if (!inFlightRequest) {
    inFlightRequest = fetchMe()
      .then((user) => {
        cachedUser = user;
        cachedAt = Date.now();
        return user;
      })
      .finally(() => {
        inFlightRequest = null;
      });
  }

  return inFlightRequest;
}

function resetCache() {
  cachedUser = null;
  cachedAt = 0;
  inFlightRequest = null;
}

const AuthUserContext = createContext<AuthUserContextValue | null>(null);

export function AuthUserProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(cachedAt === 0);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(
    async (forceRefresh: boolean, options?: { skipLoadingState?: boolean }) => {
      const skipLoadingState = options?.skipLoadingState ?? false;
      if (!skipLoadingState) {
        setIsLoading(true);
        setError(null);
      }

    try {
      const result = await getUserWithCache(forceRefresh);
      setUser(result);
    } catch {
      setError("Could not load user information.");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
    },
    [],
  );

  useEffect(() => {
    if (cachedAt !== 0) return;
    const timeoutId = window.setTimeout(() => {
      void loadUser(false, { skipLoadingState: true });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadUser]);

  const refreshUser = useCallback(async () => {
    await loadUser(true);
  }, [loadUser]);

  const clearUser = useCallback(() => {
    resetCache();
    setUser(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthUserContextValue>(
    () => ({
      user,
      isLoading,
      error,
      refreshUser,
      clearUser,
    }),
    [user, isLoading, error, refreshUser, clearUser],
  );

  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser() {
  const context = useContext(AuthUserContext);
  if (!context) {
    throw new Error("useAuthUser must be used within AuthUserProvider");
  }
  return context;
}
