/**
 * 데이터 저장 추상화 레이어
 *
 * 현재는 브라우저 localStorage 를 백엔드로 사용하지만,
 * 추후 Supabase / Vercel Postgres / Firebase 등으로 옮길 때
 * 이 파일의 구현체만 교체하면 페이지 코드는 그대로 사용 가능.
 *
 * 사용 예:
 *   import { dataStore, STORAGE_KEYS } from "@/lib/storage";
 *   const records = await dataStore.read<SurveyRecord[]>(STORAGE_KEYS.records);
 *   await dataStore.write(STORAGE_KEYS.records, [...records, newRec]);
 *   await dataStore.clearAll();
 */

export const STORAGE_KEYS = {
  commutes:  "commute-entries",          // 통근 설문 입력 누적
  proposals: "proposed-routes",          // 사용자가 만든 노선 시뮬레이션 저장
  settings:  "dongan-app-settings-v1",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export interface DataStore {
  /** 키에 저장된 데이터 읽기. 없으면 null */
  read<T>(key: string): Promise<T | null>;
  /** 데이터 쓰기 (덮어쓰기) */
  write<T>(key: string, value: T): Promise<void>;
  /** 키 삭제 */
  remove(key: string): Promise<void>;
  /** 일반 사용자용 초기화 — 본인 시뮬레이션 저장 + 앱 설정 */
  clearUserData(): Promise<void>;
  /** 동아리원용 초기화 — 누적된 통근 설문 데이터 */
  clearSurveyData(): Promise<void>;
  /** 전체 초기화 — 위 둘 다 */
  clearAll(): Promise<void>;
  /** 백업용: 모든 데이터를 JSON 객체로 반환 */
  exportAll(): Promise<Record<string, unknown>>;
  /** 복원용: JSON 객체로 데이터 일괄 복원 */
  importAll(data: Record<string, unknown>): Promise<void>;
}

// ── localStorage 구현체 ─────────────────────────────────────────────────
class LocalStorageStore implements DataStore {
  async read<T>(key: string): Promise<T | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async write<T>(key: string, value: T): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  }

  async clearUserData(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEYS.proposals);
    window.localStorage.removeItem(STORAGE_KEYS.settings);
  }

  async clearSurveyData(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEYS.commutes);
  }

  async clearAll(): Promise<void> {
    await this.clearUserData();
    await this.clearSurveyData();
  }

  async exportAll(): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = {};
    for (const k of Object.values(STORAGE_KEYS)) {
      out[k] = await this.read(k);
    }
    return out;
  }

  async importAll(data: Record<string, unknown>): Promise<void> {
    for (const k of Object.values(STORAGE_KEYS)) {
      if (data[k] !== undefined && data[k] !== null) {
        await this.write(k, data[k]);
      }
    }
  }
}

/**
 * 앱 전체에서 공유되는 데이터 스토어 인스턴스.
 * 추후 DB 전환 시 다음과 같이만 변경하면 됨:
 *   export const dataStore: DataStore = new SupabaseStore();
 */
export const dataStore: DataStore = new LocalStorageStore();
