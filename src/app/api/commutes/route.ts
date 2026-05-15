import { NextResponse } from "next/server";
import { commutesStore } from "@/lib/server/commutesDb";
import { normalizeText } from "@/lib/types";
import type { CommuteEntry, TimeBand, TransportMode } from "@/lib/types";

export const dynamic = "force-dynamic";

const TIME_BANDS: TimeBand[] = ["출근(06~09)", "퇴근(17~21)", "기타 시간"];
const MODES: TransportMode[] = [
  "버스", "지하철", "도보", "자전거",
  "자동차", "헬리콥터", "UFO", "기타",
];

export async function GET() {
  try {
    const entries = await commutesStore.list();
    return NextResponse.json({ entries, backend: commutesStore.backend });
  } catch (e) {
    return NextResponse.json({ error: "조회 실패", detail: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const routeText = typeof body.routeText === "string" ? normalizeText(body.routeText) : "";
    if (!routeText) return NextResponse.json({ error: "노선/구간을 입력해 주세요" }, { status: 400 });
    if (routeText.length > 80) return NextResponse.json({ error: "노선/구간은 80자 이하" }, { status: 400 });

    if (!TIME_BANDS.includes(body.timeBand)) {
      return NextResponse.json({ error: "잘못된 timeBand" }, { status: 400 });
    }
    if (typeof body.congestion !== "number" || body.congestion < 1 || body.congestion > 5) {
      return NextResponse.json({ error: "혼잡도는 1~5" }, { status: 400 });
    }
    if (typeof body.weeklyCount !== "number" || body.weeklyCount < 1 || body.weeklyCount > 14) {
      return NextResponse.json({ error: "weeklyCount 범위 오류" }, { status: 400 });
    }
    if (!MODES.includes(body.currentMode)) {
      return NextResponse.json({ error: "잘못된 currentMode" }, { status: 400 });
    }
    if (typeof body.satisfaction !== "number" || body.satisfaction < 1 || body.satisfaction > 5) {
      return NextResponse.json({ error: "satisfaction 범위 오류" }, { status: 400 });
    }
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
      routeText,
      timeBand: body.timeBand,
      congestion: body.congestion as 1 | 2 | 3 | 4 | 5,
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
    return NextResponse.json({ error: "저장 실패", detail: String(e) }, { status: 500 });
  }
}
