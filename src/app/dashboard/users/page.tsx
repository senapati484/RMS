'use client'
import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'

interface User {
  _id: string
  name: string
  email: string
  role: string
  trustScore: number
  phone?: string
  createdAt: string
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'text-[#F26522] bg-[#F26522]/10',
  STAFF: 'text-blue-400 bg-blue-400/10',
  PORTAL_USER: 'text-white/50 bg-white/5',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => {
      setUsers(d.users || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Users</h1>
        <p className="text-white/40 text-sm mt-1">System user management</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(['ADMIN', 'STAFF', 'PORTAL_USER'] as const).map(role => {
          const count = users.filter(u => u.role === role).length
          return (
            <div key={role} className="liquid-glass border border-white/10 rounded-2xl p-4">
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className="text-white/40 text-xs mt-1">{role.replace('_', ' ')}</div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="liquid-glass border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/40 text-xs font-medium px-6 py-4">User</th>
                <th className="text-left text-white/40 text-xs font-medium px-4 py-4">Role</th>
                <th className="text-left text-white/40 text-xs font-medium px-4 py-4">Trust Score</th>
                <th className="text-left text-white/40 text-xs font-medium px-4 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#F26522]/20 rounded-full flex items-center justify-center">
                        <span className="text-[#F26522] text-xs font-bold">{u.name[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{u.name}</div>
                        <div className="text-white/30 text-xs">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${ROLE_COLORS[u.role] || 'text-white/40 bg-white/5'}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${u.trustScore >= 70 ? 'bg-green-500' : u.trustScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${u.trustScore}%` }}
                        />
                      </div>
                      <span className="text-white/50 text-xs">{u.trustScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-white/40 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="px-6 py-12 text-center text-white/30 text-sm">
              <Users size={32} className="mx-auto mb-3 text-white/10" />
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
