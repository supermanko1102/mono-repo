"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiLogout, apiMe } from "./lib/api";
import type { Me } from "./lib/mentor-slots";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function TopNav() {
  const pathname = usePathname();
  const isMentor = pathname === "/mentor";
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    apiMe().then((res) => {
      if (!res.ok) return;
      setMe(res.data);
    });
  }, []);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            M
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold leading-none tracking-tight">MentorSlots</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">導師預約平台</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/mentor"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isMentor ? "text-primary" : "text-muted-foreground"
            )}
          >
            導師端
          </Link>
          <Link
            href="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              !isMentor ? "text-primary" : "text-muted-foreground"
            )}
          >
            客戶端
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {me ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await apiLogout();
                setMe(null);
                window.location.href = "/";
              }}
            >
              登出（{me.role === "MENTOR" ? "導師" : "vibe coder"}）
            </Button>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/auth">登入/註冊</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
