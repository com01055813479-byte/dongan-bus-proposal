"use client";

import { useEffect, useState } from "react";
import { Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudDrizzle, Umbrella } from "lucide-react";

interface Weather {
  tempC: number | null;
  pty: number;          // 0/1/2/3/5/6/7
  rainMm: number;
  tmin: number | null;
  tmax: number | null;
  maxPop: number;
  sky: number;          // 1/3/4
  updatedAt: string;
}

/** 하늘상태 + 강수형태로 적절한 아이콘/라벨 결정 */
function classify(w: Weather): { Icon: typeof Sun; label: string; tint: string } {
  if (w.pty === 1 || w.pty === 5) return { Icon: CloudRain,    label: "비",       tint: "text-blue-500"   };
  if (w.pty === 3 || w.pty === 7) return { Icon: CloudSnow,    label: "눈",       tint: "text-sky-300"    };
  if (w.pty === 2 || w.pty === 6) return { Icon: CloudDrizzle, label: "비/눈",    tint: "text-cyan-400"   };
  if (w.sky === 1)                return { Icon: Sun,          label: "맑음",     tint: "text-amber-400"  };
  if (w.sky === 3)                return { Icon: CloudSun,     label: "구름많음", tint: "text-amber-300"  };
  if (w.sky === 4)                return { Icon: Cloud,        label: "흐림",     tint: "text-slate-400"  };
  // sky=0 (실황만 사용 — 단기예보 미승인): 강수 없으면 기본 맑음 아이콘
  return { Icon: Sun, label: w.tempC !== null ? "현재" : "—", tint: "text-amber-400" };
}

export function WeatherCard() {
  const [w, setW] = useState<Weather | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    fetch("/api/weather")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? `오류 ${r.status}`);
        if (!canceled) {
          setW(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!canceled) {
          setError(e instanceof Error ? e.message : "날씨 조회 실패");
          setLoading(false);
        }
      });
    return () => { canceled = true; };
  }, []);

  // 로딩
  if (loading) {
    return (
      <div className="card rounded-2xl px-4 py-3 min-w-[140px] flex flex-col items-center justify-center gap-1">
        <span className="text-xs text-[var(--text-muted)]">날씨</span>
        <div className="w-8 h-8 rounded-full bg-[var(--bg-soft)] animate-pulse" />
        <span className="text-[10px] text-[var(--text-muted)]">불러오는 중</span>
      </div>
    );
  }

  // 에러
  if (error || !w) {
    return (
      <div className="card rounded-2xl px-4 py-3 min-w-[140px] flex flex-col items-center justify-center gap-1">
        <Cloud size={20} className="text-[var(--text-muted)]" />
        <span className="text-[10px] text-[var(--text-muted)] text-center max-w-[120px] leading-tight">
          {error ?? "날씨 정보 없음"}
        </span>
      </div>
    );
  }

  const { Icon, label, tint } = classify(w);
  const tempStr = w.tempC !== null ? `${Math.round(w.tempC)}°` : "—";
  const hasForecast = w.tmin !== null || w.tmax !== null || w.maxPop > 0;

  return (
    <div className="card rounded-2xl px-4 py-3 min-w-[140px] flex flex-col items-center gap-1.5">
      {/* 아이콘 + 상태 */}
      <div className="flex items-center gap-1.5">
        <Icon size={22} className={tint} />
        <span className="text-xs font-semibold text-[var(--text-base)]">{label}</span>
      </div>

      {/* 현재 기온 */}
      <p className="text-2xl font-bold text-[var(--text-strong)] leading-none tabular-nums">
        {tempStr}
      </p>

      {/* 최고/최저 + 강수확률 (단기예보 승인 시에만) */}
      {hasForecast ? (
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] tabular-nums">
          {(w.tmax !== null || w.tmin !== null) && (
            <span>
              <span className="text-rose-500 font-semibold">
                {w.tmax !== null ? `${Math.round(w.tmax)}°` : "—"}
              </span>
              <span className="opacity-50 mx-0.5">/</span>
              <span className="text-blue-500 font-semibold">
                {w.tmin !== null ? `${Math.round(w.tmin)}°` : "—"}
              </span>
            </span>
          )}
          {w.maxPop > 0 && (
            <span className="flex items-center gap-0.5">
              <Umbrella size={10} />
              {w.maxPop}%
            </span>
          )}
        </div>
      ) : (
        // 단기예보 없을 때 — 강수량 (현재 1시간) 표시
        <div className="text-[11px] text-[var(--text-muted)] tabular-nums">
          {w.rainMm > 0 ? `${w.rainMm.toFixed(1)}mm/h` : "평촌학원가"}
        </div>
      )}
    </div>
  );
}
