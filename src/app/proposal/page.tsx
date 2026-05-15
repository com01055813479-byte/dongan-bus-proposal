"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lightbulb, ThumbsUp, Bus, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useCommutes } from "@/lib/hooks/useCommutes";
import { aggregateRoutes } from "@/lib/algorithms/odAnalysis";
import { dataStore } from "@/lib/storage";
import type { RouteStat } from "@/lib/types";

const SUPPORT_KEY = "route-supports-v2";

/**
 * 제안 노선 도출:
 * 혼잡도 + 수요 + 의향을 가중평균해 우선순위 점수를 계산.
 * 점수 높은 노선 = 급행 셔틀 도입 시급.
 */
function priorityScore(r: RouteStat): number {
  const con    = (r.avgCongestion - 1) / 4 * 100;       // 0~100
  const demand = Math.min(r.totalCount / 30, 1) * 100;  // 주 30회 이상이면 만점
  const intent = r.avgExpressIntent > 0 ? (r.avgExpressIntent - 1) / 4 * 100 : 50;
  return Math.round(con * 0.4 + demand * 0.3 + intent * 0.3);
}

function generateProposals(entries: ReturnType<typeof useCommutes>["entries"]) {
  const routes = aggregateRoutes(entries);
  return routes
    .map((r, i) => ({
      id: `route-${i + 1}`,
      ...r,
      priority: priorityScore(r),
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6);
}

const CONGESTION_LABELS = ["한산함", "여유 있음", "보통", "만원", "극도로 만원"];

export default function ProposalPage() {
  const { entries, hydrated } = useCommutes();
  const proposals = generateProposals(entries);

  const [supports, setSupports] = useState<Record<string, number>>({});
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    dataStore.read<{ counts: Record<string, number>; mine: string[] }>(SUPPORT_KEY).then((data) => {
      if (data) {
        setSupports(data.counts ?? {});
        setMyVotes(new Set(data.mine ?? []));
      }
    });
  }, []);

  function toggleSupport(routeId: string) {
    setSupports((prev) => {
      const next = { ...prev };
      const mine = new Set(myVotes);
      if (mine.has(routeId)) {
        mine.delete(routeId);
        next[routeId] = Math.max(0, (next[routeId] ?? 1) - 1);
      } else {
        mine.add(routeId);
        next[routeId] = (next[routeId] ?? 0) + 1;
      }
      setMyVotes(mine);
      dataStore.write(SUPPORT_KEY, { counts: next, mine: Array.from(mine) });
      return next;
    });
  }

  const totalSupport = Object.values(supports).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="pt-2 pb-1">
        <p className="text-sm text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
          <Lightbulb size={14} /> 제안 노선
        </p>
        <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
          시민 응답으로 도출된<br />
          <span className="text-[var(--accent)]">급행 셔틀 도입 우선순위</span>
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
          혼잡도 + 수요 + 이용 의향을 종합해 우선순위가 높은 노선/구간 순으로 제안합니다.
          지지 버튼을 눌러 동안구청 제안에 힘을 보태주세요.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs text-[var(--text-muted)]">총 지지 서명</p>
            <p className="text-2xl font-bold text-[var(--text-strong)] tabular-nums mt-0.5">{totalSupport}명</p>
          </div>
          <ThumbsUp size={32} className="text-[var(--accent)]" />
        </CardContent>
      </Card>

      {!hydrated ? (
        <p className="text-center text-sm text-[var(--text-muted)] py-6">불러오는 중...</p>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-sm text-[var(--text-muted)]">
              아직 분석할 데이터가 부족합니다.{" "}
              <Link href="/survey" className="text-[var(--accent-text)] font-semibold underline">
                통근 설문
              </Link>
              에 응답해 주세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        proposals.map((p, idx) => (
          <RouteCard
            key={p.id}
            rank={idx + 1}
            route={p}
            supportCount={supports[p.id] ?? 0}
            supported={myVotes.has(p.id)}
            onSupport={() => toggleSupport(p.id)}
          />
        ))
      )}

      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-5 text-center">
          <p className="text-sm text-[var(--text-base)]">아직 응답하지 않으셨다면?</p>
          <Link
            href="/survey"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90"
          >
            <Bus size={16} /> 출퇴근 혼잡 설문 참여 <ArrowRight size={14} />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function RouteCard({
  rank, route, supportCount, supported, onSupport,
}: {
  rank: number;
  route: RouteStat & { id: string; priority: number };
  supportCount: number;
  supported: boolean;
  onSupport: () => void;
}) {
  const conColor = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"]
    [Math.round(route.avgCongestion) - 1] ?? "#9ca3af";
  const conLabel = CONGESTION_LABELS[Math.round(route.avgCongestion) - 1] ?? "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center justify-between gap-2 w-full">
            <span className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--text-muted)]">#{rank}</span>
              <Bus size={16} className="text-[var(--accent)]" />
              <span className="text-sm">{route.routeText}</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] shrink-0">
              우선순위 {route.priority}
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* 혼잡도 강조 */}
        <div
          className="rounded-xl px-3 py-2.5 flex items-center justify-between"
          style={{ background: `${conColor}15` }}
        >
          <div className="flex items-center gap-2">
            <Users size={20} style={{ color: conColor }} />
            <div>
              <p className="text-[10px] text-[var(--text-muted)]">시민 평가 혼잡도</p>
              <p className="text-sm font-bold" style={{ color: conColor }}>
                {conLabel}
              </p>
            </div>
          </div>
          <span className="text-2xl font-black tabular-nums" style={{ color: conColor }}>
            {route.avgCongestion.toFixed(1)}
          </span>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="응답 수" value={`${route.responseCount}명`} />
          <Stat label="주 이용량" value={`${route.totalCount}회`} />
          <Stat label="이용 의향" value={route.avgExpressIntent > 0 ? `${route.avgExpressIntent.toFixed(1)}/5` : "—"} accent />
        </div>

        {/* 지지 버튼 */}
        <button
          onClick={onSupport}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            supported
              ? "bg-emerald-500 text-white hover:bg-emerald-400"
              : "bg-[var(--bg-soft)] text-[var(--text-base)] hover:bg-[var(--border)]"
          }`}
        >
          <ThumbsUp size={14} className={supported ? "fill-current" : ""} />
          {supported ? "지지 중" : "이 노선 지지하기"}
          <span className="text-xs opacity-75 tabular-nums">({supportCount})</span>
        </button>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg px-2 py-2 ${accent ? "bg-[var(--accent-soft)]" : "bg-[var(--bg-soft)]"}`}>
      <p className={`text-[10px] ${accent ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"}`}>{label}</p>
      <p className={`text-sm font-bold tabular-nums ${accent ? "text-[var(--accent-text)]" : "text-[var(--text-strong)]"}`}>{value}</p>
    </div>
  );
}
