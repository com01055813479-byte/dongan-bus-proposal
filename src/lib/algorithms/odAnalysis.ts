/**
 * OD(Origin-Destination) 분석 — 통근 설문 데이터를 집계해 인사이트 도출.
 */

import type { CommuteEntry, ODPair, TimeBand, TransportMode } from "@/lib/types";

/** OD 키 생성 (방향 무관 vs 방향 구별) */
function odKey(from: string, to: string, undirected = false): string {
  if (undirected) {
    return [from, to].sort().join("|");
  }
  return `${from}→${to}`;
}

/** 모든 OD 페어 집계 (방향 구별) */
export function aggregateOD(entries: CommuteEntry[]): ODPair[] {
  const map = new Map<string, ODPair & { _satSum: number; _satCount: number }>();

  for (const e of entries) {
    const key = odKey(e.fromPlaceId, e.toPlaceId);
    const existing = map.get(key);
    if (existing) {
      existing.totalCount += e.weeklyCount;
      existing.byTimeBand[e.timeBand] = (existing.byTimeBand[e.timeBand] ?? 0) + e.weeklyCount;
      existing._satSum += e.satisfaction;
      existing._satCount += 1;
    } else {
      map.set(key, {
        fromPlaceId: e.fromPlaceId,
        toPlaceId: e.toPlaceId,
        totalCount: e.weeklyCount,
        byTimeBand: { [e.timeBand]: e.weeklyCount },
        avgSatisfaction: e.satisfaction,
        _satSum: e.satisfaction,
        _satCount: 1,
      });
    }
  }

  return Array.from(map.values())
    .map((p) => ({
      fromPlaceId: p.fromPlaceId,
      toPlaceId: p.toPlaceId,
      totalCount: p.totalCount,
      byTimeBand: p.byTimeBand,
      avgSatisfaction: p._satSum / p._satCount,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}

/** 방향 무관 OD 페어 집계 (왕복 묶음) */
export function aggregateODBidirectional(entries: CommuteEntry[]): Array<ODPair & {
  /** 양방향 합산 시 작은 ID 측을 fromPlaceId 로 통일 */
  reversePresent: boolean;
}> {
  const map = new Map<string, ODPair & { _satSum: number; _satCount: number; reversePresent: boolean }>();
  for (const e of entries) {
    const [a, b] = [e.fromPlaceId, e.toPlaceId].sort();
    const reverse = a !== e.fromPlaceId;
    const key = `${a}|${b}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalCount += e.weeklyCount;
      existing.byTimeBand[e.timeBand] = (existing.byTimeBand[e.timeBand] ?? 0) + e.weeklyCount;
      existing._satSum += e.satisfaction;
      existing._satCount += 1;
      if (reverse) existing.reversePresent = true;
    } else {
      map.set(key, {
        fromPlaceId: a,
        toPlaceId: b,
        totalCount: e.weeklyCount,
        byTimeBand: { [e.timeBand]: e.weeklyCount },
        avgSatisfaction: e.satisfaction,
        _satSum: e.satisfaction,
        _satCount: 1,
        reversePresent: reverse,
      });
    }
  }
  return Array.from(map.values())
    .map((p) => ({
      fromPlaceId: p.fromPlaceId,
      toPlaceId: p.toPlaceId,
      totalCount: p.totalCount,
      byTimeBand: p.byTimeBand,
      avgSatisfaction: p._satSum / p._satCount,
      reversePresent: p.reversePresent,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}

/** 시간대별 응답 수 합계 (그래프용) */
export function timeBandDistribution(entries: CommuteEntry[]): Record<TimeBand, number> {
  const out: Record<TimeBand, number> = {
    "심야(00~07)": 0, "출근(07~09)": 0, "오전(09~12)": 0, "점심(12~14)": 0,
    "오후(14~17)": 0, "퇴근(17~20)": 0, "야간(20~24)": 0,
  };
  for (const e of entries) out[e.timeBand] += e.weeklyCount;
  return out;
}

/** 교통수단별 응답 수 합계 (그래프용) */
export function transportModeDistribution(entries: CommuteEntry[]): Record<TransportMode, number> {
  const out: Record<TransportMode, number> = {
    "마을버스": 0, "시내버스": 0, "지하철": 0, "도보": 0,
    "자전거": 0, "자가용": 0, "택시": 0, "기타": 0,
  };
  for (const e of entries) out[e.currentMode] += e.weeklyCount;
  return out;
}

/** 전체 평균 만족도 */
export function avgSatisfaction(entries: CommuteEntry[]): number {
  if (entries.length === 0) return 0;
  const sum = entries.reduce((s, e) => s + e.satisfaction, 0);
  return sum / entries.length;
}

/** 노선 후보 자동 도출 — Top N OD 페어를 그대로 노선으로 추천 */
export function deriveRouteCandidates(entries: CommuteEntry[], topN = 5) {
  const pairs = aggregateODBidirectional(entries);
  return pairs.slice(0, topN);
}
