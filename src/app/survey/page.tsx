"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPinned, ArrowRight, CheckCircle2, Star, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCommutes } from "@/lib/hooks/useCommutes";
import type { TimeBand, TransportMode } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const TIME_BANDS: TimeBand[] = ["출근(06~09)", "퇴근(17~21)", "기타 시간"];
const MODES: TransportMode[] = [
  "버스", "지하철", "도보", "자전거",
  "자동차", "헬리콥터", "UFO", "기타",
];
const CONGESTION_LABELS = [
  "한산함", "여유 있음", "보통 (서서 가도 편함)", "만원 (불편함)", "극도로 만원 (못 타기도)",
];

function routePlaceholder(mode: TransportMode): string {
  switch (mode) {
    case "버스":      return "예: 1500번, 마을버스 02 (인덕원→강남)";
    case "지하철":    return "예: 4호선 인덕원→평촌";
    case "도보":      return "예: 호계동→평촌역";
    case "자전거":    return "예: 호계동→평촌학원가";
    case "자동차":    return "예: 호계동→강남 출퇴근";
    case "헬리콥터":  return "🚁 어디로? (예: 호계동 옥상→강남 빌딩)";
    case "UFO":       return "👽 외계인 픽업 노선...?";
    case "기타":      return "이용하는 노선/구간";
  }
}

export default function SurveyPage() {
  const { add } = useCommutes();

  const [mode, setMode] = useState<TransportMode>("버스");
  const [routeText, setRouteText] = useState("");
  const [timeBand, setTimeBand] = useState<TimeBand>("출근(06~09)");
  const [congestion, setCongestion] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [weeklyCount, setWeeklyCount] = useState(5);
  const [currentMinutes, setCurrentMinutes] = useState(20);
  const [satisfaction, setSatisfaction] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [expressIntent, setExpressIntent] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const r = routeText.trim();
    if (!r) return setError("자주 이용하는 버스 노선/구간을 입력해 주세요");
    try {
      await add({
        routeText: r,
        timeBand, congestion, weeklyCount,
        currentMode: mode, currentMinutes,
        satisfaction, expressIntent,
        note: note || undefined,
      });
      try { localStorage.setItem("survey-completed-v6", "1"); } catch {}
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    }
  }

  function handleAnother() {
    setSubmitted(false);
    setRouteText(""); setNote("");
    setCongestion(3); setSatisfaction(3); setExpressIntent(4);
    setWeeklyCount(5); setCurrentMinutes(20);
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-5">
        <div className="pt-2 pb-1">
          <p className="text-sm text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
            <MapPinned size={14} /> 출퇴근 혼잡 설문
          </p>
          <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
            응답해 주셔서<br />
            <span className="text-[var(--accent)]">감사합니다!</span>
          </h1>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <p className="text-base font-semibold text-[var(--text-strong)]">응답이 저장되었습니다</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleAnother} variant="primary">
            <MapPinned size={16} /> 다른 노선 응답
          </Button>
          <Link href="/analysis" className="flex">
            <button className="card w-full rounded-2xl px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[var(--bg-soft)] transition-colors">
              분석 결과 보기 <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="pt-2 pb-1">
        <p className="text-sm text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
          <MapPinned size={14} /> 출퇴근 혼잡 설문
        </p>
        <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
          평소 자주 타는 버스가<br />
          <span className="text-[var(--accent)]">얼마나 만원인가요?</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader><CardTitle>현재 사용하는 교통수단</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MODES.map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                    mode === m
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text-base)]"
                  )}>
                  {m}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{mode === "버스" ? "주로 혼잡한 버스 번호 / 노선" : "자주 이용하는 노선 또는 구간"}</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={routeText}
              onChange={(e) => setRouteText(e.target.value)}
              placeholder={routePlaceholder(mode)}
              maxLength={80}
              className="input rounded-xl px-3 py-2.5 text-sm w-full"
              autoComplete="off"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-2">
              {mode === "버스"
                ? "버스 번호 + 구간 적어주세요 (1500번, 마을버스 02 등)"
                : "노선 번호 / 구간 / 정류장 — 떠오르는 대로 자유롭게"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>이용 시간대</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {TIME_BANDS.map((tb) => (
                <button key={tb} type="button" onClick={() => setTimeBand(tb)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm font-semibold transition-colors",
                    timeBand === tb
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text-base)]"
                  )}>
                  {tb}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>이 노선의 혼잡도 (출퇴근 시간 기준)</CardTitle></CardHeader>
          <CardContent>
            <CongestionRow value={congestion} onChange={setCongestion} />
            <p className="text-center text-sm text-[var(--text-base)] mt-3 font-semibold">
              {CONGESTION_LABELS[congestion - 1]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>일주일 평균 이용 횟수</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">왕복 1회 = 2회</span>
              <span className="text-2xl font-bold text-[var(--text-strong)]">{weeklyCount}회</span>
            </div>
            <input type="range" min={1} max={14} value={weeklyCount}
              onChange={(e) => setWeeklyCount(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--accent)]" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>현재 보통 몇 분 걸리나요?</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">대기·환승·도보 포함</span>
              <span className="text-2xl font-bold text-[var(--text-strong)]">{currentMinutes}분</span>
            </div>
            <input type="range" min={5} max={120} step={5} value={currentMinutes}
              onChange={(e) => setCurrentMinutes(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--accent)]" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>현재 이동의 만족도</CardTitle></CardHeader>
          <CardContent>
            <StarRow value={satisfaction} onChange={setSatisfaction} />
            <p className="text-center text-xs text-[var(--text-muted)] mt-2">
              {["매우 불편", "불편", "보통", "만족", "매우 만족"][satisfaction - 1]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>급행 셔틀이 생긴다면 이용할 의향?</CardTitle></CardHeader>
          <CardContent>
            <StarRow value={expressIntent} onChange={setExpressIntent} />
            <p className="text-center text-xs text-[var(--text-muted)] mt-2">
              {["절대 안 씀", "별로", "그럭저럭", "쓸 것 같음", "꼭 씀"][expressIntent - 1]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>하고 싶은 말 (선택)</CardTitle></CardHeader>
          <CardContent>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="예: 환승이 많아요 / 막차가 일찍 끊겨요"
              className="input rounded-xl px-3 py-2.5 text-sm w-full" maxLength={120} />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" size="lg">응답 제출 <ArrowRight size={16} /></Button>
      </form>
    </div>
  );
}

function StarRow({
  value, onChange,
}: { value: 1 | 2 | 3 | 4 | 5; onChange: (n: 1 | 2 | 3 | 4 | 5) => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n as 1 | 2 | 3 | 4 | 5)} aria-label={`${n}점`}>
          <Star size={28}
            className={cn(
              "transition-colors",
              n <= value ? "text-amber-400 fill-amber-400" : "text-[var(--border-strong)]"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function CongestionRow({
  value, onChange,
}: { value: 1 | 2 | 3 | 4 | 5; onChange: (n: 1 | 2 | 3 | 4 | 5) => void }) {
  const colors = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];
  return (
    <div className="flex items-center justify-between gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
          aria-label={`${n}점`}
          className={cn(
            "flex flex-col items-center gap-1 flex-1 px-1 py-3 rounded-xl transition-all",
            n === value ? "bg-[var(--bg-soft)]" : "hover:bg-[var(--bg-soft)]"
          )}
          style={n === value ? { boxShadow: `inset 0 0 0 2px ${colors[n - 1]}` } : undefined}
        >
          <Users
            size={26}
            color={n <= value ? colors[n - 1] : "var(--border-strong)"}
            fill={n <= value ? colors[n - 1] : "none"}
          />
          <span className="text-[11px] font-bold" style={{ color: n <= value ? colors[n - 1] : "var(--text-muted)" }}>
            {n}
          </span>
        </button>
      ))}
    </div>
  );
}
