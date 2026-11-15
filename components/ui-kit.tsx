'use client';

import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import AnimatedNumber from '@/components/animated-number';

/* ============================================================
   SHARED UI PRIMITIVES
   One visual language for every screen: layered glass panels,
   tinted icon tiles, tabular numerals and pill status chips.
   ============================================================ */

export type Tone =
  | 'indigo'
  | 'cyan'
  | 'violet'
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'slate';

export const toneStyles: Record<
  Tone,
  { tile: string; text: string; dot: string; glow: string }
> = {
  indigo: {
    tile: 'bg-indigo-500/12 border-indigo-400/20 text-indigo-300',
    text: 'text-indigo-300',
    dot: 'bg-indigo-400',
    glow: 'from-indigo-500/16',
  },
  cyan: {
    tile: 'bg-cyan-500/12 border-cyan-400/20 text-cyan-300',
    text: 'text-cyan-300',
    dot: 'bg-cyan-400',
    glow: 'from-cyan-500/16',
  },
  violet: {
    tile: 'bg-violet-500/12 border-violet-400/20 text-violet-300',
    text: 'text-violet-300',
    dot: 'bg-violet-400',
    glow: 'from-violet-500/16',
  },
  amber: {
    tile: 'bg-amber-500/12 border-amber-400/20 text-amber-300',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    glow: 'from-amber-500/16',
  },
  emerald: {
    tile: 'bg-emerald-500/12 border-emerald-400/20 text-emerald-300',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    glow: 'from-emerald-500/16',
  },
  rose: {
    tile: 'bg-rose-500/12 border-rose-400/20 text-rose-300',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
    glow: 'from-rose-500/16',
  },
  slate: {
    tile: 'bg-white/[0.06] border-white/10 text-slate-300',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
    glow: 'from-white/10',
  },
};

export function Panel({
  children,
  className = '',
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`${hover ? 'glass-card-hover' : 'glass-card'} rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export function IconTile({
  icon: Icon,
  tone = 'indigo',
  size = 'md',
  className = '',
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const dims = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl';
  const iconDims = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center border ${dims} ${toneStyles[tone].tile} ${className}`}
    >
      <Icon className={iconDims} />
    </span>
  );
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  tone = 'indigo',
  action,
  className = '',
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tone?: Tone;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && <IconTile icon={icon} tone={tone} size="sm" />}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-white">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Rotated axis tick, so full subject names fit under a chart. */
export function AngledAxisTick({
  x,
  y,
  payload,
  fill = '#94a3b8',
  fontSize = 10,
}: any) {
  return (
    <text
      x={x}
      y={y}
      dy={11}
      textAnchor="end"
      transform={`rotate(-22 ${x} ${y})`}
      fontSize={fontSize}
      fill={fill}
    >
      {payload?.value}
    </text>
  );
}

export function StatCard({
  icon,
  label,
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  hint,
  tone = 'indigo',
  progress,
  index = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  hint?: React.ReactNode;
  tone?: Tone;
  progress?: { value: number; variant?: 'safe' | 'warning' | 'danger' | 'brand' };
  index?: number;
}) {
  return (
    <div
      className="glass-card-hover sheen animate-slide-up rounded-2xl p-5"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <IconTile icon={icon} tone={tone} size="sm" />
        {hint && (
          <span className="text-[11px] font-medium text-slate-500">{hint}</span>
        )}
      </div>
      <p className="mt-4 text-[28px] font-semibold leading-none tracking-tight text-white">
        {typeof value === 'number' ? (
          <AnimatedNumber
            value={value}
            decimals={decimals}
            prefix={prefix}
            suffix={suffix}
          />
        ) : (
          <span className="tnum">
            {prefix}
            {value}
            {suffix}
          </span>
        )}
      </p>
      <p className="mt-2 text-xs font-medium text-slate-400">{label}</p>
      {progress && (
        <div className={`meter mt-4 h-1.5 meter-${progress.variant ?? 'brand'}`}>
          <span style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }} />
        </div>
      )}
    </div>
  );
}

export function Meter({
  value,
  variant = 'brand',
  className = '',
}: {
  value: number;
  variant?: 'safe' | 'warning' | 'danger' | 'brand';
  className?: string;
}) {
  return (
    <div className={`meter h-1.5 meter-${variant} ${className}`}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

const statusTone: Record<string, string> = {
  safe: 'status-safe',
  warning: 'status-warning',
  'at-risk': 'status-danger',
};

export function StatusPill({
  status,
  label,
  className = '',
}: {
  status: 'safe' | 'warning' | 'at-risk' | string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`${statusTone[status] ?? 'status-neutral'} px-2.5 py-1 text-[10px] ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === 'safe'
            ? 'bg-emerald-400'
            : status === 'warning'
              ? 'bg-amber-400'
              : status === 'at-risk'
                ? 'bg-rose-400'
                : 'bg-slate-400'
        }`}
      />
      {label}
    </span>
  );
}

export function TrendChip({ trend }: { trend: 'improving' | 'declining' | 'stable' }) {
  const map = {
    improving: { icon: TrendingUp, className: 'text-emerald-300', label: 'Improving' },
    declining: { icon: TrendingDown, className: 'text-rose-300', label: 'Declining' },
    stable: { icon: Minus, className: 'text-slate-400', label: 'Steady' },
  } as const;
  const { icon: Icon, className, label } = map[trend];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: {
  options: { value: T; label: string; icon?: LucideIcon }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.035] p-1 ${className}`}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300 ${
              active
                ? 'bg-gradient-to-r from-indigo-500/90 to-violet-500/85 text-white shadow-[0_10px_24px_-14px_rgba(99,102,241,0.9)]'
                : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'slate',
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <IconTile icon={Icon} tone={tone} />
      <p className="mt-4 text-sm font-semibold text-slate-200">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

export function ChartTooltipCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0f1a]/95 px-3 py-2 text-xs shadow-2xl backdrop-blur">
      {children}
    </div>
  );
}
