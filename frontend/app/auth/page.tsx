"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiLogin, apiRegister } from "@/app/lib/api";
import type { UserRole } from "@/app/lib/mentor-slots";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export default function Page() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [role, setRole] = useState<UserRole>("VIBE_CODER");
  const [status, setStatus] = useState<string>("");

  const title = useMemo(() => (mode === "login" ? "登入" : "註冊"), [mode]);

  async function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "").trim();
    const displayName = String(fd.get("displayName") ?? "").trim();

    const result =
      mode === "login"
        ? await apiLogin({ email, password })
        : await apiRegister({ email, password, role, displayName });

    if (!result.ok) {
      setStatus(result.error);
      return;
    }

    const next = result.data.role === "MENTOR" ? "/mentor" : "/";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle id="auth-title" className="text-2xl text-center">{title}</CardTitle>
          <CardDescription className="text-center">vibe coder / 專業工程師導師</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label>身份</Label>
                  <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                    <option value="VIBE_CODER">vibe coder（用戶）</option>
                    <option value="MENTOR">專業工程師（導師）</option>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" maxLength={200} required />
              </div>
              <div className="space-y-2">
                <Label>密碼</Label>
                <Input name="password" type="password" minLength={8} maxLength={200} required />
              </div>
              {mode === "register" && (
                <div className="space-y-2">
                  <Label>顯示名稱</Label>
                  <Input name="displayName" type="text" maxLength={60} required />
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <Button className="w-full" type="submit">
                {title}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={() => {
                  setStatus("");
                  setMode((m) => (m === "login" ? "register" : "login"));
                }}
              >
                切換到{mode === "login" ? "註冊" : "登入"}
              </Button>
              
              <div className="text-sm text-center font-medium text-destructive min-h-[20px]" role="status" aria-live="polite">
                {status}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
