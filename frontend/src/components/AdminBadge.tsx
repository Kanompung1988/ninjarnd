'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shield, Loader2 } from 'lucide-react'

/**
 * Admin Badge Component
 * Shows admin badge and provides link to admin dashboard (only for admins)
 */
export default function AdminBadge() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user?.email) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/admin/check', {
          headers: {
            'X-User-Email': session.user.email,
          },
        })

        setIsAdmin(response.ok)
      } catch (error) {
        console.error('Failed to check admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [session])

  if (loading) {
    return (
      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse">
        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <button
      onClick={() => router.push('/admin')}
      title="Go to Admin Dashboard"
      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold text-sm"
    >
      <Shield className="w-4 h-4" />
      <span>Admin</span>
    </button>
  )
}

/**
 * Compact admin badge for status display
 */
export function AdminBadgeCompact() {
  const { data: session } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user?.email) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/admin/check', {
          headers: {
            'X-User-Email': session.user.email,
          },
        })

        setIsAdmin(response.ok)
      } catch (error) {
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [session])

  if (loading || !isAdmin) {
    return null
  }

  return (
    <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
      <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
        Admin
      </span>
    </div>
  )
}
