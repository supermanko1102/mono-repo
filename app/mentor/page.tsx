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
    <section className="view" aria-labelledby="mentor-title">
      <div className="card">
        <div className="card-head">
          <h1 id="mentor-title" className="h1">
            新增可預約時間
          </h1>
          <div className="muted">時段會出現在客戶端清單中</div>
        </div>

        {!me ? (
          <div className="item">
            <div className="item-main">
              <div className="item-title">請先登入/註冊（導師）</div>
              <div className="item-sub">
                <Link href="/auth">前往登入/註冊</Link>
              </div>
            </div>
          </div>
        ) : me.role !== "MENTOR" ? (
          <div className="item">
            <div className="item-main">
              <div className="item-title">此頁僅提供導師使用</div>
              <div className="item-sub">請使用導師身份登入</div>
            </div>
          </div>
        ) : null}

        <form className="form" autoComplete="off" onSubmit={onAddSlot}>
          <div className="grid">
            <label className="field">
              <span className="label">日期</span>
              <input name="date" type="date" required />
            </label>
            <label className="field">
              <span className="label">開始時間</span>
              <input name="time" type="time" required />
            </label>
            <label className="field">
              <span className="label">時長 (分鐘)</span>
              <input
                name="duration"
                type="number"
                inputMode="numeric"
                min={15}
                step={15}
                defaultValue={60}
                required
              />
            </label>
            <label className="field">
              <span className="label">備註 (選填)</span>
              <input name="note" type="text" maxLength={80} placeholder="例如：一對一諮詢" />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="submit">
              新增時段
            </button>
            <div className="status" role="status" aria-live="polite">
              {status}
            </div>
          </div>
        </form>
      </div>

      <div className="cols">
        <section className="card" aria-labelledby="slots-title">
          <div className="card-head">
            <h2 id="slots-title" className="h2">
              已建立時段
            </h2>
            <div className="muted">{sortedSlots.length} 個時段</div>
          </div>
          <div className="list" role="list">
            {sortedSlots.length === 0 ? (
              <div className="item">
                <div className="item-main">
                  <div className="item-title">尚無可預約時段</div>
                  <div className="item-sub">新增後會顯示在客戶端</div>
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
                        {slot.status}{slot.note ? `｜${slot.note}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="card" aria-labelledby="orders-title">
          <div className="card-head">
            <h2 id="orders-title" className="h2">
              客戶訂單
            </h2>
            <div className="muted">{bookings.length} 筆訂單</div>
          </div>
          <div className="list" role="list">
            {bookings.length === 0 ? (
              <div className="item">
                <div className="item-main">
                  <div className="item-title">尚無訂單</div>
                  <div className="item-sub">客戶下單後會出現在這裡</div>
                </div>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="item" role="listitem">
                  <div className="item-main">
                    <div className="item-title">
                      {b.userDisplayName ?? ""}（{b.userEmail ?? ""}）
                    </div>
                    <div className="item-sub">
                      {b.note ? `問題：${b.note}` : ""}
                      {b.uploadPath ? (
                        <>
                          {"｜"}
                          <a href={b.uploadPath} target="_blank" rel="noreferrer">
                            圖片
                          </a>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
