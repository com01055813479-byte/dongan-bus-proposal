// ─── 통근 설문 ────────────────────────────────────────────────────────────────

/** 시민이 입력하는 출발-도착 데이터 (1건) */
export interface CommuteEntry {
  id: string;
  fromPlaceId: string;     // PLACES[].id
  toPlaceId: string;
  /** 주로 이동하는 시간대 */
  timeBand: TimeBand;
  /** 일주일 평균 이용 횟수 */
  weeklyCount: number;
  /** 현재 사용하는 교통수단 */
  currentMode: TransportMode;
  /** 만족도 (1=매우불편, 5=만족) */
  satisfaction: 1 | 2 | 3 | 4 | 5;
  note?: string;
  createdAt: string;
}

export type TimeBand =
  | "출근(07~09)"
  | "오전(09~12)"
  | "점심(12~14)"
  | "오후(14~17)"
  | "퇴근(17~20)"
  | "야간(20~24)"
  | "심야(00~07)";

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

/** 동아리에서 분석으로 도출된 추천 급행 노선 (또는 사용자 시뮬레이션 결과) */
export interface ProposedRoute {
  id: string;
  name: string;             // "동안구 익스프레스 A"
  description: string;      // "학원가-범계-평촌 직행"
  stopIds: string[];        // 정차할 거점 (순서대로)
  /** 예상 소요 시간 (분) */
  estimatedMinutes: number;
  /** 예상 시간 단축 효과 (분) */
  savedMinutes: number;
  /** 추천 운영 시간대 */
  serviceBands: TimeBand[];
  /** 도출 근거 (수요 데이터 요약) */
  rationale: string;
}

// ─── OD (Origin-Destination) 페어 ────────────────────────────────────────────

/** 분석 결과: 출발-도착 한 쌍의 누적 수요 */
export interface ODPair {
  fromPlaceId: string;
  toPlaceId: string;
  totalCount: number;
  /** 시간대별 분포 */
  byTimeBand: Partial<Record<TimeBand, number>>;
  /** 평균 만족도 (낮을수록 불만 ↑ 개선 필요 ↑) */
  avgSatisfaction: number;
}
