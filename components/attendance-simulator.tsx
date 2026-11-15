'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Gauge, TriangleAlert } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Meter } from '@/components/ui-kit';

interface SimulatorResult {
  currentPercentage: number;
  predictedPercentage: number;
  willReachTarget: boolean;
  projectedStatus: 'safe' | 'warning' | 'at-risk';
  drop: number;
  target: number;
}

interface AttendanceSimulatorProps {
  studentId: string;
  subjectId: string;
  subjectName: string;
}

/**
 * Models the effect of missing upcoming lectures for one subject.
 * Debounced so dragging the slider issues a single request.
 */
export default function AttendanceSimulator({
  studentId,
  subjectId,
  subjectName,
}: AttendanceSimulatorProps) {
  const [missed, setMissed] = useState(3);
  const [result, setResult] = useState<SimulatorResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setResult(null);
    setFailed(false);
    setMissed(3);
  }, [subjectId]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/student/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, subjectId, classesToMiss: missed }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Simulation failed');
        if (active) {
          setResult(data);
          setFailed(false);
        }
      } catch {
        if (active) {
          setResult(null);
          setFailed(true);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [studentId, subjectId, missed]);

  const projected = result?.predictedPercentage ?? 0;
  const variant =
    projected >= 85 ? 'safe' : projected >= 75 ? 'warning' : 'danger';

  return (
    <div className="rounded-xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.07] via-white/[0.02] to-transparent p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/10 text-violet-200">
            <Gauge className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-white">Attendance simulator</p>
            <p className="mt-0.5 text-[10.5px] text-slate-500">
              Model the impact of missing upcoming {subjectName} lectures
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Projected
          </p>
          <div className="mt-0.5 flex items-baseline justify-end gap-2">
            <span className="tnum text-[26px] font-semibold leading-none text-white">
              {result ? projected.toFixed(1) : '—'}
              <span className="text-xs text-slate-500">%</span>
            </span>
            {result && result.drop > 0 && (
              <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-1.5 py-0.5 text-[9.5px] font-semibold text-rose-200">
                −{result.drop.toFixed(1)} pts
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[10.5px]">
          <span className="text-slate-400">Lectures missed</span>
          <span className="tnum rounded-md border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 font-semibold text-white">
            {missed}
          </span>
        </div>
        <Slider
          value={[missed]}
          onValueChange={(value) => setMissed(value[0])}
          min={0}
          max={15}
          step={1}
          aria-label="Number of upcoming lectures missed"
        />
        <div className="mt-1.5 flex justify-between text-[9.5px] text-slate-600">
          <span>Attend all</span>
          <span>Miss 15</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="relative">
          <Meter
            value={isLoading && !result ? 0 : projected}
            variant={variant}
            className="h-2"
          />
          <span
            className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 rounded-full bg-white/45"
            style={{ left: '75%' }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[9.5px] text-slate-500">
          <span>0%</span>
          <span className="text-slate-400">75% threshold</span>
          <span>100%</span>
        </div>
      </div>

      <div className="mt-3.5 flex items-start gap-2 border-t border-white/[0.06] pt-3 text-[10.5px] leading-relaxed">
        {failed ? (
          <span className="text-slate-500">
            Simulation unavailable right now. Try adjusting the slider again.
          </span>
        ) : isLoading && !result ? (
          <span className="text-slate-500">Calculating projection…</span>
        ) : result?.willReachTarget ? (
          <>
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
            <span className="text-emerald-200/80">
              You would still stay above {result.target}% after missing {missed}{' '}
              {missed === 1 ? 'lecture' : 'lectures'}.
            </span>
          </>
        ) : (
          <>
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />
            <span className="text-rose-200/80">
              This would put you below the {result?.target ?? 75}% threshold — attend the
              next lectures to recover.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
