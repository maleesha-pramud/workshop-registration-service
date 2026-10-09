import { ROLE_LABELS } from '../../utils/labels'
import { formatDate } from '../../utils/dates'
import { Badge, Button } from '../ui'

export function UsersTable({ users, currentUserId, onEdit, onResetPassword }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Added</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.id} className={u.isActive ? '' : 'text-slate-400'}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">
                  {u.name}{' '}
                  {u.id === currentUserId && (
                    <span className="text-xs font-normal text-slate-500">(you)</span>
                  )}
                </p>
                <p className="text-slate-500">{u.email}</p>
              </td>
              <td className="px-4 py-3">{ROLE_LABELS[u.role]}</td>
              <td className="px-4 py-3">
                <Badge tone={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
              </td>
              <td className="whitespace-nowrap px-4 py-3">{formatDate(u.createdAt)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <Button size="sm" variant="ghost" onClick={() => onEdit(u)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onResetPassword(u)}>
                  Reset password
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
