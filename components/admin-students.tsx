'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, GraduationCap, LoaderCircle, Pencil, Plus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

export default function AdminStudents({ adminId }: { adminId: string }) {
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);
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
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load branch data.');
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
      const matchesSearch = !query || [student.name, student.email, student.id, student.branch]
        .some((value) => value.toLowerCase().includes(query));
      return matchesBranch && matchesSearch;
    });
  }, [search, selectedBranch, students]);

  const selectedSummary = branches.find((branch) => branch.name === selectedBranch);

  function openCreateDialog() {
    setEditingStudent(null);
    setForm({ ...emptyForm, branch: selectedBranch === 'all' ? branches[0]?.name || '' : selectedBranch });
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
      toast.error(saveError instanceof Error ? saveError.message : 'Unable to save student.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6" aria-label="Branch and student management">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Building2 className="h-5 w-5 text-cyan-400" /> Branches & Students
          </h2>
          <p className="mt-1 text-sm text-slate-400">Select a branch to inspect its roster and attendance.</p>
        </div>
        <Button onClick={openCreateDialog} disabled={branches.length === 0}>
          <Plus /> Add student
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch) => (
          <button
            key={branch.name}
            type="button"
            aria-pressed={selectedBranch === branch.name}
            onClick={() => setSelectedBranch(branch.name)}
            className={`rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${selectedBranch === branch.name ? 'border-cyan-400/50 bg-cyan-400/[0.08]' : 'border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{branch.name}</p>
                <p className="mt-1 text-xs text-slate-400">{branch.subjectCount} subject sections</p>
              </div>
              <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-slate-200">
                {branch.studentCount} students
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">Recorded attendance</p>
                <p className="mt-1 text-2xl font-semibold text-white">{branch.attendanceRate}%</p>
              </div>
              <div className="text-right text-xs leading-5 text-slate-400">
                <p>{branch.lectureCount} lectures</p>
                <p>{branch.attendanceCount.toLocaleString()} records</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-400 transition-[width]" style={{ width: `${branch.attendanceRate}%` }} />
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-white/10 pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">
              {selectedSummary ? selectedSummary.name : 'All branches'} roster
            </h3>
            {selectedSummary && (
              <p className="mt-1 text-xs text-slate-400">
                Students by year: {Object.entries(selectedSummary.yearCounts).map(([year, count]) => `Y${year} ${count}`).join(' · ')}
              </p>
            )}
          </div>
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students"
              aria-label="Search students"
              className="pl-9"
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/10">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-slate-400">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Loading branch data
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Users className="mx-auto h-5 w-5 text-slate-500" />
              <p className="mt-2 text-sm text-slate-300">No students match this view.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-white/[0.04] text-xs text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Branch / Year</th>
                    <th className="px-4 py-3 font-medium">Division</th>
                    <th className="px-4 py-3 font-medium">Attendance</th>
                    <th className="px-4 py-3 font-medium">Subjects</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-white/[0.025]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{student.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{student.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{student.branch} · Year {student.year}</td>
                      <td className="px-4 py-3 text-slate-300">{student.division}</td>
                      <td className="px-4 py-3">
                        <p className={`font-medium ${student.attendanceRate >= 75 ? 'text-emerald-300' : 'text-amber-300'}`}>
                          {student.attendanceRate}%
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{student.presentCount}/{student.attendanceCount} classes</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{student.subjectCount}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(student)} aria-label={`Edit ${student.name}`}>
                          <Pencil /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isLoading && (
            <div className="border-t border-white/10 px-4 py-2 text-xs text-slate-500">
              Showing {filteredStudents.length} of {selectedSummary?.studentCount ?? students.length} students
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card max-h-[90vh] overflow-y-auto border-white/10 bg-slate-950 text-white sm:max-w-xl">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-white">
              <GraduationCap className="h-5 w-5 text-cyan-400" />
              {editingStudent ? 'Update student' : 'Add student'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Student placement updates their subject enrollments automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveStudent} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium text-slate-300">
                Full name
                <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-slate-300">
                Email address
                <Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-slate-300 sm:col-span-2">
                {editingStudent ? 'New password (optional)' : 'Initial password'}
                <Input
                  required={!editingStudent}
                  minLength={6}
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  autoComplete="new-password"
                  placeholder={editingStudent ? 'Leave blank to keep current password' : 'At least 6 characters'}
                />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-slate-300 sm:col-span-2">
                Branch
                <select
                  required
                  value={form.branch}
                  onChange={(event) => setForm({ ...form, branch: event.target.value })}
                  className="h-9 w-full rounded-md border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  {branches.map((branch) => <option key={branch.name} value={branch.name}>{branch.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-medium text-slate-300">
                Year
                <select
                  value={form.year}
                  onChange={(event) => setForm({ ...form, year: event.target.value })}
                  className="h-9 w-full rounded-md border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  {[1, 2, 3, 4].map((year) => <option key={year} value={year}>Year {year}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-medium text-slate-300">
                Division
                <select
                  value={form.division}
                  onChange={(event) => setForm({ ...form, division: event.target.value })}
                  className="h-9 w-full rounded-md border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  {['A', 'B', 'C'].map((division) => <option key={division} value={division}>Division {division}</option>)}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <LoaderCircle className="animate-spin" />}
                {editingStudent ? 'Save changes' : 'Create student'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}