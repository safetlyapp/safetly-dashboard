"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthUser } from "@/lib/auth/auth-user-context";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const { clearUser } = useAuthUser();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        return;
      }
      clearUser();
      router.replace("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={signOut}
      disabled={pending}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
