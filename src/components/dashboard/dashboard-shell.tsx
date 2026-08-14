"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  MessageSquareText,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/pricing", label: "Pricing", icon: CircleDollarSign },
  { href: "/dashboard/reviews", label: "Reviews", icon: BarChart3 },
  { href: "/dashboard/faq", label: "FAQ", icon: MessageSquareText },
];

const sectionMeta: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Overview",
    description: "Manage account and security settings.",
  },
  "/dashboard/pricing": {
    title: "Pricing",
    description: "Create, edit, and remove subscription plans.",
  },
  "/dashboard/reviews": {
    title: "Reviews",
    description: "Moderate testimonials and control homepage highlights.",
  },
  "/dashboard/faq": {
    title: "FAQ",
    description: "Organize categories and rich-text FAQ items.",
  },
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const section = sectionMeta[pathname] ?? {
    title: "Dashboard",
    description: "Manage Safetly content and admin settings.",
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(126,58,237,0.12),_transparent_28%),linear-gradient(to_bottom,_rgba(255,255,255,1),_rgba(250,250,250,1))]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 border-r bg-background/95 p-4 backdrop-blur transition-transform md:static md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                Safetly Admin
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Content management
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close navigation menu</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <nav aria-label="Dashboard navigation" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="md:hidden"
                  onClick={() => setSidebarOpen((value) => !value)}
                >
                  <span className="sr-only">Open navigation menu</span>
                  <Menu className="size-4" />
                </Button>
                <div>
                  <h1 className="text-base font-semibold md:text-lg">{section.title}</h1>
                  <p className="text-xs text-muted-foreground md:text-sm">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <SignOutButton />
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
