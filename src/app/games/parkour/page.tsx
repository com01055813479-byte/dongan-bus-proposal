"use client";

import dynamic from "next/dynamic";

// SSR 안전을 위해 클라이언트 전용 로드
const ParkourGame = dynamic(() => import("./ParkourGame").then((m) => m.ParkourGame), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[80vh] flex items-center justify-center text-[var(--text-muted)]">
      게임 로딩 중...
    </div>
  ),
});

export default function ParkourPage() {
  return <ParkourGame />;
}
