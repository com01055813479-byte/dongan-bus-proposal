// ─── 버스 통근 설문 ──────────────────────────────────────────────────────────

export interface CommuteEntry {
  id: string;
  /** 주로 버스를 타는 시간대 */
  timeBand: TimeBand;
  /** 일주일 평균 버스 이용 횟수 (왕복 1회 = 2회) */
  weeklyCount: number;
  /** 학원가↔역을 현재 주로 어떻게 이동하는지 */
  transitMethod: TransitMethod;
  /** 출퇴근 시간 체감 혼잡도 (1=한산, 5=극도로 만원) */
  congestion: 1 | 2 | 3 | 4 | 5;
  /** 만차로 못 타거나 그냥 보낸 경험 빈도 */
  missedBusFreq: MissedFreq;
  /** 현재 버스 통근 만족도 (1=매우불편, 5=만족) */
  satisfaction: 1 | 2 | 3 | 4 | 5;
  /** 급행 버스 이용 의향 (1=절대 안씀, 5=꼭 씀) */
  expressIntent: 1 | 2 | 3 | 4 | 5;
  note?: string;
  createdAt: string;
}

export type TimeBand =
  | "출근(06~09)"
  | "퇴근(17~21)"
  | "학원 하원(21~23)"
  | "기타 시간";

export type MissedFreq =
  | "없음"
  | "가끔"
  | "보통"
  | "흔함";

export const MISSED_FREQS: MissedFreq[] = ["없음", "가끔", "보통", "흔함"];

export type TransitMethod =
  | "버스"
  | "가족 차량 픽업"
  | "택시"
  | "자가용"
  | "기타";

export const TRANSIT_METHODS: TransitMethod[] = [
  "버스", "가족 차량 픽업", "택시", "자가용", "기타",
];

/** 직행 버스 부재로 차량(가족 픽업·택시·자가용)에 의존하는 수단인지 */
export function isCarDependent(m: TransitMethod): boolean {
  return m === "가족 차량 픽업" || m === "택시" || m === "자가용";
}

/** 만차 경험 빈도 → 0~100 점수 (분석용) */
export function missedFreqScore(f: MissedFreq): number {
  switch (f) {
    case "없음": return 0;
    case "가끔": return 33;
    case "보통": return 67;
    case "흔함": return 100;
  }
}

/** 텍스트 정규화 — 앞뒤 공백 제거, 연속 공백 1개로 */
export function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}
