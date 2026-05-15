"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PageError]", error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto mt-10 card rounded-2xl p-6">
      <h1 className="text-lg font-bold text-[var(--text-strong)] mb-2">
        페이지를 표시할 수 없습니다
      </h1>
      <p className="text-xs text-[var(--text-muted)] mb-3">
        아래 메시지를 그대로 복사해 알려주세요.
      </p>
      <pre className="bg-[var(--bg-soft)] rounded-lg p-3 text-xs text-rose-600 dark:text-rose-400 overflow-x-auto whitespace-pre-wrap break-words">
        {error.name}: {error.message}
        {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        {error.stack ? `\n\n${error.stack}` : ""}
      </pre>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold"
      >
        다시 시도
      </button>
    </div>
  );
}
