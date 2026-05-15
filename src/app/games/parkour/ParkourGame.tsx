"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { BOX, GOAL, FALL_Y, SPAWN, stageFromY } from "./mapData";
import { Player } from "./Player";
import { World } from "./World";
import { GameHUD, StartScreen, WinScreen } from "./Hud";

const BEST_KEY = "parkour-best-time";

type Phase = "intro" | "playing" | "win";

export function ParkourGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentStage, setCurrentStage] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const startTimeRef = useRef<number>(0);

  const mobileInput = useRef({ moveX: 0, moveZ: 0, jumpPressed: false });

  useEffect(() => {
    const ua = navigator.userAgent;
    const touch =
      /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
      ("ontouchstart" in window && (navigator.maxTouchPoints ?? 0) > 0);
    setIsMobile(touch);

    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (raw) setBestTime(parseFloat(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setElapsed((Date.now() - startTimeRef.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  const handleStart = useCallback(() => {
    setCurrentStage(1);
    setElapsed(0);
    startTimeRef.current = Date.now();
    setPhase("playing");
  }, []);

  const handleRestart = useCallback(() => {
    setPhase("intro");
  }, []);

  // Player 진행도 → HUD 단계 표시
  const handleProgress = useCallback((y: number) => {
    const s = stageFromY(y);
    setCurrentStage((prev) => (prev !== s ? s : prev));
  }, []);

  const handleWin = useCallback(() => {
    const t = (Date.now() - startTimeRef.current) / 1000;
    setElapsed(t);
    setPhase("win");
    if (bestTime === null || t < bestTime) {
      try {
        localStorage.setItem(BEST_KEY, String(t));
      } catch {}
      setBestTime(t);
    }
  }, [bestTime]);

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 56px)" }}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 500 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#87ceeb"));
        }}
      >
        <Suspense fallback={null}>
          <Sky sunPosition={[100, 50, 100]} turbidity={4} rayleigh={1} />
          <ambientLight intensity={0.85} />
          <directionalLight position={[40, 80, 30]} intensity={0.8} />

          <World />

          {phase === "playing" && (
            <Player
              spawn={SPAWN}
              fallY={FALL_Y}
              goal={GOAL}
              box={BOX}
              isMobile={isMobile}
              mobileInputRef={mobileInput}
              onProgress={handleProgress}
              onWin={handleWin}
            />
          )}
        </Suspense>
      </Canvas>

      {phase === "playing" && (
        <GameHUD
          stage={currentStage}
          totalStages={10}
          elapsed={elapsed}
          bestTime={bestTime}
          isMobile={isMobile}
          mobileInputRef={mobileInput}
        />
      )}

      {phase === "intro" && <StartScreen onStart={handleStart} isMobile={isMobile} bestTime={bestTime} />}

      {phase === "win" && (
        <WinScreen elapsed={elapsed} bestTime={bestTime} onRestart={handleRestart} />
      )}
    </div>
  );
}
