"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiLogin, apiRegister } from "@/app/lib/api";
import type { UserRole } from "@/app/lib/mentor-slots";

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
    <section className="view" aria-labelledby="auth-title">
      <div className="card">
        <div className="card-head">
          <h1 id="auth-title" className="h1">
            {title}
          </h1>
          <div className="muted">vibe coder / 專業工程師導師</div>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <div className="grid">
            {mode === "register" ? (
              <label className="field">
                <span className="label">身份</span>
                <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                  <option value="VIBE_CODER">vibe coder（用戶）</option>
                  <option value="MENTOR">專業工程師（導師）</option>
                </select>
              </label>
            ) : (
              <div />
            )}
            <label className="field">
              <span className="label">Email</span>
              <input name="email" type="email" maxLength={200} required />
            </label>
            <label className="field">
              <span className="label">密碼</span>
              <input name="password" type="password" minLength={8} maxLength={200} required />
            </label>
            {mode === "register" ? (
              <label className="field">
                <span className="label">顯示名稱</span>
                <input name="displayName" type="text" maxLength={60} required />
              </label>
            ) : (
              <div />
            )}
          </div>

          <div className="actions">
            <button className="btn btn-primary" type="submit">
              {title}
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setStatus("");
                setMode((m) => (m === "login" ? "register" : "login"));
              }}
            >
              切換到{mode === "login" ? "註冊" : "登入"}
            </button>
            <div className="status" role="status" aria-live="polite">
              {status}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
