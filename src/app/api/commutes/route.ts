import { NextResponse } from "next/server";
import { commutesStore } from "@/lib/server/commutesDb";
import { MISSED_FREQS, TRANSIT_METHODS } from "@/lib/types";
import type { CommuteEntry, TimeBand, MissedFreq, TransitMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

const TIME_BANDS: TimeBand[] = [
  "출근(06~09)", "퇴근(17~21)", "학원 하원(21~23)", "기타 시간",
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

    if (!TIME_BANDS.includes(body.timeBand)) {
      return NextResponse.json({ error: "잘못된 timeBand" }, { status: 400 });
    }
    if (typeof body.weeklyCount !== "number" || body.weeklyCount < 0 || body.weeklyCount > 14) {
      return NextResponse.json({ error: "weeklyCount 범위 오류" }, { status: 400 });
    }
    if (!TRANSIT_METHODS.includes(body.transitMethod)) {
      return NextResponse.json({ error: "잘못된 transitMethod" }, { status: 400 });
    }
    if (typeof body.congestion !== "number" || body.congestion < 1 || body.congestion > 5) {
      return NextResponse.json({ error: "혼잡도는 1~5" }, { status: 400 });
    }
    if (!MISSED_FREQS.includes(body.missedBusFreq)) {
      return NextResponse.json({ error: "잘못된 missedBusFreq" }, { status: 400 });
    }
    if (typeof body.satisfaction !== "number" || body.satisfaction < 1 || body.satisfaction > 5) {
      return NextResponse.json({ error: "satisfaction 범위 오류" }, { status: 400 });
    }
    if (typeof body.expressIntent !== "number" || body.expressIntent < 1 || body.expressIntent > 5) {
      return NextResponse.json({ error: "expressIntent 범위 오류" }, { status: 400 });
    }

    const entry: CommuteEntry = {
      id: crypto.randomUUID(),
      timeBand: body.timeBand,
      weeklyCount: body.weeklyCount,
      transitMethod: body.transitMethod as TransitMethod,
      congestion: body.congestion as 1 | 2 | 3 | 4 | 5,
      missedBusFreq: body.missedBusFreq as MissedFreq,
      satisfaction: body.satisfaction as 1 | 2 | 3 | 4 | 5,
      expressIntent: body.expressIntent as 1 | 2 | 3 | 4 | 5,
      note: typeof body.note === "string" && body.note.trim() ? body.note.slice(0, 200) : undefined,
      createdAt: new Date().toISOString(),
    };
    await commutesStore.add(entry);
    return NextResponse.json({ entry });
  } catch (e) {
    return NextResponse.json({ error: "저장 실패", detail: String(e) }, { status: 500 });
  }
}
