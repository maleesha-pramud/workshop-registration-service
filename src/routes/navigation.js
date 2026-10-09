// Main navigation. Each entry is shown only to users with its permission,
// and the same permission guards the route itself.
export const NAV_ITEMS = [
  { to: '/workshops', label: 'Workshops', permission: 'WORKSHOPS_READ' },
  { to: '/attendees', label: 'Attendee lookup', permission: 'WORKSHOPS_READ' },
  { to: '/users', label: 'Staff accounts', permission: 'USERS_MANAGE' },
  { to: '/activity', label: 'Activity log', permission: 'AUDIT_READ' },
]

/** The first page a user can actually use, e.g. admins go straight to accounts. */
export function homePathFor(user) {
  const first = NAV_ITEMS.find((item) => user?.permissions?.includes(item.permission))
  return first?.to ?? '/forbidden'
}
