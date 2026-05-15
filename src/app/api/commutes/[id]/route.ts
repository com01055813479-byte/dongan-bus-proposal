import { NextResponse } from "next/server";
import { commutesStore } from "@/lib/server/commutesDb";

export const dynamic = "force-dynamic";

// ─── DELETE: 단일 응답 삭제 ──────────────────────────────────────────
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    await commutesStore.remove(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "삭제 실패", detail: String(e) },
      { status: 500 }
    );
  }
}
