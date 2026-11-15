// Audit trail: every state-changing action is recorded and persisted with the
// database so administrators can see who changed what, and when.
import { randomUUID } from 'node:crypto';
import { getDB, saveDB, type AuditEntry } from './db';

const MAX_ENTRIES = 500;

interface Actor {
  id: string;
  name: string;
  role: AuditEntry['actorRole'];
}

/** Accepts a user id, a student id or a teacher id. */
export function resolveActor(actorId: string | null | undefined): Actor {
  if (!actorId) return { id: 'system', name: 'System', role: 'system' };

  const db = getDB();

  const user = db.users.get(actorId);
  if (user) return { id: user.id, name: user.name, role: user.role };

  const teacher = db.teachers.get(actorId);
  if (teacher) {
    const teacherUser = db.users.get(teacher.userId);
    return { id: teacher.id, name: teacherUser?.name || 'Faculty', role: 'teacher' };
  }

  const student = db.students.get(actorId);
  if (student) {
    const studentUser = db.users.get(student.userId);
    return { id: student.id, name: studentUser?.name || 'Student', role: 'student' };
  }

  return { id: actorId, name: 'Unknown user', role: 'system' };
}

interface RecordAuditInput {
  action: string;
  summary: string;
  actorId?: string | null;
  targetId?: string;
  metadata?: Record<string, string | number | boolean>;
}

export function recordAudit({ action, summary, actorId, targetId, metadata }: RecordAuditInput): void {
  const db = getDB();
  const actor = resolveActor(actorId);

  const entry: AuditEntry = {
    id: `audit-${randomUUID()}`,
    action,
    summary,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    targetId,
    metadata,
    at: new Date(),
  };

  db.audit.set(entry.id, entry);

  // Keep the trail bounded so the JSON store cannot grow without limit.
  if (db.audit.size > MAX_ENTRIES) {
    const oldest = Array.from(db.audit.values())
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(0, db.audit.size - MAX_ENTRIES);
    for (const stale of oldest) db.audit.delete(stale.id);
  }

  saveDB();
}

interface ListAuditOptions {
  limit?: number;
  offset?: number;
  action?: string | null;
  query?: string | null;
}

export function listAudit({ limit = 25, offset = 0, action, query }: ListAuditOptions) {
  const db = getDB();
  const search = query?.trim().toLowerCase() ?? '';

  const entries = Array.from(db.audit.values())
    .filter((entry) => (action ? entry.action === action : true))
    .filter((entry) =>
      search
        ? [entry.summary, entry.actorName, entry.action, entry.targetId ?? ''].some((value) =>
            value.toLowerCase().includes(search)
          )
        : true
    )
    .sort((a, b) => b.at.getTime() - a.at.getTime());

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safeOffset = Math.max(offset, 0);

  return {
    entries: entries.slice(safeOffset, safeOffset + safeLimit),
    total: entries.length,
    actions: Array.from(new Set(Array.from(db.audit.values(), (entry) => entry.action))).sort(),
  };
}
