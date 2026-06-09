"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bus, ArrowRight, Star, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TimeBand, MissedFreq, TransitMethod } from "@/lib/types";
import { MISSED_FREQS, TRANSIT_METHODS } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const COMPLETED_KEY = "survey-completed-v14";
const BYPASS_PATHS = ["/admin", "/settings"];

const TIME_BANDS: TimeBand[] = [
  "출근(06~09)", "퇴근(17~21)", "학원 하원(21~23)", "기타 시간",
];

/** 주간 이용 횟수 — 대표값으로 매핑 (분석 평균 유지용) */
const FREQUENCY_OPTIONS: { label: string; value: number }[] = [
  { label: "안 탐", value: 0 },
  { label: "주 1~2회", value: 2 },
  { label: "주 3~4회", value: 4 },
  { label: "주 5~7회", value: 6 },
];

/** 버스 혼잡도 1~5 라벨 */
const CONGESTION_LABELS = [
  "한산함", "여유 있음", "보통 (서서 가도 편함)", "만원 (불편함)", "극도로 만원 (못 타기도)",
];

export function WelcomeSurveyOverlay() {
  const pathname = usePathname();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [timeBand, setTimeBand] = useState<TimeBand>("출근(06~09)");
  const [weeklyCount, setWeeklyCount] = useState(4);
  const [transitMethod, setTransitMethod] = useState<TransitMethod>("버스");
  const [congestion, setCongestion] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [missedBusFreq, setMissedBusFreq] = useState<MissedFreq>("없음");
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

    setSubmitting(true);
    try {
      const res = await fetch("/api/commutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeBand, weeklyCount, transitMethod,
          congestion, missedBusFreq,
          satisfaction, expressIntent,
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
          <h2 className="text-xl font-bold text-[var(--text-strong)]">응답해 주셔서 감사합니다!</h2>
          <p className="text-sm text-[var(--text-muted)]">
            동안구 급행 버스 도입 제안에 반영됩니다.
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[var(--accent-text)] text-xs font-semibold">
              <Bus size={14} />
              출퇴근 버스 혼잡도 설문
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-strong)] leading-tight">
              출퇴근·등하교에 타는 버스,<br />얼마나 불편하세요?
            </h1>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              1분이면 끝납니다. 동안구민의 버스 출퇴근·등하교 혼잡 경험을 모아 안양시청에 급행 버스 도입을 제안하는 학생 비영리 프로젝트입니다.
            </p>
          </div>

          {/* 발표용 안내 */}
          <p className="text-[11px] text-[var(--text-muted)]">
            인덕원고 발표용 설문
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormBlock label="주로 버스가 혼잡한 시간대">
              <div className="grid grid-cols-2 gap-1.5">
                {TIME_BANDS.map((tb) => (
                  <button key={tb} type="button" onClick={() => setTimeBand(tb)}
                    className={cn(
                      "px-2 py-2 rounded-lg text-[11px] font-semibold transition-colors",
                      timeBand === tb
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text-base)]"
                    )}>
                    {tb}
                  </button>
                ))}
              </div>
            </FormBlock>

            <FormBlock label="버스를 일주일에 몇 번 타나요?">
              <div className="grid grid-cols-4 gap-1.5">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button key={opt.label} type="button" onClick={() => setWeeklyCount(opt.value)}
                    className={cn(
                      "px-1 py-2 rounded-lg text-[11px] font-semibold transition-colors",
                      weeklyCount === opt.value
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text-base)]"
                    )}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </FormBlock>

            <FormBlock label="학원가 ↔ 역, 주로 어떻게 이동하세요?">
              <div className="grid grid-cols-3 gap-1.5">
                {TRANSIT_METHODS.map((m) => (
                  <button key={m} type="button" onClick={() => setTransitMethod(m)}
                    className={cn(
                      "px-1 py-2 rounded-lg text-[11px] font-semibold transition-colors",
                      transitMethod === m
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text-base)]"
                    )}>
                    {m}
                  </button>
                ))}
              </div>
            </FormBlock>

            <FormBlock label="체감 혼잡도 (출퇴근 시간 기준)">
              <CongestionRow value={congestion} onChange={setCongestion} />
              <p className="text-center text-xs text-[var(--text-base)] mt-1.5 font-semibold">
                {CONGESTION_LABELS[congestion - 1]}
              </p>
            </FormBlock>

            <FormBlock label="버스가 만원이라 못 타거나 그냥 보낸 적이 있나요?">
              <div className="grid grid-cols-4 gap-1.5">
                {MISSED_FREQS.map((f) => (
                  <button key={f} type="button" onClick={() => setMissedBusFreq(f)}
                    className={cn(
                      "px-1 py-2 rounded-lg text-[11px] font-semibold transition-colors",
                      missedBusFreq === f
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text-base)]"
                    )}>
                    {f}
                  </button>
                ))}
              </div>
            </FormBlock>

            <FormBlock label="현재 버스 통근의 만족도">
              <StarRow value={satisfaction} onChange={setSatisfaction} />
              <p className="text-center text-[11px] text-[var(--text-muted)] mt-1">
                {["매우 불편", "불편", "보통", "만족", "매우 만족"][satisfaction - 1]}
              </p>
            </FormBlock>

            <FormBlock label="급행 버스가 생긴다면 이용할 의향?">
              <div className="rounded-lg bg-[var(--bg-soft)] px-3 py-2 text-[11px] text-[var(--text-base)] leading-relaxed">
                <strong className="text-[var(--text-strong)]">급행 버스란?</strong>{" "}
                중간 정류장 대부분을 건너뛰고 <strong>주요 거점만 빠르게 잇는 버스</strong>예요.
                <br />
                <span className="text-[var(--text-muted)]">
                  정류장이 줄어 <strong>조금 더 걸어야 해도, 시간이 단축</strong>된다면?
                  (예: <strong className="text-[var(--accent-text)]">평촌학원가 → 범계역</strong> 직행)
                </span>
              </div>
              <StarRow value={expressIntent} onChange={setExpressIntent} />
              <p className="text-center text-[11px] text-[var(--text-muted)] mt-1">
                {["절대 안 씀", "별로", "그럭저럭", "쓸 것 같음", "꼭 씀"][expressIntent - 1]}
              </p>
            </FormBlock>

            <FormBlock label="하고 싶은 말 (선택)">
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="예: 환승이 많아요 / 막차가 일찍 끊겨요"
                className="input rounded-lg px-3 py-2 text-sm w-full" maxLength={120} />
            </FormBlock>

            {error && (
              <div className="rounded-lg px-3 py-2 text-xs bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "제출 중..." : (
                <>응답 제출하고 사이트 보기 <ArrowRight size={16} /></>
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

function FormBlock({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
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
        <button key={n} type="button" onClick={() => onChange(n as 1 | 2 | 3 | 4 | 5)} aria-label={`${n}점`}>
          <Star size={24}
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

/** 혼잡도용 — 사람 아이콘으로 시각화 */
function CongestionRow({
  value, onChange,
}: { value: 1 | 2 | 3 | 4 | 5; onChange: (n: 1 | 2 | 3 | 4 | 5) => void }) {
  // 색상: 1(초록)~5(빨강) 그라데이션
  const colors = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];
  return (
    <div className="flex items-center justify-between gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
          aria-label={`${n}점`}
          className={cn(
            "flex flex-col items-center gap-1 flex-1 px-1 py-2 rounded-lg transition-all",
            n === value ? "bg-[var(--bg-soft)] ring-2" : "hover:bg-[var(--bg-soft)]"
          )}
          style={n === value ? { boxShadow: `inset 0 0 0 2px ${colors[n - 1]}` } : undefined}
        >
          <Users
            size={20}
            color={n <= value ? colors[n - 1] : "var(--border-strong)"}
            fill={n <= value ? colors[n - 1] : "none"}
          />
          <span
            className="text-[9px] font-bold"
            style={{ color: n <= value ? colors[n - 1] : "var(--text-muted)" }}
          >
            {n}
          </span>
        </button>
      ))}
    </div>
  );
}
