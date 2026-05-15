/**
 * 시드 샘플 통근 데이터 — 출퇴근 시간 중심.
 * 첫 방문 시에도 분석/제안 페이지가 비어 보이지 않도록 가짜 데이터를 깔아둠.
 */

import type { CommuteEntry } from "@/lib/types";

const now = new Date();
const iso = (offset: number) => new Date(now.getTime() - offset * 3600_000).toISOString();

let _id = 0;
function E(
  from: string,
  to: string,
  timeBand: CommuteEntry["timeBand"],
  weeklyCount: number,
  currentMode: CommuteEntry["currentMode"],
  satisfaction: CommuteEntry["satisfaction"],
  currentMinutes: number,
  expressIntent: 1 | 2 | 3 | 4 | 5,
): CommuteEntry {
  return {
    id: `seed-${_id}`,
    fromPlaceId: from,
    toPlaceId: to,
    timeBand,
    weeklyCount,
    currentMode,
    satisfaction,
    currentMinutes,
    expressIntent,
    createdAt: iso(_id++),
  };
}

export const SAMPLE_COMMUTES: CommuteEntry[] = [
  // ── 출근 (동안구 → 동안구 내 4호선역) ─────────────────────────────
  E("biSan",     "indeokwon", "출근(06~09)", 5, "마을버스", 2, 22, 5),
  E("biSan",     "indeokwon", "출근(06~09)", 5, "마을버스", 1, 25, 5),
  E("biSan",     "beomgye",   "출근(06~09)", 4, "마을버스", 2, 18, 4),
  E("buheung",   "indeokwon", "출근(06~09)", 5, "도보",     3, 15, 3),
  E("dalan",     "pyeongchon","출근(06~09)", 5, "마을버스", 2, 17, 4),
  E("hogye",     "pyeongchon","출근(06~09)", 5, "도보",     3, 12, 3),
  E("pyeongchon-shintosi", "pyeongchon", "출근(06~09)", 5, "도보", 4, 8, 2),
  E("pyeongchon-shintosi", "beomgye",    "출근(06~09)", 3, "도보", 3, 10, 3),
  E("gwanyang",  "indeokwon", "출근(06~09)", 5, "도보",     4, 6, 2),
  E("shinchon",  "beomgye",   "출근(06~09)", 5, "도보",     4, 8, 2),

  // ── 출근 (동안구 → 동안구 외부 — 4호선 환승 전 셔틀 수요) ────────
  E("biSan",                "gangnam",    "출근(06~09)", 5, "마을버스", 1, 65, 5),
  E("hogye",                "gangnam",    "출근(06~09)", 5, "마을버스", 2, 60, 5),
  E("pyeongchon-shintosi", "gangnam",    "출근(06~09)", 5, "지하철",   3, 55, 4),
  E("gwanyang",             "sadang",     "출근(06~09)", 5, "지하철",   3, 40, 4),
  E("biSan",                "sadang",     "출근(06~09)", 5, "마을버스", 2, 50, 5),
  E("hogye",                "yangjae",    "출근(06~09)", 4, "마을버스", 2, 55, 5),
  E("pyeongan",             "city-hall",  "출근(06~09)", 5, "지하철",   3, 70, 4),
  E("hogye",                "pangyo",     "출근(06~09)", 4, "시내버스", 2, 50, 4),
  E("biSan",                "anyang-station", "출근(06~09)", 4, "마을버스", 2, 20, 4),
  E("buheung",              "yeouido",    "출근(06~09)", 5, "시내버스", 2, 75, 4),

  // ── 퇴근 (역방향) ──────────────────────────────────────────────────
  E("indeokwon", "biSan",     "퇴근(17~21)", 5, "마을버스", 2, 22, 5),
  E("beomgye",   "biSan",     "퇴근(17~21)", 4, "마을버스", 2, 18, 4),
  E("indeokwon", "buheung",   "퇴근(17~21)", 5, "도보",     3, 15, 3),
  E("pyeongchon","hogye",     "퇴근(17~21)", 5, "마을버스", 2, 13, 4),
  E("pyeongchon","dalan",     "퇴근(17~21)", 4, "마을버스", 2, 17, 4),
  E("gangnam",   "biSan",     "퇴근(17~21)", 5, "마을버스", 1, 70, 5),
  E("gangnam",   "hogye",     "퇴근(17~21)", 5, "마을버스", 2, 65, 5),
  E("sadang",    "biSan",     "퇴근(17~21)", 5, "마을버스", 2, 55, 5),
  E("city-hall", "pyeongan",  "퇴근(17~21)", 5, "지하철",   3, 75, 4),

  // ── 학생 등하원 (기타 시간) ─────────────────────────────────────────
  E("hogye",      "hagwon-main", "기타 시간", 5, "마을버스", 2, 12, 4),
  E("hogye",      "hagwon-main", "기타 시간", 5, "마을버스", 2, 14, 4),
  E("hagwon-main","hogye",       "기타 시간", 5, "마을버스", 1, 15, 5),
  E("hagwon-main","beomgye",     "기타 시간", 4, "도보",     2, 10, 3),
  E("hagwon-back","beomgye",     "기타 시간", 4, "마을버스", 2, 13, 4),
  E("guiin-school","hagwon-main","기타 시간", 5, "도보",     3, 8, 3),
  E("biSan",      "hagwon-main", "기타 시간", 3, "시내버스", 2, 20, 4),
  E("pyeongchon", "hagwon-main", "기타 시간", 4, "마을버스", 2, 12, 4),
  E("beomgye",    "hagwon-main", "기타 시간", 4, "마을버스", 2, 14, 4),
];
