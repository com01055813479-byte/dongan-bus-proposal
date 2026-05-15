"use client";

import Link from "next/link";
import { BarChart3, TrendingUp, Clock, Bus, Star, ThumbsUp, AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useCommutes } from "@/lib/hooks/useCommutes";
import {
  aggregateOD, aggregateODBidirectional,
  timeBandDistribution, transportModeDistribution,
  avgSatisfaction, avgCurrentMinutes, avgExpressIntent, pctHighIntent,
} from "@/lib/algorithms/odAnalysis";

export default function AnalysisPage() {
  const { entries, userCount, sampleCount, hydrated } = useCommutes();

  const topPairsDirected   = aggregateOD(entries).slice(0, 10);
  const topPairsBidi       = aggregateODBidirectional(entries).slice(0, 8);
  const timeBands          = timeBandDistribution(entries);
  const modes              = transportModeDistribution(entries);
  const satAvg             = avgSatisfaction(entries);
  const minAvg             = avgCurrentMinutes(entries);
  const intentAvg          = avgExpressIntent(entries);
  const highIntentPct      = pctHighIntent(entries);

  const maxTimeCount = Math.max(...Object.values(timeBands), 1);
  const maxModeCount = Math.max(...Object.values(modes), 1);
  const maxPairCount = topPairsBidi[0]?.totalCount ?? 1;

  // 급행 필요성 점수 (단순 휴리스틱)
  // - 만족도 낮을수록 ↑
  // - 평균 소요 시간 길수록 ↑
  // - 급행 의향 높을수록 ↑
  const needScore = Math.round(
    ((5 - satAvg) * 20 + Math.min(minAvg, 60) + (intentAvg - 1) * 25) / 3
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="pt-2 pb-1">
        <p className="text-sm text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
          <BarChart3 size={14} />
          수요 분석
        </p>
        <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
          데이터로 보는
          <br />
          <span className="text-[var(--accent)]">급행 셔틀의 필요성</span>
        </h1>
      </div>

      {/* 응답 현황 */}
      <Card>
        <CardHeader><CardTitle>응답 현황</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat icon={<TrendingUp size={14} />} label="총 응답" value={hydrated ? `${entries.length}건` : "—"} />
            <Stat icon={<Bus size={14} />} label="실제 응답" value={hydrated ? `${userCount}건` : "—"} accent />
            <Stat icon={<Star size={14} />} label="평균 만족도" value={hydrated ? `${satAvg.toFixed(1)}/5` : "—"} />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-3 leading-relaxed">
            시드 샘플 {sampleCount}건 + 실제 사용자 응답을 합쳐 분석합니다.
          </p>
        </CardContent>
      </Card>

      {/* 🔥 급행 필요성 점수 — 정책 제안의 핵심 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--accent)]" />
              급행 셔틀 필요성 점수
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              <>
                <strong className="text-rose-600 dark:text-rose-400">매우 높음</strong> — 급행 셔틀 도입 시 즉각적인 효과 예상
              </>
            ) : needScore >= 50 ? (
              <>
                <strong className="text-orange-600 dark:text-orange-400">높음</strong> — 도입 검토 필요
              </>
            ) : (
              <>
                <strong className="text-emerald-600 dark:text-emerald-400">보통</strong> — 추가 데이터 수집 필요
              </>
            )}
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <MiniStat label="평균 소요" value={`${minAvg.toFixed(0)}분`} />
            <MiniStat label="평균 만족도" value={`${satAvg.toFixed(1)}/5`} />
            <MiniStat label="이용 의향" value={`${intentAvg.toFixed(1)}/5`} />
          </div>
        </CardContent>
      </Card>

      {/* 🚨 정책 결정자에게 보여줄 핵심 증거 */}
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
            num="01"
            title="수요"
            value={`주 ${topPairsBidi[0]?.totalCount ?? 0}회`}
            desc={`가장 인기 구간 (${topPairsBidi[0]?.fromLabel ?? "—"} ↔ ${topPairsBidi[0]?.toLabel ?? "—"})에서 매주 ${topPairsBidi[0]?.totalCount ?? 0}회 이동 발생`}
          />
          <EvidenceRow
            num="02"
            title="소요 시간"
            value={`평균 ${minAvg.toFixed(0)}분`}
            desc="현재 시민이 실제로 측정한 평균 통근 시간 — 직선거리 대비 과다"
          />
          <EvidenceRow
            num="03"
            title="불만족도"
            value={`${satAvg.toFixed(1)}/5`}
            desc={satAvg < 3
              ? "현재 교통수단 만족도가 낮아 개선 시급"
              : "추가 데이터 수집 시 만족도 분포 추세 확인 필요"}
          />
          <EvidenceRow
            num="04"
            title="이용 의향"
            value={`${highIntentPct.toFixed(0)}%`}
            desc={`응답자 중 ${highIntentPct.toFixed(0)}%가 급행 셔틀 도입 시 "꼭 쓰겠다" 또는 "쓸 것 같다"고 답함`}
            highlight
          />
        </CardContent>
      </Card>

      {/* 인기 OD 페어 (양방향) */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--accent)]" />
              가장 많이 이동하는 구간
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPairsBidi.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">데이터 부족</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {topPairsBidi.map((p, i) => {
                const widthPct = (p.totalCount / maxPairCount) * 100;
                return (
                  <div key={`${p.fromPlaceId}|${p.toPlaceId}|${i}`} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)] font-mono w-5 shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-[13px] text-[var(--text-strong)] font-semibold truncate">
                        {p.fromLabel} ↔ {p.toLabel}
                      </span>
                      <span className="text-[var(--text-muted)] tabular-nums">{p.totalCount}회/주</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-soft)] overflow-hidden ml-7">
                      <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${widthPct}%` }} />
                    </div>
                    {(p.avgCurrentMinutes > 0 || p.avgExpressIntent > 0) && (
                      <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] ml-7">
                        {p.avgCurrentMinutes > 0 && <span>⏱ 평균 {p.avgCurrentMinutes.toFixed(0)}분</span>}
                        {p.avgExpressIntent > 0 && <span>👍 의향 {p.avgExpressIntent.toFixed(1)}/5</span>}
                        {p.avgSatisfaction > 0 && <span>⭐ {p.avgSatisfaction.toFixed(1)}/5</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 시간대 분포 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--accent)]" />
              시간대별 이동량
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            {(Object.entries(timeBands) as [string, number][]).map(([band, count]) => {
              const pct = (count / maxTimeCount) * 100;
              const isPeak = band.startsWith("출근") || band.startsWith("퇴근");
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
          <p className="text-[11px] text-[var(--text-muted)] mt-3">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-400 mr-1 align-middle" />
            출퇴근 시간대 = 급행 노선 효과 가장 큰 시간
          </p>
        </CardContent>
      </Card>

      {/* 교통수단 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Bus size={16} className="text-[var(--accent)]" />
              현재 사용하는 교통수단
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            {(Object.entries(modes) as [string, number][])
              .filter(([, c]) => c > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([m, count]) => {
                const pct = (count / maxModeCount) * 100;
                return (
                  <div key={m} className="flex items-center gap-2 text-xs">
                    <span className="w-20 shrink-0 font-semibold text-[var(--text-base)]">{m}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[var(--text-muted)] tabular-nums w-10 text-right">{count}</span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* 제안 페이지 안내 */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-5">
          <p className="text-sm text-[var(--text-base)] leading-relaxed">
            <ThumbsUp className="inline-block mr-1 text-[var(--accent)]" size={14} />
            <strong className="text-[var(--text-strong)]">결론:</strong> 위 데이터를 바탕으로 자동 도출된 추천 급행 셔틀 노선을 확인하고 지지해 주세요.
          </p>
          <Link
            href="/proposal"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90"
          >
            제안 노선 보기 →
          </Link>
        </CardContent>
      </Card>

      {/* 방향별 상세 */}
      <details className="card rounded-2xl px-4 py-3">
        <summary className="text-sm font-semibold text-[var(--text-base)] cursor-pointer">
          방향별 상세 (Top 10)
        </summary>
        <div className="mt-3 flex flex-col gap-1.5 text-xs">
          {topPairsDirected.map((p, i) => (
            <div key={`${p.fromPlaceId}|${p.toPlaceId}|${i}`} className="flex items-center justify-between">
              <span className="text-[var(--text-base)]">
                {i + 1}. {p.fromLabel} → {p.toLabel}
              </span>
              <span className="text-[var(--text-muted)] tabular-nums">{p.totalCount}회/주</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

// ── 보조 컴포넌트 ────────────────────────────────────────────────────
function Stat({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--bg-soft)] rounded-lg py-2 px-2">
      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-bold text-[var(--text-strong)] tabular-nums">{value}</p>
    </div>
  );
}

function EvidenceRow({
  num, title, value, desc, highlight,
}: {
  num: string;
  title: string;
  value: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-3 py-2.5 flex items-start gap-3 ${
        highlight ? "bg-[var(--accent-soft)]" : "bg-[var(--bg-soft)]"
      }`}
    >
      <span className={`text-[10px] font-mono font-bold ${highlight ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"} mt-0.5`}>
        {num}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-xs font-bold ${highlight ? "text-[var(--accent-text)]" : "text-[var(--text-strong)]"}`}>
            {title}
          </p>
          <p className={`text-base font-bold tabular-nums ${highlight ? "text-[var(--accent-text)]" : "text-[var(--text-strong)]"}`}>
            {value}
          </p>
        </div>
        <p className={`text-[11px] mt-0.5 leading-relaxed ${highlight ? "text-[var(--accent-text)] opacity-80" : "text-[var(--text-muted)]"}`}>
          {desc}
        </p>
      </div>
    </div>
  );
}
