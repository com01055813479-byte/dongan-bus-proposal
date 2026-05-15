import { NextResponse } from "next/server";
import { commutesStore } from "@/lib/server/commutesDb";
import type { CommuteEntry, TimeBand, TransportMode } from "@/lib/types";

export const dynamic = "force-dynamic";

const TIME_BANDS: TimeBand[] = ["출근(06~09)", "퇴근(17~21)", "기타 시간"];
const MODES: TransportMode[] = [
  "마을버스", "시내버스", "지하철", "도보",
  "자전거", "자가용", "택시", "기타",
];

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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 필수 필드 검증
    if (typeof body.fromPlaceId !== "string" || !body.fromPlaceId) {
      return NextResponse.json({ error: "fromPlaceId 누락" }, { status: 400 });
    }
    if (typeof body.toPlaceId !== "string" || !body.toPlaceId) {
      return NextResponse.json({ error: "toPlaceId 누락" }, { status: 400 });
    }
    if (body.fromPlaceId === body.toPlaceId && body.fromPlaceId !== "other") {
      return NextResponse.json({ error: "출발지·도착지가 같습니다" }, { status: 400 });
    }
    if (!TIME_BANDS.includes(body.timeBand)) {
      return NextResponse.json({ error: "잘못된 timeBand" }, { status: 400 });
    }
    if (!MODES.includes(body.currentMode)) {
      return NextResponse.json({ error: "잘못된 currentMode" }, { status: 400 });
    }
    if (typeof body.weeklyCount !== "number" || body.weeklyCount < 1 || body.weeklyCount > 14) {
      return NextResponse.json({ error: "weeklyCount 범위 오류" }, { status: 400 });
    }
    if (typeof body.satisfaction !== "number" || body.satisfaction < 1 || body.satisfaction > 5) {
      return NextResponse.json({ error: "satisfaction 범위 오류" }, { status: 400 });
    }
    // "기타" 선택 시 직접 입력 텍스트 필수
    if (body.fromPlaceId === "other" && !(typeof body.fromCustomText === "string" && body.fromCustomText.trim())) {
      return NextResponse.json({ error: "출발지 직접 입력 필요" }, { status: 400 });
    }
    if (body.toPlaceId === "other" && !(typeof body.toCustomText === "string" && body.toCustomText.trim())) {
      return NextResponse.json({ error: "도착지 직접 입력 필요" }, { status: 400 });
    }
    // 선택 필드 검증
    if (
      body.currentMinutes !== undefined &&
      (typeof body.currentMinutes !== "number" || body.currentMinutes < 0 || body.currentMinutes > 240)
    ) {
      return NextResponse.json({ error: "currentMinutes 범위 오류" }, { status: 400 });
    }
    if (
      body.expressIntent !== undefined &&
      (typeof body.expressIntent !== "number" || body.expressIntent < 1 || body.expressIntent > 5)
    ) {
      return NextResponse.json({ error: "expressIntent 범위 오류" }, { status: 400 });
    }

    const entry: CommuteEntry = {
      id: crypto.randomUUID(),
      fromPlaceId: body.fromPlaceId,
      fromCustomText: body.fromPlaceId === "other" ? String(body.fromCustomText).slice(0, 80) : undefined,
      toPlaceId: body.toPlaceId,
      toCustomText: body.toPlaceId === "other" ? String(body.toCustomText).slice(0, 80) : undefined,
      timeBand:    body.timeBand,
      weeklyCount: body.weeklyCount,
      currentMode: body.currentMode,
      currentMinutes: typeof body.currentMinutes === "number" ? body.currentMinutes : undefined,
      satisfaction: body.satisfaction as 1 | 2 | 3 | 4 | 5,
      expressIntent: typeof body.expressIntent === "number" ? (body.expressIntent as 1 | 2 | 3 | 4 | 5) : undefined,
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
