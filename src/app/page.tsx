"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  BarChart3,
  ChevronRight,
  Bus,
  Settings,
  AlertCircle,
} from "lucide-react";
import { useCommutes } from "@/lib/hooks/useCommutes";
import { avgCongestion } from "@/lib/algorithms/odAnalysis";

const FEATURE_CARDS = [
  { href: "/analysis", icon: BarChart3, title: "혼잡 분석 보기", desc: "버스 혼잡·이동수단 데이터 시각화" },
  { href: "/settings", icon: Settings,  title: "설정",           desc: "테마, 관리자 접근" },
];

export default function HomePage() {
  const { entries, hydrated } = useCommutes();
  const conAvg = avgCongestion(entries);

  return (
    <div className="flex flex-col gap-5">
      {/* 인사말 */}
      <section className="pt-2 pb-1 relative">
        {/* 우측 상단 학번·이름 */}
        <span className="absolute top-0 right-0 text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
          10923 조은규
        </span>
        <p className="text-sm text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
          <Bus size={14} />
          동안구 시민 참여 프로젝트
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-strong)] leading-tight">
          동안구
          <br />
          <span className="text-[var(--accent)]">급행 버스</span> 제안
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-3 leading-relaxed">
          버스가 모든 정류장에 정차해 느린 동안구 안에서,
          <strong className="text-[var(--text-base)]"> 학원가와 주요 역을 빠르게 잇는 급행 버스</strong>가 필요한지를
          시민 설문으로 확인해 안양시청에 제안하는 프로젝트입니다.
        </p>
      </section>

      {/* 핵심 통계 — 실데이터 */}
      <Card>
        <CardHeader>
          <CardTitle>현재까지 모인 데이터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-center">
            <Stat label="설문 응답" value={hydrated ? `${entries.length}` : "—"} />
            <Stat label="평균 혼잡도" value={hydrated && entries.length > 0 ? `${conAvg.toFixed(1)}/5` : "—"} accent />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-3 leading-relaxed">
            동안구민의 버스 혼잡 경험을 모으는 중입니다. 첫 방문 시 설문에 참여해 주신 모든 분께 감사드립니다.
          </p>
        </CardContent>
      </Card>

      {/* 진행 단계 안내 */}
      <Card>
        <CardHeader>
          <CardTitle>프로젝트 진행 단계</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Step n="1" title="버스 설문" desc="동안구민의 출퇴근 버스 혼잡 경험 수집" />
          <Step n="2" title="혼잡 분석"     desc="혼잡도·만차 경험·이동수단을 통계로 도출" />
          <Step n="3" title="시청 제출"     desc="분석 결과로 안양시청에 급행 버스 도입 제안" />
        </CardContent>
      </Card>

      {/* 안내 박스 */}
      <div
        className="rounded-2xl px-4 py-3 flex items-start gap-2 text-sm"
        style={{
          backgroundColor: "var(--bg-soft)",
          color: "var(--text-base)",
        }}
      >
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" />
        <p>
          이 사이트는 <strong>학생 비영리 프로젝트</strong>입니다.
          응답 데이터는 익명으로 분석되며 정책 제안 자료에만 사용됩니다.
        </p>
      </div>

      {/* 바로가기 */}
      <section>
        <h2 className="text-sm font-bold text-[var(--text-strong)] mb-2 px-1">바로가기</h2>
        <Card className="!p-0 overflow-hidden">
          {FEATURE_CARDS.map((f, idx) => (
            <Link
              key={f.href}
              href={f.href}
              className={`flex items-center gap-3 px-5 py-4 hover:bg-[var(--bg-soft)] transition-colors ${
                idx > 0 ? "border-t border-[var(--border)]" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
                <f.icon size={18} className="text-[var(--accent)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--text-strong)]">{f.title}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{f.desc}</p>
              </div>
              <ChevronRight size={18} className="text-[var(--text-muted)] shrink-0" />
            </Link>
          ))}
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? "bg-[var(--accent-soft)]" : "card"}`}>
      <p className={`text-xs ${accent ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"}`}>
        {label}
      </p>
      <p className={`text-xl font-bold mt-1 tabular-nums ${accent ? "text-[var(--accent-text)]" : "text-[var(--text-strong)]"}`}>
        {value}
      </p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </span>
      <div>
        <p className="text-sm font-semibold text-[var(--text-strong)]">{title}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
