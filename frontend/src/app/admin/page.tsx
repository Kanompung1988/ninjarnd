'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  Users,
  Activity,
  Mail,
  TrendingUp,
  Package,
  FileText,
  Loader2,
} from 'lucide-react'
import AdminProtection from '@/components/AdminProtection'

interface User {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  last_login_at: string
  subscription?: {
    plan_name: string
    display_name: string
    status: string
    billing_cycle: string
  }
}

interface SystemStats {
  total_users: number
  active_users: number
  total_sessions: number
  total_messages: number
  total_presentations: number
  users_by_plan: Record<string, number>
  monthly_usage: Record<string, number>
}

interface Plan {
  id: string
  name: string
  display_name: string
  price_monthly: number
  limits: Record<string, any>
  features: string[]
}

function AdminDashboardContent() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'whitelist' | 'audit'>('overview')
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab, session])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const headers = {
        'X-User-Email': session?.user?.email || '',
      }

      if (activeTab === 'overview') {
        const [statsRes, plansRes] = await Promise.all([
          fetch('/api/admin/stats', { headers }),
          fetch('/api/admin/plans', { headers }),
        ])

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data.stats)
        }

        if (plansRes.ok) {
          const data = await plansRes.json()
          setPlans(data.plans)
        }
      } else if (activeTab === 'users') {
        const [usersRes, plansRes] = await Promise.all([
          fetch('/api/admin/users', { headers }),
          fetch('/api/admin/plans', { headers }),
        ])

        if (usersRes.ok) {
          const data = await usersRes.json()
          setUsers(data.users)
        }

        if (plansRes.ok) {
          const data = await plansRes.json()
          setPlans(data.plans)
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-300">Manage users, subscriptions, and system settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'whitelist', label: 'Whitelist', icon: Mail },
            { id: 'audit', label: 'Audit Logs', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">System Overview</h2>

              {/* Stats Grid */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard icon={Users} label="Total Users" value={stats.total_users} />
                  <StatCard icon={Activity} label="Active Users" value={stats.active_users} color="green" />
                  <StatCard icon={Package} label="Chat Sessions" value={stats.total_sessions} color="blue" />
                  <StatCard icon={FileText} label="Messages" value={stats.total_messages} color="purple" />
                </div>
              )}

              {/* Users by Plan */}
              {stats?.users_by_plan && (
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Users by Plan</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.users_by_plan).map(([plan, count]) => (
                      <div key={plan} className="flex justify-between items-center">
                        <span className="text-gray-300">{plan}</span>
                        <span className="text-white font-semibold">{count} users</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">User Management</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left text-gray-300 font-semibold py-3 px-4">Email</th>
                      <th className="text-left text-gray-300 font-semibold py-3 px-4">Name</th>
                      <th className="text-left text-gray-300 font-semibold py-3 px-4">Role</th>
                      <th className="text-left text-gray-300 font-semibold py-3 px-4">Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-white/10">
                        <td className="py-3 px-4 text-white">{user.email}</td>
                        <td className="py-3 px-4 text-gray-300">{user.name || '-'}</td>
                        <td className="py-3 px-4 text-gray-300">{user.role}</td>
                        <td className="py-3 px-4 text-gray-300">
                          {user.subscription?.display_name || 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'whitelist' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Email Whitelist</h2>
              <p className="text-gray-300">Coming soon...</p>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Audit Logs</h2>
              <p className="text-gray-300">Coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = 'purple',
}: {
  icon: any
  label: string
  value: number
  color?: string
}) {
  const colorClasses = {
    purple: 'bg-purple-500/20 text-purple-300',
    green: 'bg-green-500/20 text-green-300',
    blue: 'bg-blue-500/20 text-blue-300',
  }

  return (
    <div className="bg-white/5 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
        <Icon className={`w-8 h-8 ${colorClasses[color as keyof typeof colorClasses]}`} />
      </div>
      <div className="text-3xl font-bold text-white">{value.toLocaleString()}</div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AdminProtection>
      <AdminDashboardContent />
    </AdminProtection>
  )
}
