"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          minHeight: "100vh",
          background: "#f9fafb",
          color: "#1f2937",
          padding: "32px 16px",
          margin: 0,
        }}
      >
        <div
          style={{
            maxWidth: 640,
            margin: "40px auto",
            background: "white",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            오류가 발생했습니다
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            아래 메시지를 그대로 복사해 개발자에게 알려주세요.
          </p>
          <pre
            style={{
              background: "#f3f4f6",
              padding: 12,
              borderRadius: 8,
              fontSize: 12,
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "#dc2626",
            }}
          >
            {error.name}: {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
            {error.stack ? `\n\n${error.stack}` : ""}
          </pre>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              background: "#3182f6",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
