// Human-friendly labels and colours for enum values coming from the API.

export const ROLE_LABELS = { ADMIN: 'Admin', MANAGER: 'Manager', STAFF: 'Front desk' }

export const WORKSHOP_STATUS = {
  OPEN: { label: 'Open', tone: 'green' },
  CLOSED: { label: 'Registration closed', tone: 'amber' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
  COMPLETED: { label: 'Completed', tone: 'gray' },
}

export const REGISTRATION_STATUS = {
  ACTIVE: { label: 'Attending', tone: 'green' },
  WAITLISTED: { label: 'Waitlist', tone: 'blue' },
  CANCELLED: { label: 'Cancelled', tone: 'gray' },
}

const AUDIT_ACTIONS = {
  USER_CREATED: 'Created account',
  USER_UPDATED: 'Updated account',
  USER_ROLE_CHANGED: 'Changed role',
  USER_DEACTIVATED: 'Deactivated account',
  USER_REACTIVATED: 'Reactivated account',
  USER_PASSWORD_RESET: 'Reset password',
  WORKSHOP_CREATED: 'Created workshop',
  WORKSHOP_UPDATED: 'Edited workshop',
  WORKSHOP_OPEN: 'Opened workshop',
  WORKSHOP_CLOSED: 'Closed registration',
  WORKSHOP_CANCELLED: 'Cancelled workshop',
  WORKSHOP_COMPLETED: 'Marked workshop completed',
  REGISTRATION_CREATED: 'Registered attendee',
  REGISTRATION_WAITLISTED: 'Added to waitlist',
  REGISTRATION_CANCELLED: 'Cancelled registration',
  REGISTRATION_PROMOTED: 'Moved from waitlist to a seat',
}

export const auditActionLabel = (action) => AUDIT_ACTIONS[action] ?? action

const FIELD_LABELS = {
  name: 'Name',
  role: 'Role',
  isActive: 'Active',
  code: 'Code',
  title: 'Title',
  description: 'Description',
  instructor: 'Instructor',
  locationId: 'Location',
  startsAt: 'Starts',
  endsAt: 'Ends',
  capacity: 'Capacity',
  status: 'Status',
  attendeeName: 'Attendee',
  attendeeEmail: 'Email',
  reason: 'Reason',
}

export const fieldLabel = (f) => FIELD_LABELS[f] ?? f
