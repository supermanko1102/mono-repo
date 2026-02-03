"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiLogout, apiMe } from "./lib/api";
import type { Me } from "./lib/mentor-slots";

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
    <header className="shell header">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true" />
        <div>
          <div className="brand-name">MentorSlots</div>
          <div className="brand-sub">導師填寫可預約時段；客戶下單預約</div>
        </div>
      </div>

      <nav className="seg" aria-label="切換端">
        <Link className="seg-link" href="/mentor" aria-current={isMentor ? "page" : undefined}>
          導師端
        </Link>
        <Link className="seg-link" href="/" aria-current={!isMentor ? "page" : undefined}>
          客戶端
        </Link>
      </nav>

      <nav className="seg" aria-label="帳號">
        {me ? (
          <button
            type="button"
            className="seg-link"
            onClick={async () => {
              await apiLogout();
              setMe(null);
              window.location.href = "/";
            }}
          >
            登出（{me.role === "MENTOR" ? "導師" : "vibe coder"}）
          </button>
        ) : (
          <Link className="seg-link" href="/auth" aria-current={pathname === "/auth" ? "page" : undefined}>
            登入/註冊
          </Link>
        )}
      </nav>
    </header>
  );
}
