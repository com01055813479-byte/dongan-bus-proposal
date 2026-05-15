/**
 * OD(Origin-Destination) 분석 — 통근 설문 데이터를 집계해 인사이트 도출.
 */

import type { CommuteEntry, ODPair, TimeBand, TransportMode } from "@/lib/types";
import { placeLabel } from "@/lib/constants/places";

/** OD 키 (직접 입력은 customText 까지 포함) */
function odPartKey(placeId: string, customText?: string): string {
  if (placeId === "other") return `other:${customText?.trim() ?? ""}`;
  return placeId;
}

/** 모든 OD 페어 집계 (방향 구별) */
export function aggregateOD(entries: CommuteEntry[]): ODPair[] {
  const map = new Map<string, ODPair & { _satSum: number; _satCount: number; _minSum: number; _minCount: number; _intentSum: number; _intentCount: number }>();

  for (const e of entries) {
    const fromKey = odPartKey(e.fromPlaceId, e.fromCustomText);
    const toKey   = odPartKey(e.toPlaceId, e.toCustomText);
    const key = `${fromKey}|>|${toKey}`;

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
        fromPlaceId: e.fromPlaceId,
        toPlaceId: e.toPlaceId,
        fromLabel: placeLabel(e.fromPlaceId, e.fromCustomText),
        toLabel:   placeLabel(e.toPlaceId, e.toCustomText),
        totalCount: e.weeklyCount,
        byTimeBand: { [e.timeBand]: e.weeklyCount },
        avgSatisfaction: e.satisfaction,
        avgCurrentMinutes: 0,
        avgExpressIntent: 0,
        _satSum: e.satisfaction,
        _satCount: 1,
        _minSum: typeof e.currentMinutes === "number" ? e.currentMinutes : 0,
        _minCount: typeof e.currentMinutes === "number" ? 1 : 0,
        _intentSum: typeof e.expressIntent === "number" ? e.expressIntent : 0,
        _intentCount: typeof e.expressIntent === "number" ? 1 : 0,
      });
    }
  }

  return Array.from(map.values())
    .map((p) => ({
      fromPlaceId: p.fromPlaceId,
      toPlaceId:   p.toPlaceId,
      fromLabel:   p.fromLabel,
      toLabel:     p.toLabel,
      totalCount:  p.totalCount,
      byTimeBand:  p.byTimeBand,
      avgSatisfaction:   p._satSum / p._satCount,
      avgCurrentMinutes: p._minCount > 0    ? p._minSum / p._minCount       : 0,
      avgExpressIntent:  p._intentCount > 0 ? p._intentSum / p._intentCount : 0,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}

/** 방향 무관 OD 페어 집계 (왕복 묶음) */
export function aggregateODBidirectional(entries: CommuteEntry[]): ODPair[] {
  const map = new Map<string, ODPair & {
    _satSum: number; _satCount: number;
    _minSum: number; _minCount: number;
    _intentSum: number; _intentCount: number;
  }>();
  for (const e of entries) {
    const fromKey = odPartKey(e.fromPlaceId, e.fromCustomText);
    const toKey   = odPartKey(e.toPlaceId,   e.toCustomText);
    const [a, b] = [fromKey, toKey].sort();
    const key = `${a}|${b}`;
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
      // 정렬한 첫 번째 키를 from 으로 표시
      const fromIsOriginal = a === fromKey;
      map.set(key, {
        fromPlaceId: fromIsOriginal ? e.fromPlaceId : e.toPlaceId,
        toPlaceId:   fromIsOriginal ? e.toPlaceId   : e.fromPlaceId,
        fromLabel:   fromIsOriginal ? placeLabel(e.fromPlaceId, e.fromCustomText) : placeLabel(e.toPlaceId, e.toCustomText),
        toLabel:     fromIsOriginal ? placeLabel(e.toPlaceId, e.toCustomText)     : placeLabel(e.fromPlaceId, e.fromCustomText),
        totalCount: e.weeklyCount,
        byTimeBand: { [e.timeBand]: e.weeklyCount },
        avgSatisfaction: e.satisfaction,
        avgCurrentMinutes: 0,
        avgExpressIntent:  0,
        _satSum: e.satisfaction,
        _satCount: 1,
        _minSum: typeof e.currentMinutes === "number" ? e.currentMinutes : 0,
        _minCount: typeof e.currentMinutes === "number" ? 1 : 0,
        _intentSum: typeof e.expressIntent === "number" ? e.expressIntent : 0,
        _intentCount: typeof e.expressIntent === "number" ? 1 : 0,
      });
    }
  }
  return Array.from(map.values())
    .map((p) => ({
      fromPlaceId: p.fromPlaceId,
      toPlaceId:   p.toPlaceId,
      fromLabel:   p.fromLabel,
      toLabel:     p.toLabel,
      totalCount:  p.totalCount,
      byTimeBand:  p.byTimeBand,
      avgSatisfaction:   p._satSum / p._satCount,
      avgCurrentMinutes: p._minCount > 0    ? p._minSum / p._minCount       : 0,
      avgExpressIntent:  p._intentCount > 0 ? p._intentSum / p._intentCount : 0,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}

/** 시간대별 응답 수 합계 */
export function timeBandDistribution(entries: CommuteEntry[]): Record<TimeBand, number> {
  const out: Record<TimeBand, number> = {
    "출근(06~09)": 0,
    "퇴근(17~21)": 0,
    "기타 시간":   0,
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

/** 전체 평균 만족도 */
export function avgSatisfaction(entries: CommuteEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((s, e) => s + e.satisfaction, 0) / entries.length;
}

/** 전체 평균 현재 소요 시간 */
export function avgCurrentMinutes(entries: CommuteEntry[]): number {
  const valid = entries.filter((e) => typeof e.currentMinutes === "number");
  if (valid.length === 0) return 0;
  return valid.reduce((s, e) => s + (e.currentMinutes ?? 0), 0) / valid.length;
}

/** 전체 평균 급행 이용 의향 */
export function avgExpressIntent(entries: CommuteEntry[]): number {
  const valid = entries.filter((e) => typeof e.expressIntent === "number");
  if (valid.length === 0) return 0;
  return valid.reduce((s, e) => s + (e.expressIntent ?? 0), 0) / valid.length;
}

/** "급행 의향 4점 이상" 응답 비율 (%) */
export function pctHighIntent(entries: CommuteEntry[]): number {
  const valid = entries.filter((e) => typeof e.expressIntent === "number");
  if (valid.length === 0) return 0;
  const high = valid.filter((e) => (e.expressIntent ?? 0) >= 4).length;
  return (high / valid.length) * 100;
}
