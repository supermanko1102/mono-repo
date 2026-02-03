"use client";

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  apiCreateBooking,
  apiMentor,
  apiMentors,
  apiMe,
  apiUpload,
} from "@/app/lib/api";
import type { Me, MentorSummary, Slot } from "@/app/lib/mentor-slots";
import { formatSlot, sortSlots } from "@/app/lib/mentor-slots";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [me, setMe] = useState<Me | null>(null);
  const [mentors, setMentors] = useState<MentorSummary[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [status, setStatus] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    apiMe().then((res) => {
      if (res.ok) setMe(res.data);
    });
    apiMentors().then((res) => {
      if (!res.ok) return;
      setMentors(res.data);
    });
  }, []);

  useEffect(() => {
    if (!selectedMentorId) return;
    apiMentor(selectedMentorId).then((res) => {
      if (!res.ok) {
        setStatus(res.error);
        return;
      }
      setSlots(res.data.slots);
    });
  }, [selectedMentorId]);

  const sortedSlots = useMemo(() => sortSlots(slots), [slots]);

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("");

    if (!me) {
      setStatus("請先登入/註冊。");
      return;
    }
    if (me.role !== "VIBE_CODER") {
      setStatus("此頁僅提供 vibe coder 下單預約。");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const slotId = String(fd.get("slot") ?? "").trim();
    const note = String(fd.get("note") ?? "").trim();

    if (!slotId) {
      setStatus("請先選擇一個可預約時段。");
      return;
    }

    let uploadId: string | undefined;
    if (uploadFile) {
      const up = await apiUpload(uploadFile);
      if (!up.ok) {
        setStatus(up.error);
        return;
      }
      uploadId = up.data.uploadId;
    }

    const res = await apiCreateBooking({ slotId, note, uploadId });
    if (!res.ok) {
      setStatus(res.error);
      return;
    }

    setStatus("已完成預約。導師端可查看訂單。\n");
    setUploadFile(null);
    e.currentTarget.reset();

    if (selectedMentorId) {
      const refresh = await apiMentor(selectedMentorId);
      if (refresh.ok) setSlots(refresh.data.slots);
    }
  };

  return (
    <div className="view space-y-8" aria-labelledby="customer-title">
      <Card>
        <CardHeader>
          <CardTitle id="customer-title">vibe coder 預約導師</CardTitle>
          <CardDescription>選導師、選時段、可上傳圖片（例如：錯誤截圖）</CardDescription>
        </CardHeader>
        <CardContent>
          {!me && (
            <div className="mb-6 p-4 rounded-md border bg-muted/20 text-center">
              <p className="text-sm font-medium mb-2">請先登入/註冊</p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/auth">前往登入/註冊</Link>
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="space-y-2">
              <Label>選擇導師</Label>
              <Select
                value={selectedMentorId}
                onChange={(e) => {
                  const next = e.target.value;
                  setSelectedMentorId(next);
                  if (!next) setSlots([]);
                }}
              >
                <option value="">請選擇...</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <form className="space-y-6" autoComplete="on" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label>可預約時段</Label>
                <Select name="slot" required disabled={sortedSlots.length === 0}>
                  {sortedSlots.length === 0 ? (
                    <option value="">（目前無可預約時段）</option>
                  ) : (
                    <>
                      <option value="">請選擇...</option>
                      {sortedSlots.map((slot) => {
                        const { date, time } = formatSlot(slot.startAtIso);
                        return (
                          <option key={slot.id} value={slot.id}>
                            {date} {time}
                          </option>
                        );
                      })}
                    </>
                  )}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>問題描述 (選填)</Label>
                <Input name="note" type="text" maxLength={500} placeholder="例如：vite build 失敗..." />
              </div>
              <div className="space-y-2">
                <Label>圖片上傳 (選填)</Label>
                <Input
                  className="file:text-foreground"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.currentTarget.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-2">
                <Label>狀態</Label>
                <Input
                  value={me ? `${me.displayName}（${me.role === "VIBE_CODER" ? "vibe coder" : "導師"}）` : "未登入"}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button type="submit">送出預約</Button>
              <div className="text-sm font-medium text-muted-foreground" role="status" aria-live="polite">
                {status}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card aria-labelledby="available-title">
        <CardHeader>
          <CardTitle id="available-title" className="text-lg">目前可預約時段</CardTitle>
          <CardDescription>{sortedSlots.length} 個可預約時段</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {sortedSlots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                目前沒有可預約時段，請稍後再試
              </div>
            ) : (
              sortedSlots.map((slot) => {
                const { date, time } = formatSlot(slot.startAtIso);
                return (
                  <div key={slot.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-accent/5 transition-colors">
                    <div>
                      <div className="font-semibold">{date} {time}</div>
                      {slot.note && <div className="text-sm text-muted-foreground mt-1">{slot.note}</div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
