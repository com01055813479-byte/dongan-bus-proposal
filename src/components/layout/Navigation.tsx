import { LayoutDashboard, MapPinned, BarChart3, Lightbulb, Settings } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

/**
 * 동안구 급행 버스 제안 사이트 네비게이션.
 * 동아리 전용 데이터 입력은 메뉴에 노출하지 않고 URL 로만 접근.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "홈",
    icon: LayoutDashboard,
    description: "프로젝트 소개와 현재 진행 상황",
  },
  {
    href: "/survey",
    label: "통근 설문",
    icon: MapPinned,
    description: "어디에서 어디로 자주 가시나요?",
  },
  {
    href: "/analysis",
    label: "수요 분석",
    icon: BarChart3,
    description: "수집된 통근 패턴 시각화",
  },
  {
    href: "/proposal",
    label: "제안 노선",
    icon: Lightbulb,
    description: "분석 결과 기반 추천 급행 노선",
  },
  {
    href: "/settings",
    label: "설정",
    icon: Settings,
    description: "테마, 데이터 관리",
  },
];
