import { LayoutDashboard, BarChart3, Settings } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

/**
 * 동안구 급행 버스 제안 사이트 네비게이션.
 * 설문은 첫 방문 시 오버레이로만 받음 (한 사람 1회 제한).
 * 관리자 페이지는 메뉴에 노출하지 않고 URL 로만 접근.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "홈",
    icon: LayoutDashboard,
    description: "프로젝트 소개와 현재 진행 상황",
  },
  {
    href: "/analysis",
    label: "수요 분석",
    icon: BarChart3,
    description: "수집된 통근 패턴 시각화",
  },
  {
    href: "/settings",
    label: "설정",
    icon: Settings,
    description: "테마, 관리자 접근",
  },
];
