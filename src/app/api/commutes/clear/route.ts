import { NextResponse } from "next/server";
import { commutesStore } from "@/lib/server/commutesDb";

export const dynamic = "force-dynamic";

// ─── POST: 전체 삭제 (관리자) ────────────────────────────────────────
export async function POST() {
  try {
    await commutesStore.clear();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "초기화 실패", detail: String(e) },
      { status: 500 }
    );
  }
}
