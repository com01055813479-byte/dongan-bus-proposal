/**
 * 동안구 주요 거점 — 통근 설문/노선 시뮬레이션의 출발-도착 후보지.
 *
 * 좌표는 NCP Geocoding 으로 확정. (정확하지 않은 곳은 추후 보정)
 */

export interface Place {
  id: string;
  name: string;
  category: "subway" | "academy" | "residence" | "office" | "park" | "facility";
  description?: string;
  lat: number;
  lng: number;
}

export const PLACES: Place[] = [
  // 4호선 지하철역 ─────────────────────────────────────────────
  { id: "indeokwon",   name: "인덕원역",  category: "subway",   description: "4호선 환승 거점", lat: 37.4014, lng: 126.9521 },
  { id: "pyeongchon",  name: "평촌역",    category: "subway",   description: "4호선 평촌신도시", lat: 37.3895, lng: 126.9527 },
  { id: "beomgye",     name: "범계역",    category: "subway",   description: "4호선, 동안구청 인근", lat: 37.3956, lng: 126.9543 },

  // 학원가 / 학생 거점 ─────────────────────────────────────────
  { id: "hagwon-main", name: "평촌학원가 (메인)",  category: "academy",  description: "평촌대로 일대",      lat: 37.3837, lng: 126.9602 },
  { id: "hagwon-back", name: "평촌학원가 (뒷길)",  category: "academy",  description: "평촌동·호계동 후면",  lat: 37.3835, lng: 126.9605 },
  { id: "guiin-school", name: "귀인중학교 사거리", category: "academy",  description: "학생 통학 요지",     lat: 37.3925, lng: 126.9495 },

  // 주거 단지 ─────────────────────────────────────────────────
  { id: "biSan",       name: "비산동 아파트단지", category: "residence", description: "비산사거리 인근",  lat: 37.3932, lng: 126.9376 },
  { id: "hogye",       name: "호계동 아파트단지", category: "residence", description: "평촌신도시 동남",  lat: 37.3812, lng: 126.9663 },
  { id: "pyeongchon-shintosi", name: "평촌신도시 중심", category: "residence", description: "범계·평촌역 사이", lat: 37.3920, lng: 126.9530 },

  // 관공서 / 시설 ─────────────────────────────────────────────
  { id: "anyang-cityhall", name: "안양시청", category: "office",   description: "범계역 인근",      lat: 37.3947, lng: 126.9568 },
  { id: "dongan-gucheong", name: "동안구청", category: "office",   description: "평촌중앙공원 인근", lat: 37.3905, lng: 126.9512 },
  { id: "anyang-stadium",  name: "안양종합운동장", category: "facility", description: "스포츠/문화 행사", lat: 37.4005, lng: 126.9290 },

  // 공원 / 여가 ────────────────────────────────────────────────
  { id: "central-park", name: "평촌중앙공원", category: "park",    description: "주말 인파", lat: 37.3923, lng: 126.9495 },

  // 쇼핑 / 상권 ────────────────────────────────────────────────
  { id: "beomgye-shopping", name: "범계역 NC백화점", category: "facility", description: "주말 쇼핑객", lat: 37.3963, lng: 126.9544 },
];

export const PLACE_MAP = Object.fromEntries(PLACES.map((p) => [p.id, p]));

/** 카테고리별 라벨/색 (UI 용) */
export const CATEGORY_LABEL: Record<Place["category"], { label: string; color: string }> = {
  subway:    { label: "지하철역",  color: "#3b82f6" }, // blue
  academy:   { label: "학원가",    color: "#a855f7" }, // purple
  residence: { label: "주거지",    color: "#22c55e" }, // green
  office:    { label: "관공서",    color: "#f97316" }, // orange
  facility:  { label: "주요시설",  color: "#06b6d4" }, // cyan
  park:      { label: "공원/여가", color: "#84cc16" }, // lime
};
