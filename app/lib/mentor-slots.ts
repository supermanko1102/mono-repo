export type UserRole = "VIBE_CODER" | "MENTOR";

export type Me = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatarPath: string | null;
};

export type MentorSummary = {
  id: string;
  displayName: string;
  bio: string;
  avatarPath: string | null;
};

export type Slot = {
  id: string;
  mentorId: string;
  startAtIso: string;
  endAtIso: string;
  status: "AVAILABLE" | "BOOKED" | "CANCELLED";
  note: string;
};

export type Booking = {
  id: string;
  status: "CONFIRMED" | "CANCELLED";
  slotId: string;
  userId: string;
  mentorId: string;
  note: string;
  uploadPath: string | null;
  createdAtIso: string;
  userDisplayName?: string;
  userEmail?: string;
};

export function toIsoStart(dateStr: string, timeStr: string) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

export function formatSlot(startsAtIso: string) {
  const dt = new Date(startsAtIso);
  const date = new Intl.DateTimeFormat("zh-TW", {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
  const time = new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dt);
  return { date, time };
}

export function sortSlots(slots: Slot[]) {
  return [...slots].sort((a, b) => a.startAtIso.localeCompare(b.startAtIso));
}
