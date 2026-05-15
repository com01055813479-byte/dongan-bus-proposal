"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Play, RotateCcw, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";

// ─────────────── 시간 포맷 ───────────────
function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m.toString().padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}

// ─────────────── 시작 화면 ───────────────
export function StartScreen({
  onStart,
  isMobile,
  bestTime,
}: {
  onStart: () => void;
  isMobile: boolean;
  bestTime: number | null;
}) {
  return (
    <div className="absolute inset-0 bg-black/65 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white p-6">
      <Link
        href="/games"
        className="absolute top-4 left-4 flex items-center gap-1 text-sm text-white/70 hover:text-white"
      >
        <ArrowLeft size={16} />
        뒤로
      </Link>
      <h1 className="text-4xl sm:text-5xl font-black mb-3 tracking-tight">파쿠르 타워</h1>
      <p className="text-white/70 text-sm sm:text-base mb-6 max-w-md text-center leading-relaxed">
        사방이 막힌 직육면체 타워의 꼭대기까지 점프해서 올라가세요.
        <br />
        떨어지면 처음부터 — 갈수록 어려워집니다.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-8 text-xs sm:text-sm">
        {isMobile ? (
          <>
            <ControlKey k="조이스틱" desc="이동" />
            <ControlKey k="점프 버튼" desc="점프" />
            <ControlKey k="화면 드래그" desc="시점 회전" />
            <ControlKey k="—" desc="" />
          </>
        ) : (
          <>
            <ControlKey k="W A S D" desc="이동" />
            <ControlKey k="Space" desc="점프" />
            <ControlKey k="마우스" desc="시점 회전" />
            <ControlKey k="ESC" desc="마우스 잠금 해제" />
          </>
        )}
      </div>

      {bestTime !== null && (
        <p className="text-amber-300 text-sm mb-4 flex items-center gap-1.5">
          <Trophy size={14} />
          최고 기록: <span className="font-bold tabular-nums">{formatTime(bestTime)}</span>
        </p>
      )}

      <button
        onClick={onStart}
        className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-base font-bold shadow-xl transition-colors"
      >
        <Play size={18} fill="currentColor" />
        시작
      </button>

      {!isMobile && (
        <p className="text-white/50 text-xs mt-6 text-center max-w-xs">
          시작 후 화면을 클릭하면 마우스가 잠겨 시점이 회전됩니다.
        </p>
      )}
    </div>
  );
}

function ControlKey({ k, desc }: { k: string; desc: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
      <span className="font-mono font-bold text-white">{k}</span>
      <span className="text-white/60 text-xs">{desc}</span>
    </div>
  );
}

// ─────────────── 게임 중 HUD ───────────────
export function GameHUD({
  stage,
  totalStages,
  elapsed,
  bestTime,
  isMobile,
  mobileInputRef,
}: {
  stage: number;
  totalStages: number;
  elapsed: number;
  bestTime: number | null;
  isMobile: boolean;
  mobileInputRef: RefObject<{ moveX: number; moveZ: number; jumpPressed: boolean }>;
}) {
  return (
    <>
      {/* 우측 상단 — 경과 시간 + 최고 기록 */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1 pointer-events-none">
        <div className="bg-black/55 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg font-mono text-sm tabular-nums">
          {formatTime(elapsed)}
        </div>
        {bestTime !== null && (
          <div className="bg-black/45 backdrop-blur-sm text-amber-300 px-2.5 py-1 rounded-md font-mono text-[11px] tabular-nums flex items-center gap-1">
            <Trophy size={10} />
            {formatTime(bestTime)}
          </div>
        )}
      </div>

      {/* 화면 중앙 — 조준점 */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-white/85 shadow-[0_0_4px_rgba(0,0,0,0.6)]" />
      </div>

      {/* 하단 중앙 — Stage X/N */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="bg-black/55 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-bold">
          Stage {stage} / {totalStages}
        </div>
      </div>

      {/* 모바일 컨트롤 */}
      {isMobile && <MobileControls mobileInputRef={mobileInputRef} />}
    </>
  );
}

// ─────────────── 모바일 조이스틱 + 점프 ───────────────
function MobileControls({
  mobileInputRef,
}: {
  mobileInputRef: RefObject<{ moveX: number; moveZ: number; jumpPressed: boolean }>;
}) {
  const padRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const pad = padRef.current;
    const knob = knobRef.current;
    if (!pad || !knob) return;

    const setKnob = (dx: number, dy: number) => {
      const max = 40;
      const len = Math.hypot(dx, dy);
      const clampedDx = len > max ? (dx / len) * max : dx;
      const clampedDy = len > max ? (dy / len) * max : dy;
      knob.style.transform = `translate(${clampedDx}px, ${clampedDy}px)`;
      const nx = clampedDx / max;
      const ny = clampedDy / max;
      mobileInputRef.current.moveX = nx;
      mobileInputRef.current.moveZ = ny;
    };

    const onStart = (e: TouchEvent) => {
      const r = pad.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (
          t.clientX >= r.left && t.clientX <= r.right &&
          t.clientY >= r.top && t.clientY <= r.bottom &&
          touchIdRef.current === null
        ) {
          touchIdRef.current = t.identifier;
          setKnob(t.clientX - (r.left + r.width / 2), t.clientY - (r.top + r.height / 2));
        }
      }
    };
    const onMove = (e: TouchEvent) => {
      if (touchIdRef.current === null) return;
      const r = pad.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchIdRef.current) {
          setKnob(t.clientX - (r.left + r.width / 2), t.clientY - (r.top + r.height / 2));
        }
      }
    };
    const onEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null;
          knob.style.transform = "translate(0, 0)";
          mobileInputRef.current.moveX = 0;
          mobileInputRef.current.moveZ = 0;
        }
      }
    };

    pad.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      pad.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [mobileInputRef]);

  return (
    <>
      {/* 좌측 하단 조이스틱 */}
      <div
        ref={padRef}
        className="absolute bottom-6 left-6 z-30 w-32 h-32 rounded-full bg-white/15 border-2 border-white/30 touch-none flex items-center justify-center"
      >
        <div
          ref={knobRef}
          className="w-14 h-14 rounded-full bg-white/70 transition-transform duration-75"
        />
      </div>

      {/* 우측 하단 점프 버튼 */}
      <button
        className="absolute bottom-8 right-8 z-30 w-20 h-20 rounded-full bg-emerald-500/85 text-white font-bold text-sm select-none touch-none active:bg-emerald-400 shadow-lg"
        onTouchStart={(e) => {
          e.preventDefault();
          mobileInputRef.current.jumpPressed = true;
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          mobileInputRef.current.jumpPressed = false;
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        JUMP
      </button>
    </>
  );
}

// ─────────────── 승리 화면 ───────────────
export function WinScreen({
  elapsed,
  bestTime,
  onRestart,
}: {
  elapsed: number;
  bestTime: number | null;
  onRestart: () => void;
}) {
  const isNewBest = bestTime !== null && bestTime === elapsed;
  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex flex-col items-center justify-center text-white p-6">
      <Trophy size={56} className="text-amber-300 mb-3" />
      <h2 className="text-3xl sm:text-4xl font-black mb-2">클리어!</h2>
      <p className="text-white/70 text-sm mb-6">타워 정상에 도달했습니다</p>

      <div className="bg-white/10 rounded-2xl px-8 py-5 mb-6 text-center">
        <p className="text-xs text-white/60 mb-1">기록</p>
        <p className="text-3xl font-bold font-mono tabular-nums">{formatTime(elapsed)}</p>
        {isNewBest && (
          <p className="mt-2 text-amber-300 text-xs font-bold flex items-center gap-1 justify-center">
            🎉 최고 기록 갱신!
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-colors"
        >
          <RotateCcw size={16} />
          다시하기
        </button>
        <Link
          href="/games"
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold transition-colors"
        >
          <ArrowLeft size={16} />
          게임 목록
        </Link>
      </div>
    </div>
  );
}
