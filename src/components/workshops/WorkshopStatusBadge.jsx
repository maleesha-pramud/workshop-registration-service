import { Badge } from '../ui'
import { WORKSHOP_STATUS } from '../../utils/labels'

export function WorkshopStatusBadge({ status }) {
  const s = WORKSHOP_STATUS[status] ?? { label: status, tone: 'gray' }
  return <Badge tone={s.tone}>{s.label}</Badge>
}
