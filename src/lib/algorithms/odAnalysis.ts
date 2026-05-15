/**
 * OD(Origin-Destination) 분석 — 자유 텍스트 기반.
 * 같은 거점이라도 표기가 다를 수 있어 normalizeText 로 정리한 후 집계.
 */

import type { CommuteEntry, ODPair, TimeBand, TransportMode } from "@/lib/types";
import { normalizeText } from "@/lib/types";

/** 모든 OD 페어 집계 (방향 구별) */
export function aggregateOD(entries: CommuteEntry[]): ODPair[] {
  const map = new Map<string, ODPair & {
    _satSum: number; _satCount: number;
    _minSum: number; _minCount: number;
    _intentSum: number; _intentCount: number;
  }>();

  for (const e of entries) {
    const from = normalizeText(e.fromText);
    const to   = normalizeText(e.toText);
    if (!from || !to) continue;
    const key = `${from}|>|${to}`;

    const existing = map.get(key);
    if (existing) {
      existing.totalCount += e.weeklyCount;
      existing.byTimeBand[e.timeBand] = (existing.byTimeBand[e.timeBand] ?? 0) + e.weeklyCount;
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
        fromText: from,
        toText: to,
        totalCount: e.weeklyCount,
        byTimeBand: { [e.timeBand]: e.weeklyCount },
        avgSatisfaction: e.satisfaction,
        avgCurrentMinutes: 0,
        avgExpressIntent: 0,
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
      fromText: p.fromText,
      toText: p.toText,
      totalCount: p.totalCount,
      byTimeBand: p.byTimeBand,
      avgSatisfaction:   p._satSum / p._satCount,
      avgCurrentMinutes: p._minCount > 0    ? p._minSum / p._minCount       : 0,
      avgExpressIntent:  p._intentCount > 0 ? p._intentSum / p._intentCount : 0,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}

/** 방향 무관 OD 페어 집계 */
export function aggregateODBidirectional(entries: CommuteEntry[]): ODPair[] {
  const map = new Map<string, ODPair & {
    _satSum: number; _satCount: number;
    _minSum: number; _minCount: number;
    _intentSum: number; _intentCount: number;
  }>();

  for (const e of entries) {
    const from = normalizeText(e.fromText);
    const to   = normalizeText(e.toText);
    if (!from || !to) continue;
    const [a, b] = [from, to].sort();
    const key = `${a}|<>|${b}`;

    const existing = map.get(key);
    if (existing) {
      existing.totalCount += e.weeklyCount;
      existing.byTimeBand[e.timeBand] = (existing.byTimeBand[e.timeBand] ?? 0) + e.weeklyCount;
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
        fromText: a, toText: b,
        totalCount: e.weeklyCount,
        byTimeBand: { [e.timeBand]: e.weeklyCount },
        avgSatisfaction: e.satisfaction,
        avgCurrentMinutes: 0,
        avgExpressIntent: 0,
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
      fromText: p.fromText,
      toText: p.toText,
      totalCount: p.totalCount,
      byTimeBand: p.byTimeBand,
      avgSatisfaction:   p._satSum / p._satCount,
      avgCurrentMinutes: p._minCount > 0    ? p._minSum / p._minCount       : 0,
      avgExpressIntent:  p._intentCount > 0 ? p._intentSum / p._intentCount : 0,
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
