/**
 * 시드 샘플 통근 데이터.
 * 사이트 첫 방문 시에도 분석/제안 페이지가 비어 보이지 않도록 가짜 데이터를 깔아둠.
 * 실제 사용자 응답이 누적되면 함께 분석됨.
 */

import type { CommuteEntry } from "@/lib/types";

const now = new Date();
const iso = (offset: number) => new Date(now.getTime() - offset * 3600_000).toISOString();

// 빠른 작성용 헬퍼
let _id = 0;
function E(
  from: string,
  to: string,
  timeBand: CommuteEntry["timeBand"],
  weeklyCount: number,
  currentMode: CommuteEntry["currentMode"],
  satisfaction: CommuteEntry["satisfaction"],
  hourOffset = _id,
): CommuteEntry {
  return {
    id: `seed-${_id++}`,
    fromPlaceId: from,
    toPlaceId: to,
    timeBand,
    weeklyCount,
    currentMode,
    satisfaction,
    createdAt: iso(hourOffset),
  };
}

/**
 * 가상의 시드 데이터 — 동안구민의 흔한 통근/통학 패턴 반영.
 */
export const SAMPLE_COMMUTES: CommuteEntry[] = [
  // 학생 등하원 — 학원가 ↔ 주거지 / 지하철역
  E("hogye", "hagwon-main", "오후(14~17)", 5, "마을버스", 2),
  E("hogye", "hagwon-main", "오후(14~17)", 5, "마을버스", 2),
  E("hagwon-main", "hogye", "야간(20~24)", 5, "마을버스", 1),
  E("hagwon-main", "hogye", "야간(20~24)", 5, "마을버스", 2),
  E("hagwon-main", "beomgye", "야간(20~24)", 4, "도보", 2),
  E("hagwon-main", "beomgye", "야간(20~24)", 3, "마을버스", 1),
  E("hagwon-back", "beomgye", "야간(20~24)", 4, "마을버스", 2),
  E("guiin-school", "hagwon-main", "오후(14~17)", 5, "도보", 3),
  E("biSan", "hagwon-main", "오후(14~17)", 3, "시내버스", 2),

  // 출근 — 주거지 → 4호선역
  E("biSan", "indeokwon", "출근(07~09)", 5, "마을버스", 2),
  E("biSan", "indeokwon", "출근(07~09)", 5, "마을버스", 1),
  E("biSan", "beomgye", "출근(07~09)", 4, "마을버스", 2),
  E("hogye", "pyeongchon", "출근(07~09)", 5, "마을버스", 2),
  E("hogye", "pyeongchon", "출근(07~09)", 5, "도보", 3),
  E("pyeongchon-shintosi", "pyeongchon", "출근(07~09)", 5, "도보", 4),
  E("pyeongchon-shintosi", "beomgye", "출근(07~09)", 3, "도보", 3),

  // 퇴근 — 역 → 주거지
  E("indeokwon", "biSan", "퇴근(17~20)", 5, "마을버스", 2),
  E("indeokwon", "biSan", "퇴근(17~20)", 5, "마을버스", 1),
  E("beomgye", "biSan", "퇴근(17~20)", 4, "마을버스", 2),
  E("pyeongchon", "hogye", "퇴근(17~20)", 5, "마을버스", 2),
  E("pyeongchon", "hogye", "퇴근(17~20)", 4, "도보", 3),

  // 출퇴근 — 안양종합운동장
  E("anyang-stadium", "indeokwon", "출근(07~09)", 5, "시내버스", 2),
  E("anyang-stadium", "beomgye", "퇴근(17~20)", 3, "시내버스", 2),

  // 시청 / 관공서 업무
  E("pyeongchon-shintosi", "anyang-cityhall", "오전(09~12)", 1, "도보", 4),
  E("hogye", "anyang-cityhall", "오전(09~12)", 1, "마을버스", 3),
  E("biSan", "anyang-cityhall", "오전(09~12)", 1, "마을버스", 2),

  // 쇼핑 / 여가
  E("hogye", "beomgye-shopping", "오후(14~17)", 2, "마을버스", 3),
  E("pyeongchon-shintosi", "beomgye-shopping", "오후(14~17)", 2, "도보", 4),
  E("biSan", "beomgye-shopping", "오후(14~17)", 1, "시내버스", 3),
  E("hogye", "central-park", "오전(09~12)", 1, "도보", 4),

  // 학원가 → 평촌역/인덕원 (지하철 환승)
  E("hagwon-main", "pyeongchon", "야간(20~24)", 4, "마을버스", 2),
  E("hagwon-main", "indeokwon", "야간(20~24)", 3, "마을버스", 1),

  // 평촌역 → 학원가 (등원)
  E("pyeongchon", "hagwon-main", "오후(14~17)", 4, "마을버스", 2),
  E("beomgye", "hagwon-main", "오후(14~17)", 4, "마을버스", 2),
  E("indeokwon", "hagwon-main", "오후(14~17)", 2, "마을버스", 1),
];
