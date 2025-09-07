export const chartColors = {
  // shadcn-like palette tuned for good contrast on light backgrounds
  categorical: [
    '#ef4444', // red-500
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
    '#22c55e', // green-500
    '#a855f7', // purple-500
    '#06b6d4', // cyan-500
  ],
  grid: '#e5e7eb', // gray-200
  axis: '#111827', // gray-900
  label: '#111827',
  tooltipBg: 'rgba(0,0,0,0.85)',
  tooltipText: '#ffffff',
};

export const ensureFiniteNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value > 100) return 100;
  if (value < -100) return -100;
  return value;
};


