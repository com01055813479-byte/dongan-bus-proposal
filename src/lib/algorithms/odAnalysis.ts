/**
 * 노선/구간별 혼잡도 분석.
 * "어느 노선이 얼마나 만원인가" 라는 직접적인 증거에 집중.
 */

import type { CommuteEntry, RouteStat, TimeBand, TransportMode } from "@/lib/types";
import { normalizeText } from "@/lib/types";

/** routeText 별로 통계 집계 */
export function aggregateRoutes(entries: CommuteEntry[]): RouteStat[] {
  type Acc = RouteStat & {
    _conSum: number; _conCount: number;
    _satSum: number; _satCount: number;
    _minSum: number; _minCount: number;
    _intentSum: number; _intentCount: number;
  };
  const map = new Map<string, Acc>();

  for (const e of entries) {
    const key = normalizeText(e.routeText);
    if (!key) continue;

    const existing = map.get(key);
    if (existing) {
      existing.totalCount += e.weeklyCount;
      existing.responseCount += 1;
      existing.byTimeBand[e.timeBand] = (existing.byTimeBand[e.timeBand] ?? 0) + e.weeklyCount;
      existing._conSum += e.congestion;
      existing._conCount += 1;
      existing._satSum += e.satisfaction;
      existing._satCount += 1;
      if (typeof e.currentMinutes === "number") {
        existing._minSum += e.currentMinutes;
        existing._minCount += 1;
      }
      if (typeof e.expressIntent === "number") {
        existing._intentSum += e.expressIntent;
        existing._intentCount += 1;
      }
    } else {
      map.set(key, {
        routeText: key,
        totalCount: e.weeklyCount,
        responseCount: 1,
        avgCongestion: e.congestion,
        avgSatisfaction: e.satisfaction,
        avgCurrentMinutes: 0,
        avgExpressIntent: 0,
        byTimeBand: { [e.timeBand]: e.weeklyCount },
        _conSum: e.congestion, _conCount: 1,
        _satSum: e.satisfaction, _satCount: 1,
        _minSum: typeof e.currentMinutes === "number" ? e.currentMinutes : 0,
        _minCount: typeof e.currentMinutes === "number" ? 1 : 0,
        _intentSum: typeof e.expressIntent === "number" ? e.expressIntent : 0,
        _intentCount: typeof e.expressIntent === "number" ? 1 : 0,
      });
    }
  }

  return Array.from(map.values())
    .map((p) => ({
      routeText: p.routeText,
      totalCount: p.totalCount,
      responseCount: p.responseCount,
      avgCongestion:    p._conSum / p._conCount,
      avgSatisfaction:  p._satSum / p._satCount,
      avgCurrentMinutes: p._minCount > 0    ? p._minSum / p._minCount       : 0,
      avgExpressIntent:  p._intentCount > 0 ? p._intentSum / p._intentCount : 0,
      byTimeBand: p.byTimeBand,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}

/** 시간대별 응답 수 합계 */
export function timeBandDistribution(entries: CommuteEntry[]): Record<TimeBand, number> {
  const out: Record<TimeBand, number> = {
    "출근(06~09)": 0, "퇴근(17~21)": 0, "기타 시간": 0,
  };
  for (const e of entries) out[e.timeBand] += e.weeklyCount;
  return out;
}

/** 교통수단별 응답 수 합계 */
export function transportModeDistribution(entries: CommuteEntry[]): Record<TransportMode, number> {
  const out: Record<TransportMode, number> = {
    "마을버스": 0, "시내버스": 0, "지하철": 0, "도보": 0,
    "자전거": 0, "자가용": 0, "택시": 0, "기타": 0,
  };
  for (const e of entries) out[e.currentMode] += e.weeklyCount;
  return out;
}

export function avgCongestion(entries: CommuteEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((s, e) => s + e.congestion, 0) / entries.length;
}

export function avgSatisfaction(entries: CommuteEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((s, e) => s + e.satisfaction, 0) / entries.length;
}

export function avgCurrentMinutes(entries: CommuteEntry[]): number {
  const valid = entries.filter((e) => typeof e.currentMinutes === "number");
  if (valid.length === 0) return 0;
  return valid.reduce((s, e) => s + (e.currentMinutes ?? 0), 0) / valid.length;
}

export function avgExpressIntent(entries: CommuteEntry[]): number {
  const valid = entries.filter((e) => typeof e.expressIntent === "number");
  if (valid.length === 0) return 0;
  return valid.reduce((s, e) => s + (e.expressIntent ?? 0), 0) / valid.length;
}

export function pctHighIntent(entries: CommuteEntry[]): number {
  const valid = entries.filter((e) => typeof e.expressIntent === "number");
  if (valid.length === 0) return 0;
  const high = valid.filter((e) => (e.expressIntent ?? 0) >= 4).length;
  return (high / valid.length) * 100;
}

export function pctHighCongestion(entries: CommuteEntry[]): number {
  if (entries.length === 0) return 0;
  const high = entries.filter((e) => e.congestion >= 4).length;
  return (high / entries.length) * 100;
}
