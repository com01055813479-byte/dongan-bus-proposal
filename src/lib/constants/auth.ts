/**
 * 설정 페이지의 "어드민 접근" 비밀번호 게이트.
 *
 * 각 비밀번호가 일치하면 지정된 경로로 이동.
 * 비밀번호는 클라이언트 코드에 박혀 있어 마음만 먹으면 알아낼 수 있음.
 * 학생 비영리 프로젝트 수준의 보호.
 */

export interface GateRule {
  password: string;
  /** 일치 시 이동할 경로 */
  redirectTo: string;
  /** 디버깅/로그용 라벨 */
  label: string;
}

export const GATE_RULES: GateRule[] = [
  {
    password:   "induckmathroad",
    redirectTo: "/admin",
    label:      "어드민 - 관리자 페이지",
  },
  {
    password:   "eungyusmart",
    redirectTo: "/games",
    label:      "은규의 게임 모음",
  },
];

/** 입력값이 일치하는 규칙 반환 (없으면 null) */
export function matchGate(input: string): GateRule | null {
  return GATE_RULES.find((r) => r.password === input) ?? null;
}

// 하위 호환 — 기존에 import 하던 코드 깨지지 않도록
export const CLUB_PASSWORD = GATE_RULES[0].password;
