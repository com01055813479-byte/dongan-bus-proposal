"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPinned, ArrowRight, CheckCircle2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PLACES, CATEGORY_LABEL, type Place } from "@/lib/constants/places";
import { useCommutes } from "@/lib/hooks/useCommutes";
import type { TimeBand, TransportMode } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const TIME_BANDS: TimeBand[] = [
  "출근(07~09)", "오전(09~12)", "점심(12~14)",
  "오후(14~17)", "퇴근(17~20)", "야간(20~24)", "심야(00~07)",
];

const MODES: TransportMode[] = [
  "마을버스", "시내버스", "지하철", "도보", "자전거", "자가용", "택시", "기타",
];

export default function SurveyPage() {
  const { add } = useCommutes();

  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [timeBand, setTimeBand] = useState<TimeBand>("출근(07~09)");
  const [weeklyCount, setWeeklyCount] = useState(5);
  const [mode, setMode] = useState<TransportMode>("마을버스");
  const [satisfaction, setSatisfaction] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fromId) return setError("출발지를 선택해 주세요");
    if (!toId) return setError("도착지를 선택해 주세요");
    if (fromId === toId) return setError("출발지와 도착지가 같습니다");
    try {
      await add({
        fromPlaceId: fromId,
        toPlaceId: toId,
        timeBand,
        weeklyCount,
        currentMode: mode,
        satisfaction,
        note: note || undefined,
      });
      try { localStorage.setItem("survey-completed-v1", "1"); } catch {}
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    }
  }

  function handleAnother() {
    setSubmitted(false);
    setFromId("");
    setToId("");
    setNote("");
    setSatisfaction(3);
    setWeeklyCount(5);
  }

  // ── 완료 화면 ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col gap-5">
        <div className="pt-2 pb-1">
          <p className="text-sm text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
            <MapPinned size={14} />
            통근 설문
          </p>
          <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
            응답해 주셔서
            <br />
            <span className="text-[var(--accent)]">감사합니다!</span>
          </h1>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <p className="text-base font-semibold text-[var(--text-strong)]">
              응답이 저장되었습니다
            </p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm leading-relaxed">
              여러 출발-도착 패턴이 있다면 추가로 응답해 주세요. 더 많은 데이터가 모일수록
              제안 노선이 정확해집니다.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleAnother} variant="primary">
            <MapPinned size={16} />
            한 번 더 응답
          </Button>
          <Link href="/analysis" className="flex">
            <button className="card w-full rounded-2xl px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[var(--bg-soft)] transition-colors">
              분석 결과 보기
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── 설문 폼 ────────────────────────────────────────────────────────
  const inputCls = "input rounded-xl px-3 py-2.5 text-sm w-full";

  return (
    <div className="flex flex-col gap-5">
      <div className="pt-2 pb-1">
        <p className="text-sm text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
          <MapPinned size={14} />
          통근 설문
        </p>
        <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
          어디에서 어디로
          <br />
          <span className="text-[var(--accent)]">자주 가시나요?</span>
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          1분이면 끝납니다. 동안구 급행 셔틀 노선 도출에 직접 반영됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 출발지 / 도착지 */}
        <Card>
          <CardHeader>
            <CardTitle>출발-도착 거점</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <PlaceSelect label="출발지" value={fromId} onChange={setFromId} excludeId={toId} />
            <PlaceSelect label="도착지" value={toId} onChange={setToId} excludeId={fromId} />
          </CardContent>
        </Card>

        {/* 시간대 */}
        <Card>
          <CardHeader>
            <CardTitle>주로 이동하는 시간대</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIME_BANDS.map((tb) => (
                <button
                  key={tb}
                  type="button"
                  onClick={() => setTimeBand(tb)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                    timeBand === tb
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text-base)]"
                  )}
                >
                  {tb}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 주 빈도 */}
        <Card>
          <CardHeader>
            <CardTitle>일주일 평균 이용 횟수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">현재</span>
              <span className="text-2xl font-bold text-[var(--text-strong)]">{weeklyCount}회</span>
            </div>
            <input
              type="range"
              min={1}
              max={14}
              value={weeklyCount}
              onChange={(e) => setWeeklyCount(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
              <span>1회</span>
              <span>7회</span>
              <span>14회</span>
            </div>
          </CardContent>
        </Card>

        {/* 교통수단 */}
        <Card>
          <CardHeader>
            <CardTitle>현재 사용하는 교통수단</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                    mode === m
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text-base)]"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 만족도 */}
        <Card>
          <CardHeader>
            <CardTitle>현재 이동의 만족도</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSatisfaction(n as 1 | 2 | 3 | 4 | 5)}
                  aria-label={`${n}점`}
                >
                  <Star
                    size={28}
                    className={cn(
                      "transition-colors",
                      n <= satisfaction
                        ? "text-amber-400 fill-amber-400"
                        : "text-[var(--border-strong)]"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-[var(--text-muted)] mt-2">
              {["매우 불편", "불편", "보통", "만족", "매우 만족"][satisfaction - 1]}
            </p>
          </CardContent>
        </Card>

        {/* 메모 */}
        <Card>
          <CardHeader>
            <CardTitle>추가로 하고 싶은 말 (선택)</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 환승이 너무 많아요 / 막차가 일찍 끊겨요"
              className={inputCls}
              maxLength={120}
            />
          </CardContent>
        </Card>

        {/* 에러 + 제출 */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" size="lg">
          응답 제출
          <ArrowRight size={16} />
        </Button>
      </form>
    </div>
  );
}

// ── 거점 선택 (카테고리별 그룹) ────────────────────────────────────────
function PlaceSelect({
  label,
  value,
  onChange,
  excludeId,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  excludeId?: string;
}) {
  const grouped: Record<string, Place[]> = {};
  for (const p of PLACES) {
    if (p.id === excludeId) continue;
    (grouped[p.category] ??= []).push(p);
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-[var(--text-base)]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input rounded-xl px-3 py-2.5 text-sm"
      >
        <option value="">— 선택 —</option>
        {Object.entries(grouped).map(([cat, ps]) => (
          <optgroup key={cat} label={CATEGORY_LABEL[cat as Place["category"]].label}>
            {ps.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
