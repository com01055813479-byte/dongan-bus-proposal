"use client";

import Link from "next/link";
import { BarChart3, TrendingUp, Clock, Bus, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useCommutes } from "@/lib/hooks/useCommutes";
import { PLACE_MAP } from "@/lib/constants/places";
import {
  aggregateOD,
  aggregateODBidirectional,
  timeBandDistribution,
  transportModeDistribution,
  avgSatisfaction,
} from "@/lib/algorithms/odAnalysis";

export default function AnalysisPage() {
  const { entries, userCount, sampleCount, hydrated } = useCommutes();

  const topPairsDirected   = aggregateOD(entries).slice(0, 10);
  const topPairsBidi       = aggregateODBidirectional(entries).slice(0, 8);
  const timeBands          = timeBandDistribution(entries);
  const modes              = transportModeDistribution(entries);
  const satAvg             = avgSatisfaction(entries);

  const maxTimeCount = Math.max(...Object.values(timeBands), 1);
  const maxModeCount = Math.max(...Object.values(modes), 1);
  const maxPairCount = topPairsBidi[0]?.totalCount ?? 1;

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
          <span className="text-[var(--accent)]">동안구 통근 패턴</span>
        </h1>
      </div>

      {/* 응답 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>응답 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat
              icon={<TrendingUp size={14} />}
              label="총 응답"
              value={hydrated ? `${entries.length}건` : "—"}
            />
            <Stat
              icon={<Bus size={14} />}
              label="내 응답"
              value={hydrated ? `${userCount}건` : "—"}
              accent
            />
            <Stat
              icon={<Star size={14} />}
              label="평균 만족도"
              value={hydrated ? `${satAvg.toFixed(1)}/5` : "—"}
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-3 leading-relaxed">
            시드 샘플 데이터 {sampleCount}건 + 사용자 응답이 함께 분석됩니다.
          </p>
        </CardContent>
      </Card>

      {/* 인기 OD 페어 (양방향) */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--accent)]" />
              가장 많이 이동하는 구간 (양방향)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPairsBidi.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">
              아직 데이터가 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {topPairsBidi.map((p, i) => {
                const fromName = PLACE_MAP[p.fromPlaceId]?.name ?? "—";
                const toName   = PLACE_MAP[p.toPlaceId]?.name ?? "—";
                const widthPct = (p.totalCount / maxPairCount) * 100;
                return (
                  <div key={`${p.fromPlaceId}|${p.toPlaceId}`} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)] font-mono w-5 shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-[13px] text-[var(--text-strong)] font-semibold truncate">
                        {fromName} ↔ {toName}
                      </span>
                      <span className="text-[var(--text-muted)] tabular-nums">{p.totalCount}회/주</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-soft)] overflow-hidden ml-7">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 시간대별 분포 */}
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
                    <div
                      className={`h-full rounded-full transition-all ${isPeak ? "bg-rose-400" : "bg-[var(--accent)]"}`}
                      style={{ width: `${pct}%` }}
                    />
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

      {/* 교통수단 분포 */}
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
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[var(--text-muted)] tabular-nums w-10 text-right">{count}</span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* 인사이트 → 제안 페이지로 */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-5">
          <p className="text-sm text-[var(--text-base)] leading-relaxed">
            <strong className="text-[var(--text-strong)]">인사이트:</strong> 가장 인기 있는{" "}
            {topPairsBidi.length > 0 ? (
              <>
                <span className="text-[var(--accent-text)] font-semibold">
                  {PLACE_MAP[topPairsBidi[0].fromPlaceId]?.name} ↔ {PLACE_MAP[topPairsBidi[0].toPlaceId]?.name}
                </span>{" "}
              </>
            ) : "구간 "}
            구간이 현재 마을버스로만 연결되어 있다면, 급행 셔틀이 가장 큰 효과를 낼 수 있습니다.
          </p>
          <Link
            href="/proposal"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            제안 노선 보기
            →
          </Link>
        </CardContent>
      </Card>

      {/* 상위 방향별 페어 (디버그 / 부가 정보) */}
      <details className="card rounded-2xl px-4 py-3">
        <summary className="text-sm font-semibold text-[var(--text-base)] cursor-pointer">
          방향별 상세 (Top 10)
        </summary>
        <div className="mt-3 flex flex-col gap-1.5 text-xs">
          {topPairsDirected.map((p, i) => (
            <div key={`${p.fromPlaceId}|${p.toPlaceId}`} className="flex items-center justify-between">
              <span className="text-[var(--text-base)]">
                {i + 1}. {PLACE_MAP[p.fromPlaceId]?.name} → {PLACE_MAP[p.toPlaceId]?.name}
              </span>
              <span className="text-[var(--text-muted)] tabular-nums">{p.totalCount}회/주</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? "bg-[var(--accent-soft)]" : "card"}`}>
      <p className={`text-xs flex items-center justify-center gap-1 ${accent ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"}`}>
        {icon}
        {label}
      </p>
      <p className={`text-xl font-bold mt-1 tabular-nums ${accent ? "text-[var(--accent-text)]" : "text-[var(--text-strong)]"}`}>
        {value}
      </p>
    </div>
  );
}
