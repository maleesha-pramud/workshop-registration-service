// Audit trail helper. Always called with the transaction client of the change it
// describes, so the change and its audit entry commit or roll back together.

export const AuditEntity = Object.freeze({
  USER: 'USER',
  WORKSHOP: 'WORKSHOP',
  REGISTRATION: 'REGISTRATION',
});

export function recordAudit(tx, { actorId, action, entityType, entityId, changes = null }) {
  return tx.auditLog.create({
    data: { actorId, action, entityType, entityId, changes: changes ?? undefined },
  });
}

/** Returns { field: { from, to } } for the given fields whose values differ. */
export function diff(before, after, fields) {
  const out = {};
  for (const f of fields) {
    if (!(f in after)) continue;
    const a = normalise(before[f]);
    const b = normalise(after[f]);
    if (a !== b) out[f] = { from: a, to: b };
  }
  return out;
}

function normalise(v) {
  if (v instanceof Date) return v.toISOString();
  return v ?? null;
}
