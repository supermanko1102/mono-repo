"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  apiMe,
  apiMentorBookings,
  apiMentorCreateSlot,
  apiMentorSlots,
} from "@/app/lib/api";
import type { Booking, Me, Slot } from "@/app/lib/mentor-slots";
import { formatSlot, sortSlots } from "@/app/lib/mentor-slots";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [me, setMe] = useState<Me | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    apiMe().then((res) => {
      if (!res.ok) return;
      setMe(res.data);
    });
  }, []);

  useEffect(() => {
    if (!me || me.role !== "MENTOR") return;
    apiMentorSlots().then((res) => {
      if (res.ok) setSlots(res.data);
    });
    apiMentorBookings().then((res) => {
      if (res.ok) setBookings(res.data);
    });
  }, [me]);

  const sortedSlots = useMemo(() => sortSlots(slots), [slots]);

  const onAddSlot = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("");
    if (!me) {
      setStatus("請先登入/註冊。");
      return;
    }
    if (me.role !== "MENTOR") {
      setStatus("此頁僅提供導師使用。");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const date = String(fd.get("date") ?? "").trim();
    const time = String(fd.get("time") ?? "").trim();
    const durationMins = Number(String(fd.get("duration") ?? "60").trim());
    const note = String(fd.get("note") ?? "").trim();

    const res = await apiMentorCreateSlot({ date, time, durationMins, note });
    if (!res.ok) {
      setStatus(res.error);
      return;
    }

    setSlots((s) => [...s, res.data]);
    e.currentTarget.reset();
    const durationInput = e.currentTarget.elements.namedItem("duration");
    if (durationInput instanceof HTMLInputElement) durationInput.value = "60";
  };

  return (
    <div className="view space-y-8" aria-labelledby="mentor-title">
      <Card>
        <CardHeader>
          <CardTitle id="mentor-title">新增可預約時間</CardTitle>
          <CardDescription>時段會出現在客戶端清單中</CardDescription>
        </CardHeader>
        <CardContent>
          {!me ? (
            <div className="mb-6 p-4 rounded-md border bg-muted/20 text-center">
              <p className="text-sm font-medium mb-2">請先登入/註冊（導師）</p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/auth">前往登入/註冊</Link>
              </Button>
            </div>
          ) : me.role !== "MENTOR" ? (
            <div className="mb-6 p-4 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-center">
              <p className="font-medium">此頁僅提供導師使用</p>
              <p className="text-sm">請使用導師身份登入</p>
            </div>
          ) : null}

          <form className="space-y-6" autoComplete="off" onSubmit={onAddSlot}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label>日期</Label>
                <Input name="date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label>開始時間</Label>
                <Input name="time" type="time" required />
              </div>
              <div className="space-y-2">
                <Label>時長 (分鐘)</Label>
                <Input
                  name="duration"
                  type="number"
                  inputMode="numeric"
                  min={15}
                  step={15}
                  defaultValue={60}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>備註 (選填)</Label>
                <Input name="note" type="text" maxLength={80} placeholder="例如：一對一諮詢" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button type="submit">新增時段</Button>
              <div className="text-sm font-medium text-muted-foreground" role="status" aria-live="polite">
                {status}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card aria-labelledby="slots-title">
          <CardHeader>
            <CardTitle id="slots-title" className="text-lg">已建立時段</CardTitle>
            <CardDescription>{sortedSlots.length} 個時段</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {sortedSlots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  尚無可預約時段，新增後會顯示在客戶端
                </div>
              ) : (
                sortedSlots.map((slot) => {
                  const { date, time } = formatSlot(slot.startAtIso);
                  return (
                    <div key={slot.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-accent/5 transition-colors">
                      <div>
                        <div className="font-semibold">{date} {time}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className={slot.status === 'AVAILABLE' ? 'text-primary' : 'text-muted-foreground'}>
                            {slot.status}
                          </span>
                          {slot.note && `｜${slot.note}`}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card aria-labelledby="orders-title">
          <CardHeader>
            <CardTitle id="orders-title" className="text-lg">客戶訂單</CardTitle>
            <CardDescription>{bookings.length} 筆訂單</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  尚無訂單，客戶下單後會出現在這裡
                </div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="p-4 rounded-lg border bg-card/50 hover:bg-accent/5 transition-colors space-y-2">
                    <div className="font-semibold">
                      {b.userDisplayName ?? ""} <span className="text-muted-foreground font-normal text-sm">({b.userEmail ?? ""})</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {b.note && <div className="mb-1">問題：{b.note}</div>}
                      {b.uploadPath && (
                        <a 
                          href={b.uploadPath} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          查看圖片
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
