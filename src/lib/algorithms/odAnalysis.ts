/**
 * 버스 통근 설문 분석.
 * "버스가 얼마나 오래 걸리고, 얼마나 만원이고, 급행 수요가 있는가" 에 집중.
 */

import type { CommuteEntry, TimeBand, MissedFreq, TransitMethod } from "@/lib/types";
import { MISSED_FREQS, TRANSIT_METHODS, missedFreqScore, isCarDependent } from "@/lib/types";

/** 시간대별 응답 수 합계 (이용 횟수 가중) */
export function timeBandDistribution(entries: CommuteEntry[]): Record<TimeBand, number> {
  const out: Record<TimeBand, number> = {
    "출근(06~09)": 0, "퇴근(17~21)": 0, "학원 하원(21~23)": 0, "기타 시간": 0,
  };
  for (const e of entries) out[e.timeBand] += e.weeklyCount;
  return out;
}

/** 만차 경험 빈도 분포 (응답자 수) */
export function missedFreqDistribution(entries: CommuteEntry[]): Record<MissedFreq, number> {
  const out: Record<MissedFreq, number> = {
    "없음": 0, "가끔": 0, "주 1~2회": 0, "흔함": 0,
  };
  for (const e of entries) {
    if (e.missedBusFreq && MISSED_FREQS.includes(e.missedBusFreq)) out[e.missedBusFreq] += 1;
  }
  return out;
}

/** 이동 수단 분포 (응답자 수) */
export function transitMethodDistribution(entries: CommuteEntry[]): Record<TransitMethod, number> {
  const out = Object.fromEntries(TRANSIT_METHODS.map((m) => [m, 0])) as Record<TransitMethod, number>;
  for (const e of entries) {
    if (e.transitMethod && TRANSIT_METHODS.includes(e.transitMethod)) out[e.transitMethod] += 1;
  }
  return out;
}

/** 직행 부재로 차량(가족 픽업·택시·자가용)에 의존하는 응답자 비율 */
export function pctCarDependent(entries: CommuteEntry[]): number {
  const valid = entries.filter((e) => !!e.transitMethod);
  if (valid.length === 0) return 0;
  const yes = valid.filter((e) => isCarDependent(e.transitMethod)).length;
  return (yes / valid.length) * 100;
}

export function avgCongestion(entries: CommuteEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((s, e) => s + e.congestion, 0) / entries.length;
}

export function avgSatisfaction(entries: CommuteEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((s, e) => s + e.satisfaction, 0) / entries.length;
}

export function avgExpressIntent(entries: CommuteEntry[]): number {
  const valid = entries.filter((e) => typeof e.expressIntent === "number");
  if (valid.length === 0) return 0;
  return valid.reduce((s, e) => s + (e.expressIntent ?? 0), 0) / valid.length;
}

/** 만차 경험 평균 점수 (0~100) */
export function avgMissedScore(entries: CommuteEntry[]): number {
  const valid = entries.filter((e) => !!e.missedBusFreq);
  if (valid.length === 0) return 0;
  return valid.reduce((s, e) => s + missedFreqScore(e.missedBusFreq), 0) / valid.length;
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

/** 만차로 못 타거나 그냥 보낸 경험이 "있다"고 답한 비율 (없음 제외) */
export function pctMissedBus(entries: CommuteEntry[]): number {
  const valid = entries.filter((e) => !!e.missedBusFreq);
  if (valid.length === 0) return 0;
  const yes = valid.filter((e) => e.missedBusFreq !== "없음").length;
  return (yes / valid.length) * 100;
}
