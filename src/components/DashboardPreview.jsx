import React from 'react';
import { BadgeCheck, CalendarDays, Plane, QrCode, TrendingUp } from 'lucide-react';

/** Static, presentational mockup of the LeaveGo employee dashboard. */
export function DashboardPreview() {
  const bars = [38, 62, 45, 78, 56, 90, 70];

  return (
    <div className="rounded-3xl border border-white/15 bg-white/8 p-4 backdrop-blur-md sm:p-5">
      <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
        {/* Profile row */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="flex size-10 items-center justify-center rounded-full bg-emerald-700 font-display text-sm font-bold text-white">
            MS
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Maria Santos</p>
            <p className="truncate text-xs text-slate-500">
              Forest Management · CENRO Olongapo
            </p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <BadgeCheck className="size-3" /> Employee
          </span>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            ['12.5', 'VL credits'],
            ['9.0', 'SL credits'],
            ['3', 'Pending'],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-slate-100 px-3 py-3">
              <p className="font-display text-xl font-extrabold">{v}</p>
              <p className="text-[11px] text-slate-500">{l}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Requests this quarter</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="size-3" /> +18%
            </span>
          </div>
          <div className="mt-3 flex h-20 items-end gap-2">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-emerald-600/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Requests */}
        <div className="mt-4 space-y-2">
          {[
            { icon: CalendarDays, name: 'Vacation Leave · 3 days', tag: 'Approved' },
            { icon: Plane, name: 'Travel Order · Subic Bay', tag: 'For approval' },
          ].map(({ icon: Icon, name, tag }) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Icon className="size-4" />
              </span>
              <p className="truncate text-xs font-semibold">{name}</p>
              <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {tag}
              </span>
            </div>
          ))}
        </div>

        {/* QR verification */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 px-4 py-3 text-white">
          <QrCode className="size-8 shrink-0" />
          <div>
            <p className="text-xs font-bold">Document verified</p>
            <p className="text-[11px] text-white/70">TO-2026-0184 · QR authenticated</p>
          </div>
        </div>
      </div>
    </div>
  );
}
