'use client';

import { useId, useMemo } from 'react';

interface SparklineRecord {
  status: 'present' | 'absent';
  date?: string;
}

interface SubjectSparklineProps {
  records: SparklineRecord[];
  status: 'safe' | 'warning' | 'at-risk';
  /** How many of the most recent lectures to plot. */
  window?: number;
  className?: string;
}

const TONES = {
  safe: { stroke: '#34d399', glow: 'rgba(52, 211, 153, 0.22)' },
  warning: { stroke: '#fbbf24', glow: 'rgba(251, 191, 36, 0.22)' },
  'at-risk': { stroke: '#fb7185', glow: 'rgba(251, 113, 133, 0.22)' },
} as const;

const THRESHOLD = 75;

export default function SubjectSparkline({
  records,
  status,
  window = 14,
  className = '',
}: SubjectSparklineProps) {
  const gradientId = useId().replace(/:/g, '');
  const tone = TONES[status];

  const chart = useMemo(() => {
    if (records.length < 2) return null;

    // Cumulative percentage across the whole subject, then plot only the tail —
    // starting a cumulative series at the window edge would always begin at
    // 0% or 100% and read as a cliff that never happened.
    let present = 0;
    const cumulative = records.map((record, index) => {
      if (record.status === 'present') present += 1;
      return (present / (index + 1)) * 100;
    });
    const values = cumulative.slice(-window);
    if (values.length < 2) return null;

    // Keep the scale tight so small movements are visible, but always include
    // the 75% threshold when it is anywhere near the data.
    const min = Math.min(...values, THRESHOLD);
    const max = Math.max(...values, THRESHOLD);
    const pad = Math.max(4, (max - min) * 0.15);
    const lo = Math.max(0, min - pad);
    const hi = Math.min(100, max + pad);
    const span = hi - lo || 1;

    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 30 - ((value - lo) / span) * 28 - 1;
      return { x, y, value };
    });

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const area = `${line} L100,30 L0,30 Z`;
    const thresholdY = 30 - ((THRESHOLD - lo) / span) * 28 - 1;
    const last = points[points.length - 1];

    return {
      line,
      area,
      thresholdY,
      last,
      lectures: values.length,
      current: Math.round(last.value),
    };
  }, [records, window]);

  if (!chart) {
    return (
      <div className={`flex items-center gap-2 text-[10px] text-slate-500 ${className}`}>
        <span className="h-px flex-1 bg-white/10" />
        Not enough lectures yet
        <span className="h-px flex-1 bg-white/10" />
      </div>
    );
  }

  return (
    <div className={`relative h-9 w-full ${className}`}>
      <svg
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`spark-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone.stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={tone.stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1="0"
          y1={chart.thresholdY}
          x2="100"
          y2={chart.thresholdY}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
          className="text-slate-400/30"
        />

        <path d={chart.area} fill={`url(#spark-${gradientId})`} />
        <path
          d={chart.line}
          fill="none"
          stroke={tone.stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <span
        className="pointer-events-none absolute h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: `${chart.last.x}%`,
          top: `${(chart.last.y / 30) * 100}%`,
          backgroundColor: tone.stroke,
          boxShadow: `0 0 0 3px ${tone.glow}`,
        }}
      />

      <span className="sr-only">
        Trend over the last {chart.lectures} lectures: cumulative attendance now {chart.current}%.
      </span>
    </div>
  );
}
