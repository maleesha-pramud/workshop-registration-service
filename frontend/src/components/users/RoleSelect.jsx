import { Field } from '../ui'
import { ROLE_LABELS } from '../../utils/labels'

const ROLE_HELP = {
  ADMIN: 'Manages staff accounts only',
  MANAGER: 'Schedules workshops and handles registrations',
  STAFF: 'Registers and cancels attendees',
}

export function RoleSelect({ value, onChange, disabled, error }) {
  return (
    <Field label="Role" error={error} hint={ROLE_HELP[value]}>
      {(props) => (
        <select {...props} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          <option value="STAFF">{ROLE_LABELS.STAFF}</option>
          <option value="MANAGER">{ROLE_LABELS.MANAGER}</option>
          <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
        </select>
      )}
    </Field>
  )
}
