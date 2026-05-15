"use client";

import { useEffect, useState, useCallback } from "react";
import { SAMPLE_COMMUTES } from "@/data/sampleCommutes";
import type { CommuteEntry } from "@/lib/types";

/**
 * 통근 설문 데이터 hook.
 *  - 서버 API(/api/commutes) 로부터 실제 응답을 불러옴 (모든 기기 공유)
 *  - 시드 샘플 데이터와 합쳐서 반환
 */
export function useCommutes() {
  const [serverEntries, setServerEntries] = useState<CommuteEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/commutes", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "조회 실패");
      setServerEntries(data.entries ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const add = useCallback(async (entry: Omit<CommuteEntry, "id" | "createdAt">) => {
    const res = await fetch("/api/commutes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "저장 실패");
    // 낙관적 업데이트
    setServerEntries((prev) => [data.entry, ...prev]);
    return data.entry as CommuteEntry;
  }, []);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/commutes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "삭제 실패");
    }
    setServerEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAllServer = useCallback(async () => {
    const res = await fetch("/api/commutes/clear", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "초기화 실패");
    }
    setServerEntries([]);
  }, []);

  // 시드(35) + 서버(N) — 분석/제안 페이지에서 사용
  const entries = [...serverEntries, ...SAMPLE_COMMUTES];

  return {
    entries,
    serverEntries,         // 실제 사용자 응답만
    sampleCount: SAMPLE_COMMUTES.length,
    userCount: serverEntries.length,
    hydrated,
    error,
    add,
    remove,
    clearAllServer,
    refetch: fetchAll,
  };
}
