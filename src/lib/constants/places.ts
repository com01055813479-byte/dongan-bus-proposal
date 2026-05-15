/**
 * 통근 설문에서 선택 가능한 거점.
 *  - 동안구 내: 주요 시설/주거지/지하철역/사거리 (셔틀 출/도착지)
 *  - 동안구 외부: 출퇴근 목적지 (강남, 사당 등) — 셔틀이 직접 안 가도 4호선 환승 패턴 분석용
 *  - "기타" (직접 입력): 위 목록에 없는 장소
 */

export type PlaceCategory =
  | "subway"      // 4호선 역
  | "academy"     // 학원가
  | "residence"   // 주거지/마을
  | "office"      // 관공서
  | "park"        // 공원/여가
  | "facility"    // 기타 시설/상권
  | "outside"     // 동안구 외부 (서울/경기)
  | "other";      // 직접 입력

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  description?: string;
  /** 위경도 — "outside"/"other" 카테고리는 null */
  lat: number | null;
  lng: number | null;
  /** true 면 동안구 외부 (셔틀이 직접 가지 않고 4호선 환승 패턴 분석용) */
  external?: boolean;
}

export const PLACES: Place[] = [
  // ─── 동안구 내 4호선 역 ──────────────────────────────────────────────
  { id: "indeokwon",  name: "인덕원역",  category: "subway", description: "4호선 환승 거점", lat: 37.4014, lng: 126.9521 },
  { id: "pyeongchon", name: "평촌역",    category: "subway", description: "4호선",           lat: 37.3895, lng: 126.9527 },
  { id: "beomgye",    name: "범계역",    category: "subway", description: "4호선·시청",     lat: 37.3956, lng: 126.9543 },

  // ─── 동안구 내 학원가/학교 ───────────────────────────────────────────
  { id: "hagwon-main",  name: "평촌학원가 (메인)", category: "academy", description: "평촌대로", lat: 37.3837, lng: 126.9602 },
  { id: "hagwon-back",  name: "평촌학원가 (뒷길)", category: "academy", description: "평촌동·호계동", lat: 37.3835, lng: 126.9605 },
  { id: "guiin-school", name: "귀인중학교 사거리", category: "academy", description: "통학 요지", lat: 37.3925, lng: 126.9495 },

  // ─── 동안구 내 주거지 ────────────────────────────────────────────────
  { id: "biSan",         name: "비산동 일대",      category: "residence", description: "비산사거리 인근", lat: 37.3932, lng: 126.9376 },
  { id: "hogye",         name: "호계동 일대",      category: "residence", description: "평촌신도시 동남", lat: 37.3812, lng: 126.9663 },
  { id: "pyeongchon-shintosi", name: "평촌신도시",  category: "residence", description: "범계·평촌역 사이", lat: 37.3920, lng: 126.9530 },
  { id: "gwanyang",      name: "관양동",           category: "residence", description: "인덕원역 인근",   lat: 37.4012, lng: 126.9586 },
  { id: "buheung",       name: "부흥동",           category: "residence", description: "비산동 북쪽",     lat: 37.4004, lng: 126.9450 },
  { id: "dalan",         name: "달안동",           category: "residence", description: "평촌동 서쪽",     lat: 37.3939, lng: 126.9450 },
  { id: "bulim",         name: "부림동",           category: "residence", description: "평촌역 남쪽",     lat: 37.3853, lng: 126.9520 },
  { id: "pyeongan",      name: "평안동",           category: "residence", description: "귀인동 인근",     lat: 37.3905, lng: 126.9485 },
  { id: "shinchon",      name: "신촌동",           category: "residence", description: "범계 인근",       lat: 37.3970, lng: 126.9595 },

  // ─── 동안구 내 관공서/시설 ──────────────────────────────────────────
  { id: "anyang-cityhall", name: "안양시청",     category: "office",   description: "범계역 인근",      lat: 37.3947, lng: 126.9568 },
  { id: "dongan-gucheong", name: "동안구청",     category: "office",   description: "평촌중앙공원 인근", lat: 37.3905, lng: 126.9512 },
  { id: "anyang-stadium",  name: "안양종합운동장", category: "facility", description: "스포츠·문화",     lat: 37.4005, lng: 126.9290 },
  { id: "central-park",    name: "평촌중앙공원",  category: "park",     description: "공원·여가",       lat: 37.3923, lng: 126.9495 },
  { id: "beomgye-shopping", name: "범계 NC백화점", category: "facility", description: "주말 쇼핑객",     lat: 37.3963, lng: 126.9544 },

  // ─── 동안구 외부 — 출퇴근 목적지 (서울 강남권) ─────────────────────
  { id: "gangnam",    name: "강남역",       category: "outside", description: "서울 강남구",   lat: 37.4979, lng: 127.0276, external: true },
  { id: "sadang",     name: "사당역",       category: "outside", description: "서울 동작구",   lat: 37.4763, lng: 126.9816, external: true },
  { id: "yangjae",    name: "양재역",       category: "outside", description: "서울 서초구",   lat: 37.4843, lng: 127.0344, external: true },
  { id: "seocho",     name: "서초/교대",    category: "outside", description: "서울 서초구",   lat: 37.4926, lng: 127.0079, external: true },

  // ─── 동안구 외부 — 서울 중심부 ──────────────────────────────────────
  { id: "city-hall",  name: "시청·광화문",  category: "outside", description: "서울 중구",     lat: 37.5663, lng: 126.9779, external: true },
  { id: "jongno",     name: "종로·종각",    category: "outside", description: "서울 종로구",   lat: 37.5704, lng: 126.9826, external: true },
  { id: "yeouido",    name: "여의도",       category: "outside", description: "서울 영등포구", lat: 37.5215, lng: 126.9244, external: true },

  // ─── 동안구 외부 — 분당/판교 ─────────────────────────────────────────
  { id: "pangyo",     name: "판교역",       category: "outside", description: "성남 분당구",   lat: 37.3947, lng: 127.1112, external: true },
  { id: "jeongja",    name: "정자역",       category: "outside", description: "성남 분당구",   lat: 37.3673, lng: 127.1085, external: true },

  // ─── 동안구 외부 — 인근 안양시 ───────────────────────────────────────
  { id: "anyang-station", name: "안양역",   category: "outside", description: "안양 만안구",   lat: 37.4012, lng: 126.9229, external: true },
  { id: "gwangmyeong",    name: "광명역",   category: "outside", description: "광명시",        lat: 37.4163, lng: 126.8852, external: true },

  // ─── 기타 (직접 입력) — 항상 마지막 ─────────────────────────────────
  { id: "other", name: "기타 (직접 입력)", category: "other", lat: null, lng: null },
];

export const PLACE_MAP = Object.fromEntries(PLACES.map((p) => [p.id, p]));

export const CATEGORY_LABEL: Record<PlaceCategory, { label: string; color: string }> = {
  subway:    { label: "지하철역",       color: "#3b82f6" },
  academy:   { label: "학원가/학교",    color: "#a855f7" },
  residence: { label: "주거지/동",      color: "#22c55e" },
  office:    { label: "관공서",         color: "#f97316" },
  facility:  { label: "주요시설",       color: "#06b6d4" },
  park:      { label: "공원/여가",      color: "#84cc16" },
  outside:   { label: "동안구 외부 목적지", color: "#ef4444" },
  other:     { label: "기타",           color: "#9ca3af" },
};

/** 화면에 표시할 라벨 — "기타"인 경우 사용자 입력 텍스트 사용 */
export function placeLabel(id: string, customText?: string): string {
  if (id === "other") return customText?.trim() || "기타";
  return PLACE_MAP[id]?.name ?? id;
}
