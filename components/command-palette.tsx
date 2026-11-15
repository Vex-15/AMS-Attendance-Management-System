'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CornerDownLeft, GraduationCap, Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { getNavLinks, type NavRole } from '@/components/app-nav';

interface StudentHit {
  id: string;
  branch: string;
  year: number;
  division: string;
  user: { name: string; email: string };
}

export default function CommandPalette({ role }: { role: NavRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<StudentHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [teacherId, setTeacherId] = useState('');
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const links = useMemo(() => getNavLinks(role), [role]);
  const canBrowseStudents = role !== 'admin';

  // Admins get jump links into the console sections instead of student hits.
  const adminSections = useMemo(
    () =>
      role === 'admin'
        ? [
            { label: 'Overview', href: '/dashboard/admin?tab=overview' },
            { label: 'Trends', href: '/dashboard/admin?tab=trends' },
            { label: 'Data & integrity', href: '/dashboard/admin?tab=data' },
            { label: 'Branches & students', href: '/dashboard/admin?tab=branches' },
            { label: 'Activity log', href: '/dashboard/admin?tab=activity' },
          ]
        : [],
    [role]
  );

  useEffect(() => {
    if (role !== 'teacher') return;
    try {
      const roleData = JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
      if (typeof roleData.id === 'string') setTeacherId(roleData.id);
    } catch {
      /* ignore malformed storage */
    }
  }, [role]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (!isShortcut) return;
      event.preventDefault();
      setOpen((current) => !current);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) return;
    setQuery('');
    setStudents([]);
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || !canBrowseStudents || trimmed.length < 2) {
      setStudents([]);
      return;
    }

    let active = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const scope = teacherId ? `&teacherId=${encodeURIComponent(teacherId)}` : '';
        const response = await fetch(
          `/api/search/students?query=${encodeURIComponent(trimmed)}${scope}`
        );
        const data = await response.json();
        if (active) setStudents(Array.isArray(data.results) ? data.results.slice(0, 6) : []);
      } catch {
        if (active) setStudents([]);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, open, teacherId, canBrowseStudents]);

  const navigate = (href: string) => {
    setOpen(false);
    // Let the dialog close before the route changes.
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => router.push(href), 60);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="group hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] py-1.5 pl-2.5 pr-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-white/15 hover:bg-white/[0.07] hover:text-slate-200 md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="pr-6">Search</span>
        <kbd className="rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9.5px] text-slate-500">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white md:hidden"
      >
        <Search className="h-4 w-4" />
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Command palette"
        description="Jump to a page or find a student"
        className="popover-surface sm:max-w-xl"
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search pages, students or emails…"
        />
        <CommandList className="max-h-[340px]">
          <CommandEmpty className="py-8 text-center text-xs text-slate-500">
            {isSearching ? 'Searching…' : 'No matches found.'}
          </CommandEmpty>

          <CommandGroup heading="Navigate">
            {links.map((link) => (
              <CommandItem
                key={link.href}
                value={`${link.label} ${link.href}`}
                onSelect={() => navigate(link.href)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-slate-200"
              >
                <link.icon className="h-3.5 w-3.5 text-slate-500" />
                {link.label}
                <ArrowRight className="ml-auto h-3 w-3 text-slate-600" />
              </CommandItem>
            ))}
          </CommandGroup>

          {adminSections.length > 0 && (
            <>
              <CommandSeparator className="my-1 h-px bg-white/[0.06]" />
              <CommandGroup heading="Console sections">
                {adminSections.map((section) => (
                  <CommandItem
                    key={section.href}
                    value={`${section.label} ${section.href}`}
                    onSelect={() => navigate(section.href)}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-slate-200"
                  >
                    <ArrowRight className="h-3 w-3 text-slate-600" />
                    {section.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {students.length > 0 && (
            <>
              <CommandSeparator className="my-1 h-px bg-white/[0.06]" />
              <CommandGroup heading="Students">
                {students.map((student) => (
                  <CommandItem
                    key={student.id}
                    value={`${student.user.name} ${student.user.email} ${student.id}`}
                    onSelect={() => navigate(`/dashboard/analytics?student=${student.id}`)}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-slate-200"
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-indigo-300" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-white">
                        {student.user.name}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {student.branch} · Year {student.year} · Div {student.division}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>

        <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <CornerDownLeft className="h-3 w-3" /> open
          </span>
          <span>esc to close</span>
        </div>
      </CommandDialog>
    </>
  );
}
