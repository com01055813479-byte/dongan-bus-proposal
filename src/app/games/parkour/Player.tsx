"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PlayerProps {
  spawn: [number, number, number];
  fallY: number;
  goal: { pos: [number, number, number]; size: [number, number, number] };
  box: { size: number; height: number };
  isMobile: boolean;
  mobileInputRef: RefObject<{ moveX: number; moveZ: number; jumpPressed: boolean }>;
  onProgress: (y: number) => void;
  onWin: () => void;
}

// ── 물리 상수 ──────────────────────────────────────────────────────────
const PLAYER_HEIGHT = 1.7;     // 카메라(눈) 높이
const PLAYER_HEAD   = 0.2;     // 눈에서 머리 꼭대기까지
const PLAYER_RADIUS = 0.4;
const WALK_SPEED   = 8;
const JUMP_VELOCITY = 18;      // 점프 2배 강화
const GRAVITY = 22;
const AIR_CONTROL = 0.85;

const Y_AXIS = new THREE.Vector3(0, 1, 0);

export function Player({
  spawn, fallY, goal, box, isMobile, mobileInputRef, onProgress, onWin,
}: PlayerProps) {
  const { camera, gl, scene } = useThree();
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const yaw = useRef(0);
  const pitch = useRef(0);
  const onGround = useRef(false);
  const keys = useRef<Record<string, boolean>>({});

  // 현재 서 있는 발판 추적 (움직임/회전 추종용)
  const stoodRef = useRef<{
    mesh: THREE.Mesh | null;
    lastPos: THREE.Vector3;
    lastRotY: number;
  }>({ mesh: null, lastPos: new THREE.Vector3(), lastRotY: 0 });

  // 부활
  const respawn = () => {
    const [x, y, z] = spawn;
    camera.position.set(x, y + PLAYER_HEIGHT, z);
    velocity.current.set(0, 0, 0);
    stoodRef.current.mesh = null;
  };

  useEffect(() => {
    respawn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 키보드
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const up   = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // PC 마우스 시점 (Pointer Lock)
  useEffect(() => {
    if (isMobile) return;
    const canvas = gl.domElement;
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      const sens = 0.0025;
      yaw.current -= e.movementX * sens;
      pitch.current -= e.movementY * sens;
      pitch.current = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch.current));
    };
    const onClick = () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    };
    canvas.addEventListener("click", onClick);
    document.addEventListener("mousemove", onMove);
    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("mousemove", onMove);
    };
  }, [gl, isMobile]);

  // 모바일 터치 시점 (캔버스 드래그)
  useEffect(() => {
    if (!isMobile) return;
    const canvas = gl.domElement;
    let lastX = 0, lastY = 0;
    let trackingTouchId: number | null = null;

    const onStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.clientX > window.innerWidth / 2 && t.clientY < window.innerHeight - 140) {
          if (trackingTouchId === null) {
            trackingTouchId = t.identifier;
            lastX = t.clientX;
            lastY = t.clientY;
          }
        }
      }
    };
    const onMove = (e: TouchEvent) => {
      if (trackingTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === trackingTouchId) {
          const sens = 0.005;
          yaw.current -= (t.clientX - lastX) * sens;
          pitch.current -= (t.clientY - lastY) * sens;
          pitch.current = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch.current));
          lastX = t.clientX;
          lastY = t.clientY;
        }
      }
    };
    const onEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === trackingTouchId) {
          trackingTouchId = null;
        }
      }
    };
    canvas.addEventListener("touchstart", onStart, { passive: true });
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("touchend", onEnd, { passive: true });
    canvas.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
      canvas.removeEventListener("touchcancel", onEnd);
    };
  }, [gl, isMobile]);

  // ── 메인 루프 ──────────────────────────────────────────────────────
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // ── 0. 발판 따라 움직임 (서 있던 발판이 있으면 그 delta 적용) ──
    if (onGround.current && stoodRef.current.mesh) {
      const m = stoodRef.current.mesh;
      const last = stoodRef.current;

      // 위치 변화 적용
      const dx = m.position.x - last.lastPos.x;
      const dz = m.position.z - last.lastPos.z;
      camera.position.x += dx;
      camera.position.z += dz;

      // 회전 발판: 플레이어를 발판 중심으로 회전
      if (m.userData.type === "rotating") {
        const dRot = m.rotation.y - last.lastRotY;
        const rx = camera.position.x - m.position.x;
        const rz = camera.position.z - m.position.z;
        const cos = Math.cos(dRot);
        const sin = Math.sin(dRot);
        camera.position.x = m.position.x + rx * cos - rz * sin;
        camera.position.z = m.position.z + rx * sin + rz * cos;
        // 시점도 함께 회전 (몰입감)
        yaw.current += dRot;
      }
    }

    // ── 1. 입력 → 방향 ──
    let forward = 0, strafe = 0, wantJump = false;
    if (isMobile) {
      forward = -mobileInputRef.current.moveZ;
      strafe = mobileInputRef.current.moveX;
      wantJump = mobileInputRef.current.jumpPressed;
    } else {
      if (keys.current["KeyW"] || keys.current["ArrowUp"]) forward += 1;
      if (keys.current["KeyS"] || keys.current["ArrowDown"]) forward -= 1;
      if (keys.current["KeyA"] || keys.current["ArrowLeft"]) strafe -= 1;
      if (keys.current["KeyD"] || keys.current["ArrowRight"]) strafe += 1;
      wantJump = !!keys.current["Space"];
    }

    // 카메라 회전 적용
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;

    // yaw 기준 이동 벡터
    const dir = new THREE.Vector3();
    if (forward !== 0 || strafe !== 0) {
      const fx = -Math.sin(yaw.current);
      const fz = -Math.cos(yaw.current);
      const sx = Math.cos(yaw.current);
      const sz = -Math.sin(yaw.current);
      dir.set(fx * forward + sx * strafe, 0, fz * forward + sz * strafe).normalize();
    }

    const speed = WALK_SPEED * (onGround.current ? 1 : AIR_CONTROL);
    velocity.current.x = dir.x * speed;
    velocity.current.z = dir.z * speed;

    if (wantJump && onGround.current) {
      velocity.current.y = JUMP_VELOCITY;
      onGround.current = false;
      stoodRef.current.mesh = null;
    }

    // 중력
    velocity.current.y -= GRAVITY * dt;

    // ── 2. 발판 목록 수집 ──
    const platforms: THREE.Mesh[] = [];
    scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.isMesh && m.userData?.type && !m.userData.disabled) {
        platforms.push(m);
      }
    });

    // ── 3. 수평 이동 (벽 클램프만, 측면 충돌은 점프 방해해서 제거) ──
    let newX = camera.position.x + velocity.current.x * dt;
    let newZ = camera.position.z + velocity.current.z * dt;
    const newY = camera.position.y + velocity.current.y * dt;

    // 벽 클램프
    const wallLimit = box.size / 2 - PLAYER_RADIUS;
    newX = Math.max(-wallLimit, Math.min(wallLimit, newX));
    newZ = Math.max(-wallLimit, Math.min(wallLimit, newZ));

    // ── 4. 수직 이동 + 위/아래 충돌 ──
    const prevFeetY = camera.position.y - PLAYER_HEIGHT;
    const prevHeadY = camera.position.y + PLAYER_HEAD;
    const candFeetY = newY - PLAYER_HEIGHT;
    const candHeadY = newY + PLAYER_HEAD;
    let finalY = newY;
    let landedPlatform: THREE.Mesh | null = null;

    onGround.current = false;

    for (const plat of platforms) {
      const params = (plat.geometry as THREE.BoxGeometry).parameters as
        { width: number; height: number; depth: number };
      const halfW = params.width / 2;
      const halfH = params.height / 2;
      const halfD = params.depth / 2;
      const platTop = plat.position.y + halfH;
      const platBot = plat.position.y - halfH;

      // 수평 겹침 확인 (회전 발판은 로컬 좌표로)
      let inX: boolean, inZ: boolean;
      if (plat.userData.type === "rotating") {
        const local = new THREE.Vector3(newX - plat.position.x, 0, newZ - plat.position.z);
        local.applyAxisAngle(Y_AXIS, -plat.rotation.y);
        inX = Math.abs(local.x) < halfW + PLAYER_RADIUS;
        inZ = Math.abs(local.z) < halfD + PLAYER_RADIUS;
      } else {
        inX = Math.abs(newX - plat.position.x) < halfW + PLAYER_RADIUS;
        inZ = Math.abs(newZ - plat.position.z) < halfD + PLAYER_RADIUS;
      }
      if (!inX || !inZ) continue;

      // 위에서 떨어져 착지
      if (velocity.current.y <= 0 && prevFeetY >= platTop - 0.05 && candFeetY <= platTop + 0.05) {
        finalY = platTop + PLAYER_HEIGHT;
        velocity.current.y = 0;
        onGround.current = true;
        landedPlatform = plat;

        // 사라지는 발판 — 밟으면 사라지기 시작
        if (plat.userData.type === "vanish" && !plat.userData.touched) {
          plat.userData.touched = true;
        }
        break;
      }
      // 아래에서 위로 점프하다 머리가 발판 바닥에 부딪힘
      if (velocity.current.y > 0 && prevHeadY <= platBot + 0.05 && candHeadY >= platBot - 0.05) {
        finalY = platBot - PLAYER_HEAD - 0.01;
        velocity.current.y = 0;
        break;
      }
    }

    // 최종 위치 적용
    camera.position.set(newX, finalY, newZ);

    // ── 5. 발판 추종 정보 갱신 ──
    if (landedPlatform) {
      stoodRef.current.mesh = landedPlatform;
      stoodRef.current.lastPos.copy(landedPlatform.position);
      stoodRef.current.lastRotY = landedPlatform.rotation.y;
    } else if (!onGround.current) {
      stoodRef.current.mesh = null;
    }

    // ── 6. 낙사 체크 ──
    if (camera.position.y < fallY) {
      respawn();
    }

    // ── 7. 진행도 콜백 (HUD 용) ──
    onProgress(camera.position.y - PLAYER_HEIGHT);

    // ── 8. 골인 체크 ──
    const gx = camera.position.x - goal.pos[0];
    const gy = camera.position.y - goal.pos[1];
    const gz = camera.position.z - goal.pos[2];
    if (
      Math.abs(gx) < goal.size[0] / 2 + 0.5 &&
      Math.abs(gz) < goal.size[2] / 2 + 0.5 &&
      Math.abs(gy) < goal.size[1] / 2 + 1
    ) {
      onWin();
    }
  });

  return null;
}
