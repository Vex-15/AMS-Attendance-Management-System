'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowRightLeft,
  CalendarPlus,
  ClipboardCheck,
  History,
  LoaderCircle,
  LogIn,
  Pencil,
  Search,
  ShieldAlert,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { EmptyState, Panel } from '@/components/ui-kit';

interface AuditEntry {
  id: string;
  action: string;
  summary: string;
  actorId: string;
  actorName: string;
  actorRole: 'student' | 'teacher' | 'admin' | 'system';
  targetId?: string;
  metadata?: Record<string, string | number | boolean>;
  at: string;
}

const PAGE_SIZE = 20;

const ACTION_META: Record<string, { icon: typeof LogIn; tone: string; label: string }> = {
  'auth.login': { icon: LogIn, tone: 'text-sky-300 border-sky-400/25 bg-sky-400/10', label: 'Sign in' },
  'auth.failed': {
    icon: ShieldAlert,
    tone: 'text-rose-300 border-rose-400/25 bg-rose-400/10',
    label: 'Failed sign in',
  },
  'student.created': {
    icon: UserPlus,
    tone: 'text-emerald-300 border-emerald-400/25 bg-emerald-400/10',
    label: 'Student created',
  },
  'student.updated': {
    icon: Pencil,
    tone: 'text-indigo-300 border-indigo-400/25 bg-indigo-400/10',
    label: 'Student updated',
  },
  'student.moved': {
    icon: ArrowRightLeft,
    tone: 'text-amber-300 border-amber-400/25 bg-amber-400/10',
    label: 'Student moved',
  },
  'student.deleted': {
    icon: UserMinus,
    tone: 'text-rose-300 border-rose-400/25 bg-rose-400/10',
    label: 'Student removed',
  },
  'attendance.marked': {
    icon: ClipboardCheck,
    tone: 'text-violet-300 border-violet-400/25 bg-violet-400/10',
    label: 'Attendance marked',
  },
  'lecture.created': {
    icon: CalendarPlus,
    tone: 'text-cyan-300 border-cyan-400/25 bg-cyan-400/10',
    label: 'Lecture scheduled',
  },
};

const fallbackMeta = {
  icon: Pencil,
  tone: 'text-slate-300 border-white/10 bg-white/[0.04]',
  label: 'Event',
};

export default function AdminActivity({ adminId }: { adminId: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [actions, setActions] = useState<string[]>([]);
  const [action, setAction] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    async (nextOffset: number, replace: boolean) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          adminId,
          limit: String(PAGE_SIZE),
          offset: String(nextOffset),
        });
        if (action !== 'all') params.set('action', action);
        if (query.trim()) params.set('query', query.trim());

        const response = await fetch(`/api/admin/audit?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load activity.');

        setEntries((current) => (replace ? data.entries : [...current, ...data.entries]));
        setTotal(data.total);
        setActions(data.actions || []);
        setError('');
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load activity.');
      } finally {
        setIsLoading(false);
      }
    },
    [adminId, action, query]
  );

  useEffect(() => {
    setOffset(0);
    const timer = setTimeout(() => {
      void load(0, true);
    }, query ? 220 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const loadMore = async () => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    await load(next, false);
  };

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Activity log</h2>
          <p className="mt-1 text-xs text-slate-400">
            Every attendance, roster and sign-in change, newest first.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search activity…"
            aria-label="Search activity log"
            className="glass-input h-9 w-full rounded-lg pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-white/[0.05] px-5 py-3">
        {['all', ...actions].map((value) => {
          const meta = value === 'all' ? null : ACTION_META[value] ?? fallbackMeta;
          const active = action === value;
          return (
            <button
              key={value}
              onClick={() => setAction(value)}
              className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition-colors ${
                active
                  ? 'border-indigo-400/30 bg-indigo-500/15 text-indigo-200'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-200'
              }`}
            >
              {value === 'all' ? 'All events' : (meta?.label ?? value)}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="px-6 py-4 text-xs text-rose-300">{error}</p>
      )}

      {isLoading && entries.length === 0 ? (
        <div className="space-y-2 p-5">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-14 rounded-xl skeleton-sheen" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Marking attendance or editing the roster will show up here."
        />
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {entries.map((entry) => {
            const meta = ACTION_META[entry.action] ?? fallbackMeta;
            const Icon = meta.icon;
            return (
              <li key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.tone}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-snug text-white">{entry.summary}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-slate-500">
                    <span className="font-medium text-slate-400">{entry.actorName}</span>
                    <span>·</span>
                    <span className="capitalize">{entry.actorRole}</span>
                    {entry.metadata?.email && (
                      <>
                        <span>·</span>
                        <span className="truncate">{String(entry.metadata.email)}</span>
                      </>
                    )}
                  </div>
                </div>
                <time
                  className="shrink-0 text-[10.5px] text-slate-500"
                  dateTime={entry.at}
                  title={new Date(entry.at).toLocaleString()}
                >
                  {formatDistanceToNow(new Date(entry.at), { addSuffix: true })}
                </time>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-3 text-[11px] text-slate-500">
        <span>
          Showing {entries.length} of {total} events
        </span>
        {entries.length < total && (
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="btn-soft inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold disabled:opacity-60"
          >
            {isLoading && <LoaderCircle className="h-3 w-3 animate-spin" />}
            Load more
          </button>
        )}
      </div>
    </Panel>
  );
}
