export function formatDuration(seconds: number): string {
  if (seconds < 60) return `약 ${seconds}초`;
  const min = Math.round(seconds / 60);
  return `약 ${min}분`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function scoreToColorClass(score: number): string {
  if (score <= 30) return "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10";
  if (score <= 55) return "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10";
  if (score <= 75) return "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10";
  return "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10";
}

export function scoreToBadgeClass(score: number): string {
  if (score <= 30) return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (score <= 55) return "bg-amber-50  dark:bg-amber-500/10  text-amber-700  dark:text-amber-300";
  if (score <= 75) return "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300";
  return "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300";
}

export function scoreToBarColor(score: number): string {
  if (score <= 30) return "bg-emerald-500";
  if (score <= 55) return "bg-amber-500";
  if (score <= 75) return "bg-orange-500";
  return "bg-rose-500";
}
