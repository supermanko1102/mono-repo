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
    <section className="view" aria-labelledby="customer-title">
      <div className="card">
        <div className="card-head">
          <h1 id="customer-title" className="h1">
            vibe coder 預約導師
          </h1>
          <div className="muted">選導師、選時段、可上傳圖片（例如：錯誤截圖）</div>
        </div>

        {!me ? (
          <div className="item">
            <div className="item-main">
              <div className="item-title">請先登入/註冊</div>
              <div className="item-sub">
                <Link href="/auth">前往登入/註冊</Link>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid">
          <label className="field">
            <span className="label">選擇導師</span>
            <select
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
            </select>
          </label>
          <div />
          <div />
          <div />
        </div>

        <form className="form" autoComplete="on" onSubmit={onSubmit}>
          <div className="grid">
            <label className="field">
              <span className="label">可預約時段</span>
              <select name="slot" required disabled={sortedSlots.length === 0}>
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
              </select>
            </label>
            <label className="field">
              <span className="label">問題描述 (選填)</span>
              <input name="note" type="text" maxLength={500} placeholder="例如：vite build 失敗、TS 類型錯誤..." />
            </label>
            <label className="field">
              <span className="label">圖片上傳 (選填)</span>
              <input
                name="image"
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.currentTarget.files?.[0] ?? null)}
              />
            </label>
            <label className="field">
              <span className="label">狀態</span>
              <input value={me ? `${me.displayName}（${me.role === "VIBE_CODER" ? "vibe coder" : "導師"}）` : "未登入"} readOnly />
            </label>
          </div>

          <div className="actions">
            <button className="btn btn-primary" type="submit">
              送出預約
            </button>
            <div className="status" role="status" aria-live="polite">
              {status}
            </div>
          </div>
        </form>
      </div>

      <section className="card" aria-labelledby="available-title">
        <div className="card-head">
          <h2 id="available-title" className="h2">
            目前可預約時段
          </h2>
          <div className="muted">{sortedSlots.length} 個可預約時段</div>
        </div>
        <div className="list" role="list">
          {sortedSlots.length === 0 ? (
            <div className="item">
              <div className="item-main">
                <div className="item-title">目前沒有可預約時段</div>
                <div className="item-sub">請稍後再試</div>
              </div>
            </div>
          ) : (
            sortedSlots.map((slot) => {
              const { date, time } = formatSlot(slot.startAtIso);
              return (
                <div key={slot.id} className="item" role="listitem">
                  <div className="item-main">
                    <div className="item-title">
                      {date} {time}
                    </div>
                    <div className="item-sub">
                      {slot.note ? `備註：${slot.note}` : ""}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </section>
  );
}
