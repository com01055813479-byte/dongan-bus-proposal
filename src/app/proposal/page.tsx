"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lightbulb, ThumbsUp, Bus, TrendingDown, ArrowRight, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useCommutes } from "@/lib/hooks/useCommutes";
import { aggregateODBidirectional } from "@/lib/algorithms/odAnalysis";
import { PLACE_MAP, CATEGORY_LABEL } from "@/lib/constants/places";
import { dataStore } from "@/lib/storage";

const SUPPORT_KEY = "route-supports-v1";

/**
 * 분석 결과 → 추천 셔틀 노선 도출.
 * 양쪽 거점이 모두 동안구 내(좌표 있음) 또는 한쪽이 4호선역인 경우 → 셔틀 후보.
 * 동안구 외부 ↔ 외부는 셔틀 직접 운영 대상 아님 → 제외 (하지만 분석엔 포함).
 */
function generateProposals(entries: ReturnType<typeof useCommutes>["entries"]) {
  const pairs = aggregateODBidirectional(entries).slice(0, 10);

  return pairs
    .map((p, i) => {
      const from = PLACE_MAP[p.fromPlaceId];
      const to = PLACE_MAP[p.toPlaceId];
      // 좌표 없으면 (직접입력) 제외
      if (!from?.lat || !to?.lat) return null;
      // (동안구 외부 거점은 더 이상 등록되어 있지 않음)

      const distKm = haversineKm(from.lat, from.lng!, to.lat, to.lng!);
      // 실측 평균이 있으면 그 값을, 없으면 휴리스틱
      const measured = p.avgCurrentMinutes;
      const currentMinutes = measured > 0 ? Math.round(measured) : Math.round(distKm * 6 + 3);
      const expressMinutes = Math.round(distKm * 2.5 + 1);

      return {
        id: `route-${i + 1}`,
        name: `동안구 익스프레스 ${String.fromCharCode(65 + i)}`,
        stopIds: [p.fromPlaceId, p.toPlaceId],
        fromLabel: p.fromLabel ?? from.name,
        toLabel:   p.toLabel ?? to.name,
        fromCat: from.category,
        toCat: to.category,
        currentMinutes,
        expressMinutes,
        savedMinutes: Math.max(0, currentMinutes - expressMinutes),
        weeklyDemand: p.totalCount,
        avgSatisfaction: p.avgSatisfaction,
        avgExpressIntent: p.avgExpressIntent,
        measured: measured > 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 6);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

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
          <Lightbulb size={14} />
          제안 노선
        </p>
        <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
          데이터로 뽑은
          <br />
          <span className="text-[var(--accent)]">추천 급행 셔틀 노선</span>
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
          시민 출퇴근 설문에서 수요가 많은 구간을 직행 셔틀 노선으로 변환했습니다.
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
        proposals.map((p) => (
          <RouteCard
            key={p.id}
            proposal={p}
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
            <Bus size={16} /> 출퇴근 설문 참여 <ArrowRight size={14} />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function RouteCard({
  proposal, supportCount, supported, onSupport,
}: {
  proposal: NonNullable<ReturnType<typeof generateProposals>>[number];
  supportCount: number;
  supported: boolean;
  onSupport: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center justify-between gap-2 w-full">
            <span className="flex items-center gap-2">
              <Bus size={16} className="text-[var(--accent)]" />
              {proposal.name}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)]">
              주 {proposal.weeklyDemand}회 수요
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <StopBadge category={proposal.fromCat}>{proposal.fromLabel}</StopBadge>
          <ArrowRight size={14} className="text-[var(--text-muted)]" />
          <StopBadge category={proposal.toCat}>{proposal.toLabel}</StopBadge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <TimeBox
            label={proposal.measured ? "현재 (실측 평균)" : "현재 (추정)"}
            value={`${proposal.currentMinutes}분`}
            muted
          />
          <TimeBox label="제안 급행" value={`${proposal.expressMinutes}분`} accent />
          <TimeBox
            label="단축 시간"
            value={`-${proposal.savedMinutes}분`}
            color="text-emerald-600 dark:text-emerald-400"
            icon={<TrendingDown size={12} />}
          />
        </div>

        {proposal.avgExpressIntent > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] px-1">
            <Users size={12} />
            응답자 평균 이용 의향:{" "}
            <span className="font-bold text-[var(--accent-text)]">
              {proposal.avgExpressIntent.toFixed(1)} / 5
            </span>
          </div>
        )}

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

function StopBadge({
  category, children,
}: {
  category?: keyof typeof CATEGORY_LABEL;
  children: React.ReactNode;
}) {
  const color = category ? CATEGORY_LABEL[category].color : "#9ca3af";
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-lg flex-1 text-center truncate"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {children}
    </span>
  );
}

function TimeBox({
  label, value, muted, accent, color, icon,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl px-2 py-2 ${accent ? "bg-[var(--accent-soft)]" : "bg-[var(--bg-soft)]"}`}>
      <p className={`text-[10px] flex items-center justify-center gap-1 ${muted ? "text-[var(--text-muted)]" : "text-[var(--text-base)]"}`}>
        {icon} {label}
      </p>
      <p
        className={`text-base font-bold mt-0.5 tabular-nums ${
          color ?? (accent ? "text-[var(--accent-text)]" : "text-[var(--text-strong)]")
        }`}
      >
        {value}
      </p>
    </div>
  );
}
