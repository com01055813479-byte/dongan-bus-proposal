import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { SettingsProvider, themeInlineScript } from "@/lib/context/SettingsContext";
import { WelcomeSurveyOverlay } from "@/components/features/survey/WelcomeSurveyOverlay";

export const metadata: Metadata = {
  title: "동안구 급행 버스 제안",
  description: "동안구 시민의 통근 패턴 데이터를 모아 급행 셔틀버스 노선을 제안합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 초기 페인트 전에 .dark 클래스 적용 → FOUC/하이드레이션 미스매치 방지 */}
        <script dangerouslySetInnerHTML={{ __html: themeInlineScript }} />
      </head>
      <body className="min-h-screen">
        <SettingsProvider>
          <Header />
          <main className="max-w-2xl mx-auto px-4 py-5 pb-20">{children}</main>
          <WelcomeSurveyOverlay />
        </SettingsProvider>
      </body>
    </html>
  );
}
