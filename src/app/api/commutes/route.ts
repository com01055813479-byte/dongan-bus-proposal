import { NextResponse } from "next/server";
import { commutesStore } from "@/lib/server/commutesDb";
import type { CommuteEntry, TimeBand, TransportMode } from "@/lib/types";

// 항상 동적 — 캐시하지 않음
export const dynamic = "force-dynamic";

// ─── GET: 전체 응답 목록 ──────────────────────────────────────────────
export async function GET() {
  try {
    const entries = await commutesStore.list();
    return NextResponse.json({ entries, backend: commutesStore.backend });
  } catch (e) {
    return NextResponse.json(
      { error: "조회 실패", detail: String(e) },
      { status: 500 }
    );
  }
}

// ─── POST: 새 응답 추가 ──────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 간단한 유효성 검증
    const allowedTimeBands: TimeBand[] = [
      "심야(00~07)", "출근(07~09)", "오전(09~12)", "점심(12~14)",
      "오후(14~17)", "퇴근(17~20)", "야간(20~24)",
    ];
    const allowedModes: TransportMode[] = [
      "마을버스", "시내버스", "지하철", "도보", "자전거", "자가용", "택시", "기타",
    ];
    if (
      typeof body.fromPlaceId !== "string" || !body.fromPlaceId ||
      typeof body.toPlaceId !== "string" || !body.toPlaceId ||
      body.fromPlaceId === body.toPlaceId ||
      !allowedTimeBands.includes(body.timeBand) ||
      !allowedModes.includes(body.currentMode) ||
      typeof body.weeklyCount !== "number" || body.weeklyCount < 1 || body.weeklyCount > 14 ||
      typeof body.satisfaction !== "number" || body.satisfaction < 1 || body.satisfaction > 5
    ) {
      return NextResponse.json({ error: "잘못된 입력값" }, { status: 400 });
    }

    const entry: CommuteEntry = {
      id: crypto.randomUUID(),
      fromPlaceId: body.fromPlaceId,
      toPlaceId:   body.toPlaceId,
      timeBand:    body.timeBand,
      weeklyCount: body.weeklyCount,
      currentMode: body.currentMode,
      satisfaction: body.satisfaction as 1 | 2 | 3 | 4 | 5,
      note: typeof body.note === "string" && body.note.trim() ? body.note.slice(0, 200) : undefined,
      createdAt: new Date().toISOString(),
    };
    await commutesStore.add(entry);
    return NextResponse.json({ entry });
  } catch (e) {
    return NextResponse.json(
      { error: "저장 실패", detail: String(e) },
      { status: 500 }
    );
  }
}
