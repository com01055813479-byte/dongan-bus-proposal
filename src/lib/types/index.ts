// ─── 통근 설문 ────────────────────────────────────────────────────────────────

/** 시민이 입력하는 출발-도착 데이터 (1건) */
export interface CommuteEntry {
  id: string;
  /** 등록된 거점 id 또는 "other" (직접 입력) */
  fromPlaceId: string;
  /** fromPlaceId === "other" 일 때만 사용자 입력 텍스트 */
  fromCustomText?: string;
  toPlaceId: string;
  toCustomText?: string;
  /** 주로 이동하는 시간대 — 출퇴근 중심으로 단순화 */
  timeBand: TimeBand;
  /** 일주일 평균 이용 횟수 */
  weeklyCount: number;
  /** 현재 사용하는 교통수단 */
  currentMode: TransportMode;
  /** 현재 실제 소요 시간 (분) — 급행 필요성 입증의 핵심 데이터 */
  currentMinutes?: number;
  /** 만족도 (1=매우불편, 5=만족) */
  satisfaction: 1 | 2 | 3 | 4 | 5;
  /** 급행 노선이 생기면 이용 의향 (1=절대 안 씀, 5=꼭 씀) */
  expressIntent?: 1 | 2 | 3 | 4 | 5;
  note?: string;
  createdAt: string;
}

/** 출퇴근 중심 시간대 — 3가지만 */
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

// ─── 노선 제안 ────────────────────────────────────────────────────────────────

export interface ProposedRoute {
  id: string;
  name: string;
  description: string;
  stopIds: string[];
  estimatedMinutes: number;
  savedMinutes: number;
  serviceBands: TimeBand[];
  rationale: string;
}

// ─── OD 페어 ─────────────────────────────────────────────────────────────────

/** 분석 결과: 출발-도착 한 쌍의 누적 수요 */
export interface ODPair {
  fromPlaceId: string;
  toPlaceId: string;
  /** 직접 입력의 경우 라벨 (예: "강남역 (직접입력)") */
  fromLabel?: string;
  toLabel?: string;
  totalCount: number;
  byTimeBand: Partial<Record<TimeBand, number>>;
  avgSatisfaction: number;
  /** 평균 현재 소요 시간 (분) */
  avgCurrentMinutes: number;
  /** 평균 급행 의향 (1-5) */
  avgExpressIntent: number;
}
