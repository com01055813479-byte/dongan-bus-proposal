/**
 * 점프맵 — 사방이 막힌 직육면체 타워 내부.
 * 발판이 4개 벽을 따라 나선형으로 위로 올라가며, 갈수록 난이도 상승.
 * 체크포인트 없음: 떨어지면 항상 시작점으로.
 *
 * 좌표계: x = 동서, y = 위, z = 남북.  박스: 24 × 110 × 24.
 *
 * 점프 물리: JUMP_VELOCITY=18, GRAVITY=22, WALK_SPEED=8
 *   최대 점프 높이 ≈ 7.36m / 수평 최대 ≈ 13m
 *   안전 마진: 수평 ≤ 6m, 수직 ≤ 3m
 */

export const BOX = {
  size:   24,
  height: 110,
};

export type Obstacle =
  | { type: "static";   pos: [number, number, number]; size: [number, number, number]; color: string }
  | { type: "moving";   pos: [number, number, number]; size: [number, number, number]; color: string;
      axis: "x" | "z"; range: number; speed: number }
  | { type: "rotating"; pos: [number, number, number]; size: [number, number, number]; color: string;
      speed: number }
  | { type: "vanish";   pos: [number, number, number]; size: [number, number, number]; color: string };

// 장애물 종류별 통일 색상
export const TYPE_COLOR = {
  static:   "#22c55e", // green
  moving:   "#3b82f6", // blue
  rotating: "#f97316", // orange
  vanish:   "#a855f7", // purple (반투명)
} as const;

// 헬퍼 빌더 ──────────────────────────────────────────────────────────────
const S = (x: number, y: number, z: number, size = 3): Obstacle => ({
  type: "static",
  pos: [x, y, z],
  size: [size, 0.5, size],
  color: TYPE_COLOR.static,
});

const M = (
  x: number, y: number, z: number,
  axis: "x" | "z",
  size = 2.8,
  speed = 1.2,
  range = 2.5,
): Obstacle => ({
  type: "moving",
  pos: [x, y, z],
  size: [size, 0.5, size],
  color: TYPE_COLOR.moving,
  axis, range, speed,
});

const R = (
  x: number, y: number, z: number,
  speed = 1.0,
  length = 4,
): Obstacle => ({
  type: "rotating",
  pos: [x, y, z],
  size: [length, 0.5, 1.4],
  color: TYPE_COLOR.rotating,
  speed,
});

const V = (x: number, y: number, z: number, size = 2.5): Obstacle => ({
  type: "vanish",
  pos: [x, y, z],
  size: [size, 0.5, size],
  color: TYPE_COLOR.vanish,
});

/**
 * 모든 발판 — 벽을 따라 시계방향 나선형, 위로 갈수록 난이도 상승.
 *  벽 위치: ±12 (박스 끝)  /  발판은 벽 안쪽 9~10m 지점에 배치
 *
 *  난이도 구역:
 *   y  3~13: 정적 (입문)
 *   y 15~25: 정적 + 움직임 (입문 후)
 *   y 27~37: 움직임 + 회전 (중급)
 *   y 39~49: 회전 + 사라짐 (상급)
 *   y 51~63: 혼합 + 작은 발판 (고급)
 *   y 65~73: 최종 → 중앙으로 진입
 *   y 73의 황금 발판 위에 골인
 */
export const PLATFORMS: Obstacle[] = [
  // ── 입문 (정적 6개) — 북쪽 벽을 따라 시작 ─────────────────────────
  S(-8, 3, -9, 3.5),
  S(-3, 5, -9, 3.5),
  S( 3, 7, -9, 3.5),
  S( 8, 9, -9, 3.5),
  S( 9, 11, -3, 3.2),
  S( 9, 13,  3, 3.2),

  // ── 입문 후 (정적 + 움직임) ────────────────────────────────────────
  S( 9, 15,  8, 3),
  M( 3, 17,  9, "x"),
  S(-3, 19,  9, 3),
  M(-9, 21,  8, "z"),
  S(-9, 23,  3, 3),
  M(-9, 25, -3, "z"),

  // ── 중급 (움직임 + 회전) ───────────────────────────────────────────
  S(-9, 27, -8, 2.8),
  M(-3, 29, -9, "x"),
  R( 3, 31, -9),
  M( 9, 33, -8, "z"),
  R( 9, 35, -3),
  M( 9, 37,  3, "z"),

  // ── 상급 (회전 + 사라짐) ───────────────────────────────────────────
  R( 9, 39,  8),
  V( 3, 41,  9),
  R(-3, 43,  9),
  V(-9, 45,  8),
  R(-9, 47,  3, 1.2),
  V(-9, 49, -3),

  // ── 고급 (혼합 + 작은 발판) ────────────────────────────────────────
  V(-9, 51, -8, 2.2),
  R(-3, 53, -9, 1.3),
  V( 3, 55, -9, 2.2),
  M( 9, 57, -8, "z", 2.2, 1.5),
  R( 9, 59, -3, -1.3),
  V( 9, 61,  3, 2.2),
  R( 9, 63,  8, 1.5),

  // ── 최종 (중앙으로 진입) ───────────────────────────────────────────
  V( 3, 65,  9, 2),
  M(-3, 67,  9, "x", 2, 1.8),
  R(-6, 69,  3, 1.6),
  V( 0, 71,  0, 2),

  // ── 골인 황금 발판 (정적) ──────────────────────────────────────────
  { type: "static", pos: [0, 73, 0], size: [5, 0.5, 5], color: "#fde047" },
];

/** 골인 트리거 — 황금 발판 위 1.75m (점프해서 닿아야 함) */
export const GOAL: { pos: [number, number, number]; size: [number, number, number] } = {
  pos:  [0, 77, 0],
  size: [2, 2, 2],
};

/** 떨어지면 부활하는 Y 임계값 */
export const FALL_Y = -3;

/** 시작 스폰 위치 (바닥 중앙) — 떨어지면 여기로 부활 */
export const SPAWN: [number, number, number] = [0, 0.25, 0];

/**
 * 현재 플레이어 높이로부터 단계 계산 (HUD 표시용, 1~10).
 * 체크포인트 대신 그냥 높이 기반 진행도.
 */
export function stageFromY(y: number): number {
  if (y < 5) return 1;
  if (y < 15) return 2;
  if (y < 25) return 3;
  if (y < 35) return 4;
  if (y < 45) return 5;
  if (y < 55) return 6;
  if (y < 63) return 7;
  if (y < 70) return 8;
  if (y < 74) return 9;
  return 10;
}
