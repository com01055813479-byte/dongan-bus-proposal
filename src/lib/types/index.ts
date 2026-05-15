// ─── 통근 설문 ────────────────────────────────────────────────────────────────

/** 시민이 입력하는 출발-도착 데이터 (1건) */
export interface CommuteEntry {
  id: string;
  /** 출발지 — 자유 텍스트 (사용자 직접 입력) */
  fromText: string;
  /** 도착지 — 자유 텍스트 */
  toText: string;
  /** 주로 이동하는 시간대 */
  timeBand: TimeBand;
  /** 일주일 평균 이용 횟수 */
  weeklyCount: number;
  /** 현재 사용하는 교통수단 */
  currentMode: TransportMode;
  /** 현재 실제 소요 시간 (분) — 급행 필요성 입증의 핵심 데이터 */
  currentMinutes?: number;
  /** 만족도 (1=매우불편, 5=만족) */
  satisfaction: 1 | 2 | 3 | 4 | 5;
  /** 급행 노선이 생기면 이용 의향 */
  expressIntent?: 1 | 2 | 3 | 4 | 5;
  note?: string;
  createdAt: string;
}

export type TimeBand =
  | "출근(06~09)"
  | "퇴근(17~21)"
  | "기타 시간";

export type TransportMode =
  | "마을버스"
  | "시내버스"
  | "지하철"
  | "도보"
  | "자전거"
  | "자가용"
  | "택시"
  | "기타";

// ─── OD 페어 ─────────────────────────────────────────────────────────────────

export interface ODPair {
  /** 출발지 텍스트 (정규화됨) */
  fromText: string;
  toText: string;
  totalCount: number;
  byTimeBand: Partial<Record<TimeBand, number>>;
  avgSatisfaction: number;
  avgCurrentMinutes: number;
  avgExpressIntent: number;
}

/** 텍스트 정규화 (앞뒤 공백 제거, 연속 공백 1개로) */
export function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}
