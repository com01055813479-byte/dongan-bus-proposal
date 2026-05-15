"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BOX, PLATFORMS, GOAL, type Obstacle } from "./mapData";

/**
 * 세계: 사방이 막힌 직육면체 박스 + 모든 발판 + 골인 깃발.
 */
export function World() {
  return (
    <group>
      <Walls />

      {PLATFORMS.map((ob, i) => (
        <ObstacleMesh key={i} ob={ob} />
      ))}

      <GoalFlag />
    </group>
  );
}

// ── @eungyiu 텍스트 워터마크 캔버스 텍스처 ────────────────────────────
function useWallTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    // 가로 256 x 세로 110*4=440 정도 비율. 큰 캔버스로 선명하게
    const W = 512;
    const H = 2200;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // 벽 배경색
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, W, H);

    // @eungyiu 텍스트 — 옅은 회색, 일정 간격
    ctx.fillStyle = "#a1a8b3"; // 벽보다 살짝 어두움 (위치 식별용)
    ctx.font = "bold 64px ui-sans-serif, system-ui, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 세로로 일정 간격 반복 (총 22개 정도, ~100px 간격)
    const gap = 200;
    const startY = 120;
    for (let y = startY; y < H; y += gap) {
      ctx.fillText("@eungyiu", W / 2, y);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    // 텍스처 1장 = 벽 한 면 전체
    tex.repeat.set(1, 1);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

// ── 박스 벽 + 바닥 ────────────────────────────────────────────────────
function Walls() {
  const half = BOX.size / 2;
  const floorColor = "#94a3b8";
  const wallTexture = useWallTexture();

  return (
    <group>
      {/* 바닥 — 전체 24x24, 충돌 가능 */}
      <mesh position={[0, -0.25, 0]} userData={{ type: "floor" }}>
        <boxGeometry args={[BOX.size, 0.5, BOX.size]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>

      {/* 4개 벽 — 텍스처 적용 */}
      <WallPlane x={0}      z={-half}  rotY={0}            texture={wallTexture} />
      <WallPlane x={0}      z={ half}  rotY={Math.PI}      texture={wallTexture} />
      <WallPlane x={-half}  z={0}      rotY={Math.PI / 2}  texture={wallTexture} />
      <WallPlane x={ half}  z={0}      rotY={-Math.PI / 2} texture={wallTexture} />
    </group>
  );
}

function WallPlane({
  x, z, rotY, texture,
}: {
  x: number; z: number; rotY: number; texture: THREE.CanvasTexture;
}) {
  return (
    <mesh position={[x, BOX.height / 2, z]} rotation={[0, rotY, 0]}>
      <planeGeometry args={[BOX.size, BOX.height]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        roughness={0.8}
      />
    </mesh>
  );
}

// ── 장애물(발판) ───────────────────────────────────────────────────────
const VANISH_BASE_OPACITY = 0.55;   // 사라지는 발판 기본 반투명도

function ObstacleMesh({ ob }: { ob: Obstacle }) {
  const ref = useRef<THREE.Mesh>(null);
  const baseRef = useRef<[number, number, number]>([...ob.pos] as [number, number, number]);
  const opacityRef = useRef(ob.type === "vanish" ? VANISH_BASE_OPACITY : 1);
  const visibleRef = useRef(true);
  const vanishStateRef = useRef<{ phase: "idle" | "vanishing" | "gone"; t: number }>({
    phase: "idle",
    t: 0,
  });

  useFrame((state, delta) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();

    if (ob.type === "moving") {
      const offset = Math.sin(time * ob.speed) * ob.range;
      if (ob.axis === "x") {
        ref.current.position.x = baseRef.current[0] + offset;
      } else {
        ref.current.position.z = baseRef.current[2] + offset;
      }
    } else if (ob.type === "rotating") {
      ref.current.rotation.y = time * ob.speed;
    } else if (ob.type === "vanish") {
      const s = vanishStateRef.current;
      const touched = ref.current.userData.touched === true;

      if (s.phase === "idle" && touched) {
        s.phase = "vanishing";
        s.t = 0;
      }
      if (s.phase === "vanishing") {
        s.t += delta;
        if (s.t < 1.0) {
          opacityRef.current = VANISH_BASE_OPACITY * (1 - s.t);
          ref.current.position.y = baseRef.current[1] + Math.sin(s.t * 30) * 0.05;
        } else {
          s.phase = "gone";
          s.t = 0;
          visibleRef.current = false;
        }
      } else if (s.phase === "gone") {
        s.t += delta;
        if (s.t > 3.0) {
          s.phase = "idle";
          s.t = 0;
          opacityRef.current = VANISH_BASE_OPACITY;
          visibleRef.current = true;
          ref.current.position.set(...baseRef.current);
          ref.current.userData.touched = false;
        }
      }

      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.opacity = opacityRef.current;
      ref.current.visible = visibleRef.current;
      ref.current.userData.disabled = !visibleRef.current;
    }
  });

  const isVanish = ob.type === "vanish";

  return (
    <mesh ref={ref} position={ob.pos} userData={{ type: ob.type }}>
      <boxGeometry args={ob.size} />
      <meshStandardMaterial
        color={ob.color}
        roughness={0.4}
        metalness={0.1}
        transparent={isVanish}
        opacity={isVanish ? VANISH_BASE_OPACITY : 1}
      />
    </mesh>
  );
}

// ── 골인 깃발 ─────────────────────────────────────────────────────────
function GoalFlag() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.8;
    ref.current.position.y = GOAL.pos[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.2;
  });

  return (
    <group ref={ref} position={GOAL.pos}>
      <mesh>
        <boxGeometry args={GOAL.size} />
        <meshStandardMaterial
          color="#fde047"
          emissive="#fbbf24"
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[GOAL.size[0] * 1.3, GOAL.size[1] * 1.3, GOAL.size[2] * 1.3]} />
        <meshBasicMaterial color="#fef9c3" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
