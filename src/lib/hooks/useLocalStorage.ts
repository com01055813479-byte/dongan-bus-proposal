"use client";

import { useState, useEffect } from "react";

/**
 * localStorage와 동기화되는 useState.
 * 페이지를 새로고침해도 데이터가 유지됩니다.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // 클라이언트 마운트 후 localStorage에서 읽기
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored) as T);
      }
    } catch {
      // 파싱 실패 시 initialValue 유지
    }
    setHydrated(true);
  }, [key]);

  // 값이 바뀔 때 localStorage에 저장
  const setStoredValue = (newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next =
        typeof newValue === "function"
          ? (newValue as (prev: T) => T)(prev)
          : newValue;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // 스토리지 용량 초과 등 무시
      }
      return next;
    });
  };

  return [value, setStoredValue, hydrated] as const;
}
