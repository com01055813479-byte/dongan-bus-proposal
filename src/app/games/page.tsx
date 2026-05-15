"use client";

import Link from "next/link";
import { Gamepad2, ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

/**
 * 은규가 만들 작은 게임 모음 페이지.
 * 게임 추가 시 GAMES 배열에 항목 추가.
 */

interface Game {
  title: string;
  description: string;
  href: string;
  emoji: string;
}

const GAMES: Game[] = [
  {
    title: "파쿠르 타워",
    description: "1인칭 점프맵 — 10 스테이지",
    href: "/games/parkour",
    emoji: "🏗️",
  },
];

export default function GamesPage() {
  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <div className="pt-2 pb-1 flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
            <Gamepad2 size={14} />
            은규의 게임방
          </p>
          <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
            작은 게임 모음
          </h1>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-text)] mt-2"
        >
          <ArrowLeft size={14} />
          설정으로
        </Link>
      </div>

      {GAMES.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center">
              <Sparkles size={28} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text-strong)]">준비 중</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">
              아직 만들어진 게임이 없어요. 곧 작은 게임들을 여기에 추가할 예정입니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GAMES.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="card rounded-2xl p-4 flex items-center gap-3 hover:bg-[var(--bg-soft)] transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-2xl">
                {g.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text-strong)]">{g.title}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{g.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
