"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPinned, ArrowRight, CheckCircle2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PLACES } from "@/lib/constants/places";
import { useCommutes } from "@/lib/hooks/useCommutes";
import type { TimeBand, TransportMode } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const TIME_BANDS: TimeBand[] = ["출근(06~09)", "퇴근(17~21)", "기타 시간"];
const MODES: TransportMode[] = [
  "마을버스", "시내버스", "지하철", "도보", "자전거", "자가용", "택시", "기타",
];
const PLACE_SUGGESTIONS = PLACES.filter((p) => p.id !== "other").map((p) => p.name);

export default function SurveyPage() {
  const { add } = useCommutes();

  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [timeBand, setTimeBand] = useState<TimeBand>("출근(06~09)");
  const [weeklyCount, setWeeklyCount] = useState(5);
  const [mode, setMode] = useState<TransportMode>("마을버스");
  const [currentMinutes, setCurrentMinutes] = useState(20);
  const [satisfaction, setSatisfaction] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [expressIntent, setExpressIntent] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const f = fromText.trim();
    const t = toText.trim();
    if (!f) return setError("출발지를 입력해 주세요");
    if (!t) return setError("도착지를 입력해 주세요");
    if (f === t) return setError("출발지와 도착지가 같습니다");
    try {
      await add({
        fromText: f,
        toText: t,
        timeBand,
        weeklyCount,
        currentMode: mode,
        currentMinutes,
        satisfaction,
        expressIntent,
        note: note || undefined,
      });
      try { localStorage.setItem("survey-completed-v3", "1"); } catch {}
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    }
  }

  function handleAnother() {
    setSubmitted(false);
    setFromText(""); setToText("");
    setNote("");
    setSatisfaction(3); setExpressIntent(4);
    setWeeklyCount(5); setCurrentMinutes(20);
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-5">
        <div className="pt-2 pb-1">
          <p className="text-sm text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
            <MapPinned size={14} /> 출퇴근 설문
          </p>
          <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
            응답해 주셔서<br />
            <span className="text-[var(--accent)]">감사합니다!</span>
          </h1>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <p className="text-base font-semibold text-[var(--text-strong)]">
              응답이 저장되었습니다
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleAnother} variant="primary">
            <MapPinned size={16} /> 한 번 더 응답
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
          <MapPinned size={14} /> 출퇴근 설문
        </p>
        <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
          평소 출퇴근 경로를<br />
          <span className="text-[var(--accent)]">알려주세요</span>
        </h1>
      </div>

      <datalist id="place-suggestions">
        {PLACE_SUGGESTIONS.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader><CardTitle>출발지·도착지</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <FormBlock label="출발지">
              <input
                type="text"
                value={fromText}
                onChange={(e) => setFromText(e.target.value)}
                placeholder="예: 비산동, 평촌역, 호계동 ○○아파트"
                list="place-suggestions"
                maxLength={80}
                className="input rounded-xl px-3 py-2.5 text-sm w-full"
                autoComplete="off"
              />
            </FormBlock>
            <FormBlock label="도착지">
              <input
                type="text"
                value={toText}
                onChange={(e) => setToText(e.target.value)}
                placeholder="예: 강남역, 평촌학원가, 안양시청"
                list="place-suggestions"
                maxLength={80}
                className="input rounded-xl px-3 py-2.5 text-sm w-full"
                autoComplete="off"
              />
            </FormBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>이 경로의 주된 이동 시간</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>현재 보통 몇 분 걸리나요?</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">대기·환승·도보 포함</span>
              <span className="text-2xl font-bold text-[var(--text-strong)]">{currentMinutes}분</span>
            </div>
            <input type="range" min={5} max={120} step={5} value={currentMinutes}
              onChange={(e) => setCurrentMinutes(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--accent)]" />
            <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-1">
              <span>5분</span><span>60분</span><span>120분</span>
            </div>
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

        <Button type="submit" size="lg">
          응답 제출 <ArrowRight size={16} />
        </Button>
      </form>
    </div>
  );
}

function FormBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-[var(--text-base)]">{label}</label>
      {children}
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
