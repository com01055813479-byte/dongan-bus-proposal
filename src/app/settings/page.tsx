"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Info,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useSettings, ThemeMode } from "@/lib/context/SettingsContext";
import { cn } from "@/lib/utils/cn";
import { matchGate } from "@/lib/constants/auth";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light",  label: "라이트", icon: Sun },
  { value: "dark",   label: "다크",   icon: Moon },
  { value: "system", label: "시스템", icon: Monitor },
];

export default function SettingsPage() {
  const { settings, hydrated, setTheme } = useSettings();

  const router = useRouter();
  const [clubPwInput, setClubPwInput] = useState("");
  const [clubPwError, setClubPwError] = useState<string | null>(null);

  const [showCredit, setShowCredit] = useState(false);

  // 비밀번호 입력 시 자동 검증 — 일치하면 즉시 이동
  function handlePwChange(value: string) {
    setClubPwInput(value);
    setClubPwError(null);
    const rule = matchGate(value);
    if (rule) {
      router.push(rule.redirectTo);
    }
  }

  function handlePwBlur() {
    if (!clubPwInput) return;
    if (!matchGate(clubPwInput)) {
      setClubPwError("비밀번호가 일치하지 않습니다");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="pt-2 pb-1">
        <p className="text-sm text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
          <SettingsIcon size={14} />
          설정
        </p>
        <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
          앱 설정
        </h1>
      </div>

      {/* 테마 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Sun size={16} className="text-[var(--accent)]" />
              화면 모드
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((opt) => {
              const active = hydrated && settings.theme === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 rounded-xl transition-colors",
                    active
                      ? "bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]"
                      : "bg-[var(--bg-soft)] hover:bg-[var(--border)]"
                  )}
                >
                  <Icon size={20} className={active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
                  <span className={cn(
                    "text-xs font-bold",
                    active ? "text-[var(--accent-text)]" : "text-[var(--text-base)]"
                  )}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 웹 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCredit((v) => !v)}
                aria-label="개발자 정보"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                <Info size={16} />
              </button>
              웹 정보
              {showCredit && (
                <span className="ml-auto text-[11px] font-medium text-[var(--text-muted)]">
                  개발: @eungyiu (10923 조은규)
                </span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          <InfoRow label="버전" value="0.3.0" />
          <InfoRow label="프로젝트" value="동안구 급행 버스 제안" />
          <InfoRow label="용도" value="학생 비영리 프로젝트" />
          <InfoRow label="설문 방식" value="노선/구간 혼잡도 평가" />
          <InfoRow label="저장소" value="Upstash Redis (Vercel KV)" />
          <InfoRow label="호스팅" value="Vercel" />
          <InfoRow label="프레임워크" value="Next.js 15 · Tailwind v4" last />
        </CardContent>
      </Card>

      {/* 관리자 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Lock size={14} className="text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)] font-medium">
                관리자
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <input
              type="password"
              value={clubPwInput}
              onChange={(e) => handlePwChange(e.target.value)}
              onBlur={handlePwBlur}
              placeholder="비밀번호"
              className="input rounded-xl px-3 py-2 text-sm w-full"
              autoComplete="off"
            />
            {clubPwError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold px-1">
                {clubPwError}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={cn("flex justify-between items-center py-3", !last && "border-b border-[var(--border)]")}>
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--text-strong)] text-right">{value}</span>
    </div>
  );
}
