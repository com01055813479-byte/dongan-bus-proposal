"use client";

import { useState } from "react";
import {
  BarChart3, Clock, Bus, Star, ThumbsUp, AlertTriangle,
  Sparkles, Info, X, Users, Car,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useCommutes } from "@/lib/hooks/useCommutes";
import {
  timeBandDistribution, missedFreqDistribution, transitMethodDistribution,
  avgCongestion, avgSatisfaction,
  avgExpressIntent, avgMissedScore,
  pctHighIntent, pctHighCongestion, pctMissedBus, pctCarDependent,
} from "@/lib/algorithms/odAnalysis";
import { MISSED_FREQS, TRANSIT_METHODS, isCarDependent } from "@/lib/types";

// ── 점수 산출 가중치 ──────────────────────────────────────────────
const W_CONGESTION = 0.30;
const W_MISSED     = 0.30;
const W_INTENT     = 0.25;
const W_UNSAT      = 0.15;

function calcNeedScore(
  conAvg: number, missedAvg: number, intentAvg: number, satAvg: number,
): number {
  const conComp    = conAvg > 0    ? (conAvg - 1) / 4 * 100 : 0;
  const missedComp = missedAvg; // 이미 0~100
  const intentComp = intentAvg > 0 ? (intentAvg - 1) / 4 * 100 : 0;
  const unsatComp  = satAvg > 0    ? (5 - satAvg) / 4 * 100   : 0;
  return Math.round(
    conComp    * W_CONGESTION +
    missedComp * W_MISSED +
    intentComp * W_INTENT +
    unsatComp  * W_UNSAT
  );
}

export default function AnalysisPage() {
  const { entries, hydrated } = useCommutes();
  const [showFormula, setShowFormula] = useState(false);

  const timeBands = timeBandDistribution(entries);
  const missedDist = missedFreqDistribution(entries);
  const methodDist = transitMethodDistribution(entries);

  const conAvg     = avgCongestion(entries);
  const satAvg     = avgSatisfaction(entries);
  const intentAvg  = avgExpressIntent(entries);
  const missedAvg  = avgMissedScore(entries);
  const highIntent = pctHighIntent(entries);
  const highCon    = pctHighCongestion(entries);
  const missedPct  = pctMissedBus(entries);
  const carPct     = pctCarDependent(entries);

  const maxTimeCount = Math.max(...Object.values(timeBands), 1);
  const maxMissedCount = Math.max(...Object.values(missedDist), 1);
  const maxMethodCount = Math.max(...Object.values(methodDist), 1);

  const hasData = entries.length > 0;
  const needScore = hasData ? calcNeedScore(conAvg, missedAvg, intentAvg, satAvg) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="pt-2 pb-1">
        <p className="text-sm text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
          <BarChart3 size={14} />
          버스 혼잡 분석
        </p>
        <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
          시민 경험으로 보는<br />
          <span className="text-[var(--accent)]">출퇴근 버스 혼잡 실태</span>
        </h1>
      </div>

      {/* 응답 현황 */}
      <Card>
        <CardHeader><CardTitle>응답 현황</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat icon={<Bus size={14} />} label="총 응답" value={hydrated ? `${entries.length}건` : "—"} />
            <Stat icon={<Users size={14} />} label="평균 혼잡도" value={hydrated ? `${conAvg.toFixed(1)}/5` : "—"} accent />
            <Stat icon={<Star size={14} />} label="평균 만족도" value={hydrated ? `${satAvg.toFixed(1)}/5` : "—"} />
          </div>
          {!hasData && hydrated && (
            <p className="text-[11px] text-[var(--text-muted)] mt-3 leading-relaxed text-center">
              아직 응답 데이터가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 급행 필요성 점수 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--accent)]" />
                급행 버스 필요성 점수
              </span>
              <button
                onClick={() => setShowFormula(true)}
                className="text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-1 text-xs font-normal"
              >
                <Info size={14} />
                산출 방식
              </button>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">
              데이터 부족 — 점수 산출 불가
            </p>
          ) : (
            <>
              <div className="flex items-end justify-center gap-1 my-2">
                <span className="text-5xl font-black text-[var(--accent)] tabular-nums leading-none">{needScore}</span>
                <span className="text-lg text-[var(--text-muted)] font-bold pb-1">/ 100</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[var(--bg-soft)] overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(0, Math.min(100, needScore))}%`,
                    background: needScore >= 70 ? "#ef4444" : needScore >= 50 ? "#f97316" : "#22c55e",
                  }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed text-center">
                {needScore >= 70 ? (
                  <><strong className="text-rose-600 dark:text-rose-400">매우 높음</strong> — 급행 버스 도입 시 즉각적인 효과 예상</>
                ) : needScore >= 50 ? (
                  <><strong className="text-orange-600 dark:text-orange-400">높음</strong> — 도입 검토 필요</>
                ) : needScore >= 30 ? (
                  <><strong className="text-amber-600 dark:text-amber-400">보통</strong> — 추가 데이터 수집 필요</>
                ) : (
                  <><strong className="text-emerald-600 dark:text-emerald-400">낮음</strong> — 현재 시스템 충분</>
                )}
              </p>
              <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                <MiniStat label="혼잡도" value={`${conAvg.toFixed(1)}/5`} highlight />
                <MiniStat label="만차경험" value={`${missedPct.toFixed(0)}%`} />
                <MiniStat label="만족도" value={`${satAvg.toFixed(1)}/5`} />
                <MiniStat label="이용 의향" value={`${intentAvg.toFixed(1)}/5`} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 핵심 근거 */}
      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-500" />
                핵심 근거 (시청 제안용)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            <EvidenceRow
              num="01" title="혼잡 심각"
              value={`${highCon.toFixed(0)}%`}
              desc={`응답자 중 ${highCon.toFixed(0)}%가 출퇴근 버스가 "만원 이상"(4~5점)이라고 답변`}
              highlight
            />
            <EvidenceRow
              num="02" title="만차로 못 탄 경험"
              value={`${missedPct.toFixed(0)}%`}
              desc={`응답자 중 ${missedPct.toFixed(0)}%가 버스가 만원이라 못 타거나 그냥 보낸 경험이 있다고 답변`}
              highlight
            />
            <EvidenceRow
              num="03" title="직행 부재 → 차량 의존"
              value={`${carPct.toFixed(0)}%`}
              desc={`응답자 중 ${carPct.toFixed(0)}%가 직행 버스가 없어 가족 차량·택시·자가용에 의존`}
              highlight
            />
            <EvidenceRow
              num="04" title="급행 이용 의향"
              value={`${highIntent.toFixed(0)}%`}
              desc={`응답자 중 ${highIntent.toFixed(0)}%가 급행 버스 도입 시 "꼭 쓰겠다" 또는 "쓸 것 같다"고 답변`}
            />
          </CardContent>
        </Card>
      )}

      {/* 만차 경험 분포 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-500" />
              만차로 못 탄 경험 빈도
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">데이터 부족</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {MISSED_FREQS.map((f) => {
                const count = missedDist[f];
                const pct = (count / maxMissedCount) * 100;
                const isBad = f !== "없음";
                return (
                  <div key={f} className="flex items-center gap-2 text-xs">
                    <span className={`w-20 shrink-0 ${isBad ? "font-bold text-[var(--text-strong)]" : "text-[var(--text-base)]"}`}>
                      {f}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
                      <div className={`h-full rounded-full ${isBad ? "bg-rose-400" : "bg-emerald-400"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[var(--text-muted)] tabular-nums w-10 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이동 수단 분포 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Car size={16} className="text-[var(--accent)]" />
              학원가 ↔ 역 이동 수단
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">데이터 부족</p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                {TRANSIT_METHODS.map((m) => {
                  const count = methodDist[m];
                  const pct = (count / maxMethodCount) * 100;
                  const car = isCarDependent(m);
                  return (
                    <div key={m} className="flex items-center gap-2 text-xs">
                      <span className={`w-24 shrink-0 ${car ? "font-bold text-[var(--text-strong)]" : "text-[var(--text-base)]"}`}>
                        {m}
                      </span>
                      <div className="flex-1 h-2.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
                        <div className={`h-full rounded-full ${car ? "bg-rose-400" : "bg-[var(--accent)]"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[var(--text-muted)] tabular-nums w-10 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-3 leading-relaxed text-center">
                직행 버스가 없어 <strong className="text-rose-500">{carPct.toFixed(0)}%</strong>가 가족 차량·택시·자가용에 의존합니다.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* 시간대 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--accent)]" />
              혼잡 집중 시간대
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            {(Object.entries(timeBands) as [string, number][]).map(([band, count]) => {
              const pct = (count / maxTimeCount) * 100;
              const isPeak = band.startsWith("출근") || band.startsWith("퇴근") || band.startsWith("학원");
              return (
                <div key={band} className="flex items-center gap-2 text-xs">
                  <span className={`w-24 shrink-0 ${isPeak ? "font-bold text-[var(--text-strong)]" : "text-[var(--text-base)]"}`}>
                    {band}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
                    <div className={`h-full rounded-full ${isPeak ? "bg-rose-400" : "bg-[var(--accent)]"}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[var(--text-muted)] tabular-nums w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 결론 */}
      <Card>
        <CardContent className="flex flex-col gap-2 py-5">
          <p className="text-sm text-[var(--text-base)] leading-relaxed">
            <ThumbsUp className="inline-block mr-1 text-[var(--accent)]" size={14} />
            <strong className="text-[var(--text-strong)]">결론:</strong> 위 데이터를 바탕으로 출퇴근 버스 혼잡 완화를 위한 급행 버스 도입을 안양시청에 제안할 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* 산출 방식 모달 */}
      {showFormula && <FormulaModal onClose={() => setShowFormula(false)} />}
    </div>
  );
}

function FormulaModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card rounded-2xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[var(--text-strong)]">필요성 점수 산출 방식</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-soft)]" aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
          네 가지 데이터를 0~100점 척도로 정규화한 후, 가중치를 곱해 합산한 값입니다.
          가장 직접적인 증거인 <strong>혼잡도·만차 경험·이용 의향</strong>에 큰 가중치를 부여합니다.
        </p>

        <div className="flex flex-col gap-3 text-xs">
          <FormulaRow
            label="① 혼잡도 (30%)"
            formula="(평균 혼잡도 − 1) ÷ 4 × 100"
            example="혼잡도 5점이면 100점, 1점이면 0점"
            color="#ef4444"
          />
          <FormulaRow
            label="② 만차 경험 (30%)"
            formula="없음 0 · 가끔 33 · 주1~2회 67 · 거의매일 100 의 평균"
            example="만차 경험이 잦을수록 100점에 가까움"
            color="#e11d48"
          />
          <FormulaRow
            label="③ 이용 의향 (25%)"
            formula="(평균 의향 − 1) ÷ 4 × 100"
            example="의향 5점이면 100점, 1점이면 0점"
            color="#a855f7"
          />
          <FormulaRow
            label="④ 불만족도 (15%)"
            formula="(5 − 평균 만족도) ÷ 4 × 100"
            example="만족도 1점이면 100점, 5점이면 0점"
            color="#f97316"
          />
        </div>

        <div className="bg-[var(--accent-soft)] rounded-xl px-3 py-3 mt-4">
          <p className="text-xs font-bold text-[var(--accent-text)] mb-1">최종 점수</p>
          <p className="text-[11px] font-mono text-[var(--accent-text)] leading-relaxed">
            점수 = ①×0.30 + ②×0.30 + ③×0.25 + ④×0.15
          </p>
        </div>

        <div className="mt-4 text-[11px] text-[var(--text-muted)] leading-relaxed space-y-2">
          <p>
            <strong className="text-[var(--text-base)]">왜 혼잡도·만차·의향에 가중치를?</strong>{" "}
            혼잡도·만차 경험 = 시민이 직접 겪는 문제 강도. 의향 = &ldquo;만들면 정말 쓰겠다&rdquo; 라는 가장 강력한 정책 신호.
          </p>
          <p><strong className="text-[var(--text-base)]">점수 해석</strong></p>
          <ul className="ml-4 list-disc space-y-0.5">
            <li>70 이상: 매우 높음 — 즉각 도입 검토 권장</li>
            <li>50~69: 높음 — 추가 분석과 함께 검토</li>
            <li>30~49: 보통 — 데이터 더 모은 후 재평가</li>
            <li>30 미만: 낮음 — 현재 시스템으로 충분</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90"
        >
          확인
        </button>
      </div>
    </div>
  );
}

function FormulaRow({ label, formula, example, color }: { label: string; formula: string; example: string; color: string }) {
  return (
    <div className="rounded-xl p-3 bg-[var(--bg-soft)] border-l-4" style={{ borderColor: color }}>
      <p className="text-xs font-bold text-[var(--text-strong)]">{label}</p>
      <p className="text-[11px] font-mono text-[var(--text-base)] mt-1">{formula}</p>
      <p className="text-[10px] text-[var(--text-muted)] mt-1 italic">예: {example}</p>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? "bg-[var(--accent-soft)]" : "card"}`}>
      <p className={`text-xs flex items-center justify-center gap-1 ${accent ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"}`}>
        {icon} {label}
      </p>
      <p className={`text-xl font-bold mt-1 tabular-nums ${accent ? "text-[var(--accent-text)]" : "text-[var(--text-strong)]"}`}>
        {value}
      </p>
    </div>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg py-2 px-2 ${highlight ? "bg-[var(--accent-soft)]" : "bg-[var(--bg-soft)]"}`}>
      <p className={`text-[10px] ${highlight ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"}`}>{label}</p>
      <p className={`text-sm font-bold tabular-nums ${highlight ? "text-[var(--accent-text)]" : "text-[var(--text-strong)]"}`}>{value}</p>
    </div>
  );
}

function EvidenceRow({
  num, title, value, desc, highlight,
}: { num: string; title: string; value: string; desc: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 flex items-start gap-3 ${highlight ? "bg-[var(--accent-soft)]" : "bg-[var(--bg-soft)]"}`}>
      <span className={`text-[10px] font-mono font-bold ${highlight ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"} mt-0.5`}>{num}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-xs font-bold ${highlight ? "text-[var(--accent-text)]" : "text-[var(--text-strong)]"}`}>{title}</p>
          <p className={`text-base font-bold tabular-nums ${highlight ? "text-[var(--accent-text)]" : "text-[var(--text-strong)]"}`}>{value}</p>
        </div>
        <p className={`text-[11px] mt-0.5 leading-relaxed ${highlight ? "text-[var(--accent-text)] opacity-80" : "text-[var(--text-muted)]"}`}>{desc}</p>
      </div>
    </div>
  );
}
