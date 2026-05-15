import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Toss 스타일 카드 — 깨끗한 단색 배경, 1px 보더, 미세한 그림자.
 */
export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("card rounded-2xl p-5", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3
      className={cn("text-base font-bold", className)}
      style={{ color: "var(--text-strong)" }}
    >
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("", className)}>{children}</div>;
}
