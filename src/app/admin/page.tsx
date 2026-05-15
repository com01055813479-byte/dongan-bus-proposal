"use client";

import { useEffect, useState } from "react";
import { Lock, Download, Trash2, Database, Trash, RefreshCw, Cloud, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCommutes } from "@/lib/hooks/useCommutes";

export default function AdminPage() {
  const {
    entries, userCount, hydrated, error,
    remove, clearAllServer, refetch,
  } = useCommutes();

  const [msg, setMsg] = useState<string | null>(null);
  const [backend, setBackend] = useState<string>("");

  // 백엔드 정보 표시
  useEffect(() => {
    fetch("/api/commutes", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setBackend(d.backend ?? ""))
      .catch(() => setBackend("알 수 없음"));
  }, [userCount]);

  function exportCSV() {
    const header = [
      "id", "createdAt",
      "routeText", "timeBand", "congestion", "weeklyCount",
      "currentMode", "currentMinutes",
      "satisfaction", "expressIntent", "note",
    ].join(",");
    const rows = entries.map((e) => {
      return [
        e.id, e.createdAt,
        `"${(e.routeText ?? "").replace(/"/g, '""')}"`,
        `"${e.timeBand}"`, e.congestion, e.weeklyCount,
        `"${e.currentMode}"`, e.currentMinutes ?? "",
        e.satisfaction, e.expressIntent ?? "",
        `"${(e.note ?? "").replace(/"/g, '""')}"`,
      ].join(",");
    });
    const csv = "﻿" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dongan-commute-survey-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("CSV 내보내기 완료");
    setTimeout(() => setMsg(null), 3000);
  }

  async function handleClearAll() {
    if (!confirm(
      `서버에 누적된 사용자 응답 ${entries.length}건을 모두 삭제합니다.\n` +
      `(시드 샘플 데이터는 코드에 있어 영향 없음)\n\n계속하시겠습니까?`
    )) return;
    try {
      await clearAllServer();
      setMsg(`사용자 응답 전체 삭제 완료`);
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setMsg(`삭제 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function handleDeleteOne(id: string) {
    if (!confirm("이 응답을 삭제할까요?")) return;
    try {
      await remove(id);
    } catch (e) {
      setMsg(`삭제 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const usingRealDB = backend.includes("Redis");

  return (
    <div className="flex flex-col gap-5">
      {/* 어드민 안내 */}
      <div
        className="rounded-2xl px-4 py-3 flex items-start gap-2 text-sm"
        style={{
          backgroundColor: "var(--accent-soft)",
          color: "var(--accent-text)",
        }}
      >
        <Lock size={14} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-bold">어드민 전용 페이지</p>
          <p className="text-xs opacity-80 mt-0.5">
            URL 직접 입력으로만 접근 — 메뉴에 노출되지 않습니다.
          </p>
        </div>
      </div>

      <div className="pt-2 pb-1">
        <p className="text-sm text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
          <Database size={14} />
          관리자 도구
        </p>
        <h1 className="text-2xl font-bold text-[var(--text-strong)] leading-tight">
          전 기기 응답 관리
        </h1>
      </div>

      {/* 백엔드 상태 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center justify-between gap-2 w-full">
              <span className="flex items-center gap-2">
                {usingRealDB ? (
                  <Cloud size={16} className="text-emerald-500" />
                ) : (
                  <HardDrive size={16} className="text-amber-500" />
                )}
                저장소
              </span>
              <button
                onClick={refetch}
                className="text-xs font-normal text-[var(--text-muted)] hover:text-[var(--text-strong)] flex items-center gap-1"
              >
                <RefreshCw size={12} />
                새로고침
              </button>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-base)]">
            {backend || "확인 중..."}
          </p>
          {!usingRealDB && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 leading-relaxed">
              ⚠️ 현재 메모리 저장소 사용 중 — 서버 재시작 시 응답이 사라집니다.
              크로스 디바이스 공유를 위해 Vercel KV 환경변수 설정이 필요합니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>응답 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-center">
            <Stat label="전체 응답" value={hydrated ? `${entries.length}` : "—"} />
            <Stat label="고유 사용자(추정)" value={hydrated ? `${userCount}` : "—"} accent />
          </div>
          {error && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-3 font-semibold">
              조회 오류: {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>데이터 액션</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <Button onClick={exportCSV} variant="secondary" disabled={entries.length === 0}>
            <Download size={16} /> 실제 응답 CSV 내보내기 ({entries.length}건)
          </Button>
          <Button onClick={handleClearAll} variant="danger" disabled={entries.length === 0}>
            <Trash2 size={16} /> 전체 응답 삭제 ({entries.length}건)
          </Button>
          {msg && (
            <div className="text-xs px-3 py-2.5 rounded-lg font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              {msg}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 응답 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>실제 응답 ({entries.length}건)</CardTitle>
        </CardHeader>
        <CardContent>
          {!hydrated ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">불러오는 중...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">
              아직 사용자가 제출한 응답이 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="rounded-xl px-3 py-2.5 bg-[var(--bg-soft)] flex items-start gap-2 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-strong)] truncate">
                      {e.routeText || <span className="italic text-[var(--text-muted)]">(노선 미입력)</span>}
                    </p>
                    <p className="text-[var(--text-muted)] mt-0.5">
                      {e.timeBand} · 혼잡 {e.congestion}/5 · 주{e.weeklyCount}회 · {e.currentMode}
                      {e.currentMinutes !== undefined && ` · ${e.currentMinutes}분`}
                    </p>
                    <p className="text-[var(--text-muted)] mt-0.5">
                      만족도 {e.satisfaction}/5
                      {e.expressIntent !== undefined && ` · 급행 의향 ${e.expressIntent}/5`}
                    </p>
                    {e.note && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-1 italic">&ldquo;{e.note}&rdquo;</p>
                    )}
                    <p className="text-[10px] text-[var(--text-muted)] opacity-70 mt-1 font-mono">
                      {new Date(e.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteOne(e.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition-colors shrink-0"
                    aria-label="삭제"
                  >
                    <Trash size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label, value, muted, accent,
}: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? "bg-[var(--accent-soft)]" : "card"}`}>
      <p className={`text-xs ${muted ? "text-[var(--text-muted)]" : accent ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"}`}>
        {label}
      </p>
      <p className={`text-xl font-bold mt-1 tabular-nums ${accent ? "text-[var(--accent-text)]" : "text-[var(--text-strong)]"}`}>
        {value}
      </p>
    </div>
  );
}
