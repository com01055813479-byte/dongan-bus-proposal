/**
 * 통근 설문 데이터 서버 측 저장소.
 *
 * 환경변수 KV_REST_API_URL + KV_REST_API_TOKEN 이 있으면 Upstash Redis 사용,
 * 없으면 메모리(in-memory) 폴백 — 로컬 개발 시 dev 서버 재시작하면 데이터 날아감.
 */

import { Redis } from "@upstash/redis";
import type { CommuteEntry } from "@/lib/types";

const KEY = "commutes:all";

interface Store {
  list(): Promise<CommuteEntry[]>;
  add(entry: CommuteEntry): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
  /** 백엔드 이름 (디버그/관리자 화면에 표시) */
  backend: string;
}

// ── Upstash Redis 구현 ────────────────────────────────────────────────
class RedisStore implements Store {
  backend = "Upstash Redis";
  private redis: Redis;
  constructor(url: string, token: string) {
    this.redis = new Redis({ url, token });
  }
  async list(): Promise<CommuteEntry[]> {
    const data = await this.redis.get<CommuteEntry[]>(KEY);
    return data ?? [];
  }
  async add(entry: CommuteEntry): Promise<void> {
    const current = await this.list();
    await this.redis.set(KEY, [entry, ...current]);
  }
  async remove(id: string): Promise<void> {
    const current = await this.list();
    await this.redis.set(KEY, current.filter((e) => e.id !== id));
  }
  async clear(): Promise<void> {
    await this.redis.del(KEY);
  }
}

// ── 메모리 폴백 ────────────────────────────────────────────────────────
class MemoryStore implements Store {
  backend = "메모리 (개발용 — 재시작 시 초기화)";
  private items: CommuteEntry[] = [];
  async list() { return [...this.items]; }
  async add(e: CommuteEntry) { this.items = [e, ...this.items]; }
  async remove(id: string) { this.items = this.items.filter((e) => e.id !== id); }
  async clear() { this.items = []; }
}

// ── 싱글톤 ─────────────────────────────────────────────────────────────
// (Next.js 핫리로드에서도 instance 유지)
const globalForStore = globalThis as unknown as { __commutesStore?: Store };

function createStore(): Store {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (url && token) {
    return new RedisStore(url, token);
  }
  console.warn("[commutesDb] KV_REST_API_URL/TOKEN 미설정 — 메모리 폴백 사용");
  return new MemoryStore();
}

export const commutesStore: Store = globalForStore.__commutesStore ?? createStore();
if (process.env.NODE_ENV !== "production") {
  globalForStore.__commutesStore = commutesStore;
}
