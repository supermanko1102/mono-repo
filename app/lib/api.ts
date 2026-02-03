import type { Booking, Me, MentorSummary, Slot } from "./mentor-slots";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };
type ApiResult<T> = Ok<T> | Err;

async function json<T>(input: RequestInfo | URL, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "content-type": "application/json",
    },
  });

  const body: unknown = await res.json().catch(() => null);
  if (body && typeof body === "object" && "ok" in body) {
    return body as ApiResult<T>;
  }
  return { ok: false, error: "Unexpected response" };
}

export async function apiMe() {
  return json<Me | null>("/api/me", { method: "GET" });
}

export async function apiRegister(input: {
  email: string;
  password: string;
  role: "VIBE_CODER" | "MENTOR";
  displayName: string;
}) {
  return json<Me>("/api/auth/register", { method: "POST", body: JSON.stringify(input) });
}

export async function apiLogin(input: { email: string; password: string }) {
  return json<Me>("/api/auth/login", { method: "POST", body: JSON.stringify(input) });
}

export async function apiLogout() {
  return json<true>("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
}

export async function apiMentors() {
  return json<MentorSummary[]>("/api/mentors", { method: "GET" });
}

export async function apiMentor(mentorId: string) {
  return json<{ mentor: MentorSummary; slots: Slot[] }>(`/api/mentors/${mentorId}`, { method: "GET" });
}

export async function apiMentorSlots() {
  return json<Slot[]>("/api/mentor/slots", { method: "GET" });
}

export async function apiMentorCreateSlot(input: {
  date: string;
  time: string;
  durationMins: number;
  note: string;
}) {
  return json<Slot>("/api/mentor/slots", { method: "POST", body: JSON.stringify(input) });
}

export async function apiMentorBookings() {
  return json<Booking[]>("/api/mentor/bookings", { method: "GET" });
}

export async function apiCreateBooking(input: { slotId: string; note: string; uploadId?: string }) {
  return json<Booking>("/api/bookings", { method: "POST", body: JSON.stringify(input) });
}

export async function apiUpload(file: File) {
  const fd = new FormData();
  fd.set("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  const body: unknown = await res.json().catch(() => null);
  return body as ApiResult<{ uploadId: string; path: string }>;
}
