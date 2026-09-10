import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Admin sign in',
  description: 'Secure administrator authentication',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-background">
      <section className="relative hidden overflow-hidden bg-primary px-12 py-10 text-primary-foreground lg:flex lg:w-[46%] lg:flex-col lg:justify-between xl:px-20">
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground text-primary shadow-lg">
            <span className="font-serif text-xl font-bold">A</span>
          </div>
          <span className="text-sm font-semibold tracking-[0.22em] uppercase">
            Aurelia
          </span>
        </div>
        <div className="relative z-10 max-w-md pb-10">
          <p className="mb-5 font-mono text-xs tracking-[0.24em] text-primary-foreground/60 uppercase">
            Operations portal
          </p>
          <h1 className="text-balance font-serif text-5xl leading-[1.08] tracking-tight xl:text-6xl">
            Clarity for every important decision.
          </h1>
          <p className="mt-6 max-w-sm text-pretty text-sm leading-6 text-primary-foreground/70">
            A focused workspace for keeping your team, customers, and business
            moving forward.
          </p>
        </div>
        <p className="relative z-10 text-xs text-primary-foreground/50">
          © 2026 Aurelia Systems
        </p>
        <div
          aria-hidden="true"
          className="absolute -right-28 top-1/2 size-80 -translate-y-1/2 rounded-full border border-primary-foreground/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-12 top-1/2 size-48 -translate-y-1/2 rounded-full border border-primary-foreground/10"
        />
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-97.5">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="font-serif text-lg font-bold">A</span>
            </div>
            <span className="text-sm font-semibold tracking-[0.22em] uppercase">
              Aurelia
            </span>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
