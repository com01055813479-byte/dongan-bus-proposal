"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bus, ArrowRight, Star, CheckCircle2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PLACES, CATEGORY_LABEL, type Place } from "@/lib/constants/places";
import type { TimeBand, TransportMode } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const COMPLETED_KEY = "survey-completed-v2"; // 폼 개편으로 v1 → v2
const BYPASS_PATHS = ["/admin", "/settings", "/games"];

const TIME_BANDS: TimeBand[] = ["출근(06~09)", "퇴근(17~21)", "기타 시간"];
const MODES: TransportMode[] = [
  "마을버스", "시내버스", "지하철", "도보", "자전거", "자가용", "택시", "기타",
];

export function WelcomeSurveyOverlay() {
  const pathname = usePathname();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── 폼 상태 ────────────────────────────────────────────────────────
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [fromCustom, setFromCustom] = useState("");
  const [toCustom, setToCustom] = useState("");
  const [timeBand, setTimeBand] = useState<TimeBand>("출근(06~09)");
  const [weeklyCount, setWeeklyCount] = useState(5);
  const [mode, setMode] = useState<TransportMode>("마을버스");
  const [currentMinutes, setCurrentMinutes] = useState(20);
  const [satisfaction, setSatisfaction] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [expressIntent, setExpressIntent] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (pathname && BYPASS_PATHS.some((p) => pathname.startsWith(p))) {
      setShow(false);
      return;
    }
    try {
      const completed = localStorage.getItem(COMPLETED_KEY);
      setShow(!completed);
    } catch {
      setShow(true);
    }
  }, [pathname]);

  if (!show) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fromId) return setError("출발지를 선택해 주세요");
    if (!toId) return setError("도착지를 선택해 주세요");
    if (fromId === "other" && !fromCustom.trim()) return setError("출발지를 직접 입력해 주세요");
    if (toId === "other" && !toCustom.trim()) return setError("도착지를 직접 입력해 주세요");
    // 같은 거점 검사 (직접입력의 경우 텍스트도 비교)
    const fromKey = fromId === "other" ? `other:${fromCustom.trim()}` : fromId;
    const toKey   = toId === "other" ? `other:${toCustom.trim()}` : toId;
    if (fromKey === toKey) return setError("출발지와 도착지가 같습니다");

    setSubmitting(true);
    try {
      const res = await fetch("/api/commutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromPlaceId: fromId,
          fromCustomText: fromId === "other" ? fromCustom.trim() : undefined,
          toPlaceId: toId,
          toCustomText: toId === "other" ? toCustom.trim() : undefined,
          timeBand,
          weeklyCount,
          currentMode: mode,
          currentMinutes,
          satisfaction,
          expressIntent,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");

      try { localStorage.setItem(COMPLETED_KEY, "1"); } catch {}
      setSuccess(true);
      setTimeout(() => {
        setShow(false);
        if (pathname !== "/") router.push("/");
        else router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <div className="card rounded-3xl px-8 py-10 max-w-md w-full flex flex-col items-center gap-4 text-center">
          <CheckCircle2 size={56} className="text-emerald-500" />
          <h2 className="text-xl font-bold text-[var(--text-strong)]">
            응답해 주셔서 감사합니다!
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            동안구 급행 셔틀 노선 도출에 반영됩니다.
            <br />
            잠시 후 사이트로 이동합니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 py-8">
        <div className="card rounded-3xl p-6 max-w-md w-full flex flex-col gap-5">
          {/* 헤더 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[var(--accent-text)] text-xs font-semibold">
              <Bus size={14} />
              동안구 출퇴근 설문
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-strong)] leading-tight">
              평소 출퇴근 경로를<br />알려주세요
            </h1>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              1분이면 끝납니다. 동안구민의 통근 데이터를 모아 안양시청에 급행 셔틀버스 노선을 제안하는 학생 동아리 프로젝트입니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PlaceField
              label="출발지"
              value={fromId}
              onChange={setFromId}
              excludeId={toId}
              customText={fromCustom}
              onCustomChange={setFromCustom}
            />
            <PlaceField
              label="도착지"
              value={toId}
              onChange={setToId}
              excludeId={fromId}
              customText={toCustom}
              onCustomChange={setToCustom}
            />

            <FormBlock label="이 경로의 주된 이동 시간">
              <div className="grid grid-cols-3 gap-1.5">
                {TIME_BANDS.map((tb) => (
                  <button
                    key={tb}
                    type="button"
                    onClick={() => setTimeBand(tb)}
                    className={cn(
                      "px-2 py-2 rounded-lg text-[11px] font-semibold transition-colors",
                      timeBand === tb
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text-base)]"
                    )}
                  >
                    {tb}
                  </button>
                ))}
              </div>
            </FormBlock>

            <FormBlock label="일주일 평균 이용 횟수">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-muted)]">왕복 1회 = 2회</span>
                <span className="text-lg font-bold text-[var(--text-strong)]">{weeklyCount}회</span>
              </div>
              <input
                type="range" min={1} max={14} value={weeklyCount}
                onChange={(e) => setWeeklyCount(parseInt(e.target.value, 10))}
                className="w-full accent-[var(--accent)]"
              />
            </FormBlock>

            <FormBlock label="현재 사용하는 교통수단">
              <div className="grid grid-cols-4 gap-1.5">
                {MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors",
                      mode === m
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text-base)]"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </FormBlock>

            <FormBlock label="현재 보통 몇 분 걸리나요?">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-muted)]">대기·환승·도보 포함</span>
                <span className="text-lg font-bold text-[var(--text-strong)]">{currentMinutes}분</span>
              </div>
              <input
                type="range" min={5} max={120} step={5}
                value={currentMinutes}
                onChange={(e) => setCurrentMinutes(parseInt(e.target.value, 10))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-0.5">
                <span>5분</span><span>60분</span><span>120분</span>
              </div>
            </FormBlock>

            <FormBlock label="현재 이동의 만족도">
              <StarRow value={satisfaction} onChange={setSatisfaction} />
              <p className="text-center text-[11px] text-[var(--text-muted)] mt-1">
                {["매우 불편", "불편", "보통", "만족", "매우 만족"][satisfaction - 1]}
              </p>
            </FormBlock>

            <FormBlock label="급행 셔틀이 생긴다면 이용할 의향?">
              <StarRow value={expressIntent} onChange={setExpressIntent} />
              <p className="text-center text-[11px] text-[var(--text-muted)] mt-1">
                {["절대 안 씀", "별로", "그럭저럭", "쓸 것 같음", "꼭 씀"][expressIntent - 1]}
              </p>
            </FormBlock>

            <FormBlock label="하고 싶은 말 (선택)">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 환승이 많아요 / 막차가 일찍 끊겨요"
                className="input rounded-lg px-3 py-2 text-sm w-full"
                maxLength={120}
              />
            </FormBlock>

            {error && (
              <div className="rounded-lg px-3 py-2 text-xs bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "제출 중..." : (
                <>
                  응답 제출하고 사이트 보기
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          <p className="text-[10px] text-[var(--text-muted)] text-center leading-relaxed">
            응답은 익명으로 저장되며 정책 제안 자료에만 사용됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────── 공통: 형식별 컴포넌트 ──────────────────────────────
function FormBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-[var(--text-base)]">{label}</span>
      {children}
    </div>
  );
}

function StarRow({
  value, onChange,
}: { value: 1 | 2 | 3 | 4 | 5; onChange: (n: 1 | 2 | 3 | 4 | 5) => void }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
          aria-label={`${n}점`}
        >
          <Star
            size={24}
            className={cn(
              n <= value
                ? "text-amber-400 fill-amber-400"
                : "text-[var(--border-strong)]"
            )}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * 거점 선택 — select(카테고리별 그룹) + "기타" 선택 시 자유 입력.
 */
export function PlaceField({
  label, value, onChange, excludeId, customText, onCustomChange,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  excludeId?: string;
  customText: string;
  onCustomChange: (text: string) => void;
}) {
  const grouped: Record<string, Place[]> = {};
  for (const p of PLACES) {
    if (p.id === excludeId) continue;
    (grouped[p.category] ??= []).push(p);
  }
  const orderedCats: Array<keyof typeof CATEGORY_LABEL> = [
    "subway", "academy", "residence", "office", "facility", "park", "outside", "other",
  ];

  return (
    <FormBlock label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input rounded-lg px-3 py-2 text-sm w-full"
      >
        <option value="">— 선택 —</option>
        {orderedCats.map((cat) => {
          const ps = grouped[cat];
          if (!ps?.length) return null;
          return (
            <optgroup key={cat} label={CATEGORY_LABEL[cat].label}>
              {ps.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
          );
        })}
      </select>
      {value === "other" && (
        <div className="flex items-center gap-1.5 mt-1">
          <Pencil size={12} className="text-[var(--text-muted)] shrink-0 ml-1" />
          <input
            type="text"
            value={customText}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="장소명을 직접 입력 (예: ○○동 ○○아파트)"
            className="input rounded-lg px-3 py-2 text-sm w-full"
            maxLength={80}
          />
        </div>
      )}
    </FormBlock>
  );
}
