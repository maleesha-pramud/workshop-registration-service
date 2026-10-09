// Single source of truth for "who can do what".
// Routes ask for a permission, never for a role, so changing the matrix is a
// one-line edit here. The same list is sent to the frontend (GET /auth/me) so
// the UI hides what the backend would refuse anyway.

export const ROLES = Object.freeze({ ADMIN: 'ADMIN', MANAGER: 'MANAGER', STAFF: 'STAFF' });

export const PERMISSIONS = Object.freeze({
  // Create user accounts & set roles
  USERS_MANAGE: [ROLES.ADMIN],
  // Add & edit workshops
  WORKSHOPS_WRITE: [ROLES.MANAGER],
  // View workshops, registrations & history
  WORKSHOPS_READ: [ROLES.MANAGER, ROLES.STAFF],
  // Register & cancel attendees
  REGISTRATIONS_WRITE: [ROLES.MANAGER, ROLES.STAFF],
  // Reference data needed by every screen
  LOCATIONS_READ: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  // Audit trail. Admins see account changes, managers see workshop/registration changes.
  AUDIT_READ: [ROLES.ADMIN, ROLES.MANAGER],
});

export function can(role, permission) {
  return PERMISSIONS[permission]?.includes(role) ?? false;
}

export function permissionsFor(role) {
  return Object.keys(PERMISSIONS).filter((p) => can(role, p));
}
