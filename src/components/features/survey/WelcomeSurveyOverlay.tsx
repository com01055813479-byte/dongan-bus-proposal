"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bus, ArrowRight, Star, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TimeBand, TransportMode } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const COMPLETED_KEY = "survey-completed-v6";
const BYPASS_PATHS = ["/admin", "/settings"];

const TIME_BANDS: TimeBand[] = [
  "출근(06~09)", "퇴근(17~21)", "학원 하원(21~23)", "기타 시간",
];
const MODES: TransportMode[] = [
  "버스", "지하철", "도보", "자전거",
  "자동차", "헬리콥터", "비행기", "기타",
];

/** 교통수단별 혼잡도 메시지 (1~5점) */
const CONGESTION_LABELS_BY_MODE: Record<TransportMode, string[]> = {
  버스:      ["한산함", "여유 있음", "보통 (서서 가도 편함)", "만원 (불편함)", "극도로 만원 (못 타기도)"],
  지하철:    ["한산함", "여유 있음", "보통 (서서 가도 편함)", "만원 (불편함)", "극도로 만원 (못 타기도)"],
  도보:      ["혼자 걸어요", "한산함", "사람 종종 보임", "사람 많아 속도 느림", "인파에 떠밀림"],
  자전거:    ["길이 텅 비었음", "여유롭게 페달", "보통", "차·사람 많아 조심", "자전거 도로 정체"],
  자동차:    ["뻥 뚫림 🚗💨", "원활", "약간 느림", "정체", "극심한 정체 (꽉 막힘)"],
  헬리콥터: ["한산함", "여유 있음", "보통", "혼잡", "극도로 혼잡"],
  비행기:    ["한산함", "여유 있음", "보통", "혼잡", "극도로 혼잡"],
  기타:      ["한산함", "여유 있음", "보통", "혼잡", "극도로 혼잡"],
};

function routePlaceholder(mode: TransportMode): string {
  switch (mode) {
    case "버스":      return "예: 마을버스 02 (귀인중 → 인덕원역)";
    case "지하철":    return "예: 4호선 인덕원→평촌";
    case "도보":      return "예: 호계동→평촌역";
    case "자전거":    return "예: 호계동→평촌학원가";
    case "자동차":    return "예: 호계동→강남 출퇴근";
    case "헬리콥터":  return "🚁 어디로? (예: 호계동 옥상→강남 빌딩)";
    case "비행기":    return "✈️ 어느 항공편? (예: 인천→제주 KE1001)";
    case "기타":      return "이용하는 노선/구간";
  }
}

export function WelcomeSurveyOverlay() {
  const pathname = usePathname();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<TransportMode>("버스");
  const [routeText, setRouteText] = useState("");
  const [timeBand, setTimeBand] = useState<TimeBand>("출근(06~09)");
  const [congestion, setCongestion] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [weeklyCount, setWeeklyCount] = useState(5);
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
    const r = routeText.trim();
    // 버스 선택 시에만 노선 입력 필수
    if (mode === "버스" && !r) {
      return setError("버스를 선택하셨으니 혼잡한 버스 번호/노선을 입력해 주세요");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/commutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeText: r,
          timeBand, congestion, weeklyCount,
          currentMode: mode, currentMinutes,
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[var(--accent-text)] text-xs font-semibold">
              <Bus size={14} />
              주로 타는 버스 혼잡도 조사
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-strong)] leading-tight">
              평소 자주 타는 버스가<br />얼마나 만원인가요?
            </h1>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              1분이면 끝납니다. 동안구민의 출퇴근·등하교 혼잡 경험을 모아 안양시청에 급행 버스 도입을 제안하는 학생 비영리 프로젝트입니다.
            </p>
          </div>

          {/* 친구들에게 보내는 메시지 */}
          <div
            className="rounded-2xl px-4 py-3 border-2 border-dashed"
            style={{
              borderColor: "var(--accent)",
              backgroundColor: "var(--accent-soft)",
            }}
          >
            <p className="text-sm leading-relaxed text-[var(--accent-text)]">
              이거 내가 <strong>열심히</strong> 만들었는데 설문 귀찮아서 안하지 말고 좀 해주세요 🙏
            </p>
            <p className="text-xs text-[var(--accent-text)] opacity-75 text-right mt-1.5 font-semibold">
              — 조은규가
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormBlock label={
              <span className="flex items-baseline gap-1.5">
                <span>주로 사용하는 교통수단</span>
                <span className="text-[10px] font-normal text-[var(--text-muted)]">
                  (출퇴근 · 등하교)
                </span>
              </span>
            }>
              <div className="grid grid-cols-4 gap-1.5">
                {MODES.map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors",
                      mode === m
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text-base)]"
                    )}>
                    {m}
                  </button>
                ))}
              </div>
            </FormBlock>

            <FormBlock
              label={
                <span className="flex items-center gap-1.5">
                  {mode === "버스" ? "주로 혼잡한 버스 번호 / 노선" : "자주 이용하는 노선 또는 구간"}
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded",
                      mode === "버스"
                        ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300"
                        : "bg-[var(--bg-soft)] text-[var(--text-muted)]"
                    )}
                  >
                    {mode === "버스" ? "필수" : "선택사항"}
                  </span>
                </span>
              }
            >
              <input
                type="text"
                value={routeText}
                onChange={(e) => setRouteText(e.target.value)}
                placeholder={routePlaceholder(mode)}
                maxLength={80}
                className="input rounded-lg px-3 py-2 text-sm w-full"
                autoComplete="off"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                {mode === "버스"
                  ? "버스 번호 + 구간 적어주세요 (예: 마을버스 02, 귀인중→인덕원역)"
                  : "노선 / 구간 / 장소 — 떠오르면 자유롭게, 안 적어도 OK"}
              </p>
            </FormBlock>

            <FormBlock label="이용 시간대">
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

            <FormBlock label="체감 혼잡도 (출퇴근 시간 기준)">
              <CongestionRow value={congestion} onChange={setCongestion} />
              <p className="text-center text-xs text-[var(--text-base)] mt-1.5 font-semibold">
                {CONGESTION_LABELS_BY_MODE[mode][congestion - 1]}
              </p>
            </FormBlock>

            <FormBlock label="일주일 평균 이용 횟수">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-muted)]">왕복 1회 = 2회</span>
                <span className="text-lg font-bold text-[var(--text-strong)]">{weeklyCount}회</span>
              </div>
              <input type="range" min={1} max={14} value={weeklyCount}
                onChange={(e) => setWeeklyCount(parseInt(e.target.value, 10))}
                className="w-full accent-[var(--accent)]" />
            </FormBlock>

            <FormBlock label="현재 보통 몇 분 걸리나요?">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-muted)]">대기·환승·도보 포함</span>
                <span className="text-lg font-bold text-[var(--text-strong)]">{currentMinutes}분</span>
              </div>
              <input type="range" min={5} max={120} step={5} value={currentMinutes}
                onChange={(e) => setCurrentMinutes(parseInt(e.target.value, 10))}
                className="w-full accent-[var(--accent)]" />
            </FormBlock>

            <FormBlock label="현재 이동의 만족도">
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
                  예: <strong className="text-[var(--accent-text)]">평촌학원가 → 범계역</strong> 직행 (중간 정류장 다 통과)
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
