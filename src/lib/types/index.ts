// ─── 통근 설문 ────────────────────────────────────────────────────────────────

export interface CommuteEntry {
  id: string;
  /** 자주 이용하는 버스 노선/구간 — 자유 텍스트 */
  routeText: string;
  /** 이용 시간대 */
  timeBand: TimeBand;
  /** 그 구간의 혼잡도 (1=한산, 5=극도로 만원) */
  congestion: 1 | 2 | 3 | 4 | 5;
  /** 일주일 평균 이용 횟수 */
  weeklyCount: number;
  /** 현재 사용하는 교통수단 */
  currentMode: TransportMode;
  /** 현재 실제 소요 시간 (분) — 선택 */
  currentMinutes?: number;
  /** 만족도 (1=매우불편, 5=만족) */
  satisfaction: 1 | 2 | 3 | 4 | 5;
  /** 급행 셔틀 이용 의향 (1=절대 안씀, 5=꼭 씀) — 선택 */
  expressIntent?: 1 | 2 | 3 | 4 | 5;
  note?: string;
  createdAt: string;
}

export type TimeBand =
  | "출근(06~09)"
  | "퇴근(17~21)"
  | "기타 시간";

export type TransportMode =
  | "버스"
  | "지하철"
  | "도보"
  | "자전거"
  | "자동차"
  | "헬리콥터"
  | "UFO"
  | "기타";

// ─── 노선/구간 통계 ──────────────────────────────────────────────────────────

export interface RouteStat {
  /** 노선/구간 텍스트 (정규화됨) */
  routeText: string;
  /** 누적 이용량 (주간 횟수 합계) */
  totalCount: number;
  /** 평균 혼잡도 1~5 */
  avgCongestion: number;
  /** 평균 만족도 1~5 */
  avgSatisfaction: number;
  /** 평균 현재 소요 시간 (분) */
  avgCurrentMinutes: number;
  /** 평균 급행 이용 의향 1~5 */
  avgExpressIntent: number;
  /** 응답 건수 */
  responseCount: number;
  /** 시간대별 분포 */
  byTimeBand: Partial<Record<TimeBand, number>>;
}

/** 텍스트 정규화 — 앞뒤 공백 제거, 연속 공백 1개로 */
export function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}
