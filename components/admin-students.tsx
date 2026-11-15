'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  GraduationCap,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState, Meter, SectionHeader } from '@/components/ui-kit';

interface BranchSummary {
  name: string;
  studentCount: number;
  subjectCount: number;
  lectureCount: number;
  attendanceCount: number;
  attendanceRate: number;
  yearCounts: Record<string, number>;
}

interface AdminStudent {
  id: string;
  name: string;
  email: string;
  branch: string;
  year: number;
  division: string;
  attendanceRate: number;
  presentCount: number;
  attendanceCount: number;
  subjectCount: number;
}

interface StudentForm {
  name: string;
  email: string;
  password: string;
  branch: string;
  year: string;
  division: string;
}

const emptyForm: StudentForm = {
  name: '',
  email: '',
  password: '',
  branch: '',
  year: '1',
  division: 'A',
};

const PAGE_SIZE = 20;

const fieldClass =
  'h-9 w-full rounded-lg border border-white/[0.09] bg-white/[0.035] px-3 text-sm text-white outline-none transition-colors focus:border-indigo-400/50 focus:bg-white/[0.055]';

export default function AdminStudents({ adminId }: { adminId: string }) {
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<AdminStudent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<StudentForm>(emptyForm);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    fetch(`/api/admin/students?adminId=${encodeURIComponent(adminId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load branch data.');
        return data;
      })
      .then((data: { branches: BranchSummary[]; students: AdminStudent[] }) => {
        if (!isActive) return;
        setBranches(data.branches);
        setStudents(data.students);
        setError('');
      })
      .catch((fetchError: unknown) => {
        if (!isActive) return;
        setError(
          fetchError instanceof Error ? fetchError.message : 'Unable to load branch data.'
        );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [adminId, refreshKey]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesBranch = selectedBranch === 'all' || student.branch === selectedBranch;
      const matchesSearch =
        !query ||
        [student.name, student.email, student.id, student.branch].some((value) =>
          value.toLowerCase().includes(query)
        );
      return matchesBranch && matchesSearch;
    });
  }, [search, selectedBranch, students]);

  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const pagedStudents = useMemo(
    () => filteredStudents.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredStudents, page]
  );

  // A new filter always starts from the first page.
  useEffect(() => {
    setPage(0);
  }, [search, selectedBranch]);

  const selectedSummary = branches.find((branch) => branch.name === selectedBranch);

  function openCreateDialog() {
    setEditingStudent(null);
    setForm({
      ...emptyForm,
      branch: selectedBranch === 'all' ? branches[0]?.name || '' : selectedBranch,
    });
    setDialogOpen(true);
  }

  function openEditDialog(student: AdminStudent) {
    setEditingStudent(student);
    setForm({
      name: student.name,
      email: student.email,
      password: '',
      branch: student.branch,
      year: String(student.year),
      division: student.division,
    });
    setDialogOpen(true);
  }

  async function saveStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/students', {
        method: editingStudent ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          adminId,
          studentId: editingStudent?.id,
          year: Number(form.year),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save student.');

      setSelectedBranch(form.branch);
      setDialogOpen(false);
      setRefreshKey((value) => value + 1);
      toast.success(editingStudent ? 'Student details updated.' : 'Student added to the branch.');
    } catch (saveError) {
      toast.error(
        saveError instanceof Error ? saveError.message : 'Unable to save student.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteStudent() {
    if (!deletingStudent) return;
    setIsDeleting(true);

    try {
      const response = await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, studentId: deletingStudent.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to remove student.');

      toast.success(`${deletingStudent.name} was removed from the roster.`);
      setDeletingStudent(null);
      setRefreshKey((value) => value + 1);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : 'Unable to remove student.'
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="space-y-6" aria-label="Branch and student management">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          icon={Building2}
          tone="cyan"
          title="Branches & students"
          subtitle="Select a branch to inspect its roster and attendance."
        />
        <button
          onClick={openCreateDialog}
          disabled={branches.length === 0}
          className="gradient-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          Add student
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? [...Array(3)].map((_, i) => (
              <div key={i} className="h-[152px] rounded-xl skeleton-sheen" />
            ))
          : branches.map((branch) => {
              const active = selectedBranch === branch.name;
              return (
                <button
                  key={branch.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedBranch(branch.name)}
                  className={`group rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                    active
                      ? 'border-cyan-400/40 bg-cyan-400/[0.07] shadow-[0_20px_40px_-28px_rgba(34,211,238,0.6)]'
                      : 'border-white/[0.08] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                          active
                            ? 'border-cyan-400/30 bg-cyan-400/15 text-cyan-200'
                            : 'border-white/10 bg-white/[0.05] text-slate-300'
                        }`}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white">
                          {branch.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {branch.subjectCount} subject sections
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-slate-300">
                      {branch.studentCount}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500">Attendance</p>
                      <p className="tnum mt-0.5 text-xl font-semibold text-white">
                        {branch.attendanceRate}%
                      </p>
                    </div>
                    <div className="text-right text-[10px] leading-5 text-slate-500">
                      <p>{branch.lectureCount} lectures</p>
                      <p>{branch.attendanceCount.toLocaleString()} records</p>
                    </div>
                  </div>
                  <Meter
                    value={branch.attendanceRate}
                    variant={
                      branch.attendanceRate >= 85
                        ? 'safe'
                        : branch.attendanceRate >= 75
                          ? 'warning'
                          : 'danger'
                    }
                    className="mt-3"
                  />
                </button>
              );
            })}
      </div>

      <div className="border-t border-white/[0.06] pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {selectedSummary ? selectedSummary.name : 'All branches'} roster
            </h3>
            {selectedSummary && (
              <p className="mt-1 text-[10.5px] text-slate-500">
                Students by year:{' '}
                {Object.entries(selectedSummary.yearCounts)
                  .map(([year, count]) => `Y${year} ${count}`)
                  .join(' · ')}
              </p>
            )}
          </div>
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students"
              aria-label="Search students"
              className="h-9 w-full rounded-lg border border-white/[0.09] bg-white/[0.035] pl-9 pr-3 text-xs text-white outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-400/50"
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/[0.07]">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-14 text-xs text-slate-400">
              <LoaderCircle className="h-4 w-4 animate-spin text-cyan-300" />
              Loading branch data…
            </div>
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students match this view"
              description="Try a different branch or clear the search field."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-premium w-full min-w-[720px] text-left">
                <thead>
                  <tr>
                    {['Student', 'Branch / Year', 'Division', 'Attendance', 'Subjects', ''].map(
                      (heading, i) => (
                        <th
                          key={heading || i}
                          className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 ${
                            i === 5 ? 'text-right' : ''
                          }`}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pagedStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[10px] font-semibold text-slate-300">
                            {student.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-white">
                              {student.name}
                            </p>
                            <p className="truncate text-[10px] text-slate-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-300">
                        {student.branch} · Year {student.year}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-400">{student.division}</td>
                      <td className="px-4 py-3">
                        <p
                          className={`tnum text-[12px] font-semibold ${
                            student.attendanceRate >= 75 ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          {student.attendanceRate}%
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {student.presentCount}/{student.attendanceCount} classes
                        </p>
                      </td>
                      <td className="tnum px-4 py-3 text-[11px] text-slate-400">
                        {student.subjectCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditDialog(student)}
                            aria-label={`Edit ${student.name}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[10.5px] font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingStudent(student)}
                            aria-label={`Remove ${student.name}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-500 transition-colors hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isLoading && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-4 py-2.5 text-[10.5px] text-slate-500">
              <span>
                Showing {filteredStudents.length} of{' '}
                {selectedSummary?.studentCount ?? students.length} students
                {pageCount > 1 && ` · page ${page + 1} of ${pageCount}`}
              </span>
              {pageCount > 1 && (
                <span className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    disabled={page === 0}
                    className="btn-soft rounded-md px-2 py-1 text-[10.5px] font-semibold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                    disabled={page >= pageCount - 1}
                    className="btn-soft rounded-md px-2 py-1 text-[10.5px] font-semibold disabled:opacity-40"
                  >
                    Next
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl text-white shadow-2xl sm:max-w-xl">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2.5 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                <GraduationCap className="h-4 w-4" />
              </span>
              {editingStudent ? 'Update student' : 'Add student'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Student placement updates their subject enrollments automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveStudent} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Full name
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  autoComplete="name"
                  className={`${fieldClass} normal-case tracking-normal`}
                />
              </label>
              <label className="space-y-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Email address
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  autoComplete="email"
                  className={`${fieldClass} normal-case tracking-normal`}
                />
              </label>
              <label className="space-y-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500 sm:col-span-2">
                {editingStudent ? 'New password (optional)' : 'Initial password'}
                <input
                  required={!editingStudent}
                  minLength={6}
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  autoComplete="new-password"
                  placeholder={
                    editingStudent
                      ? 'Leave blank to keep current password'
                      : 'At least 6 characters'
                  }
                  className={`${fieldClass} normal-case tracking-normal`}
                />
              </label>
              <label className="space-y-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500 sm:col-span-2">
                Branch
                <select
                  required
                  value={form.branch}
                  onChange={(event) => setForm({ ...form, branch: event.target.value })}
                  className={`${fieldClass} normal-case tracking-normal`}
                >
                  {branches.map((branch) => (
                    <option key={branch.name} value={branch.name} className="bg-[#0a0d16]">
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Year
                <select
                  value={form.year}
                  onChange={(event) => setForm({ ...form, year: event.target.value })}
                  className={`${fieldClass} normal-case tracking-normal`}
                >
                  {[1, 2, 3, 4].map((year) => (
                    <option key={year} value={year} className="bg-[#0a0d16]">
                      Year {year}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Division
                <select
                  value={form.division}
                  onChange={(event) => setForm({ ...form, division: event.target.value })}
                  className={`${fieldClass} normal-case tracking-normal`}
                >
                  {['A', 'B', 'C'].map((division) => (
                    <option key={division} value={division} className="bg-[#0a0d16]">
                      Division {division}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-4">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="btn-soft px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="gradient-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
              >
                {isSaving && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                {editingStudent ? 'Save changes' : 'Create student'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingStudent !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingStudent(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl text-white">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-base font-semibold text-white">
              Remove {deletingStudent?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[11.5px] leading-relaxed text-slate-400">
              This deletes the student account together with their enrollments and{' '}
              {deletingStudent?.attendanceCount ?? 0} attendance records. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="btn-soft border-white/10 bg-transparent px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <button
              type="button"
              onClick={deleteStudent}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/25 bg-rose-500/15 px-4 py-2 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/25 disabled:opacity-60"
            >
              {isDeleting && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
              Remove student
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
