"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { readApiError } from "@/lib/api/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Sign-in failed."));
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="mb-9">
        <p className="mb-3 font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Welcome back</p>
        <h2 className="font-serif text-4xl tracking-tight text-foreground">Admin sign in</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Enter your credentials to access the Aurelia workspace.</p>
      </div>
      <form
        action="/api/auth/login"
        method="post"
        onSubmit={onSubmit}
        className="space-y-6"
      >
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">Email address</label>
          <input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} placeholder="you@company.com" className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-60" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <button type="button" className="text-xs font-medium text-muted-foreground transition hover:text-foreground">Forgot password?</button>
          </div>
          <div className="relative">
            <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending} placeholder="Enter your password" className="flex h-12 w-full rounded-lg border border-input bg-background px-4 pr-12 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-60" />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} disabled={pending} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60">
              {showPassword ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l18 18" /><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" /><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.7 4 10 8a13.7 13.7 0 0 1-3.1 5.1M6.2 6.2C4.5 7.4 3.3 9.2 2 12c1.3 4 5 8 10 8 1.4 0 2.7-.3 3.8-.8" /></svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></svg>
              )}
            </button>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        <Button type="submit" className="h-12 w-full rounded-lg text-sm" disabled={pending}>{pending ? "Signing in…" : "Sign in to workspace"}</Button>
      </form>
      <p className="mt-9 text-center text-xs leading-5 text-muted-foreground">Protected access for authorized administrators only.</p>
    </div>
  );
}
