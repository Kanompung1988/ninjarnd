'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'

/**
 * Admin Protection Wrapper Component
 * Checks if user is admin before rendering content
 */
interface AdminProtectionProps {
  children: React.ReactNode
}

export default function AdminProtection({ children }: AdminProtectionProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session?.user?.email) {
      checkAdminAccess()
    }
  }, [status, session, router])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/admin/check', {
        headers: {
          'X-User-Email': session?.user?.email || '',
        },
      })

      setIsAdmin(response.ok)
    } catch (error) {
      console.error('Admin check failed:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-300">Checking access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            {/* Message */}
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Access Denied
            </h1>
            <p className="text-gray-300 text-center mb-8">
              You don't have permission to access the admin dashboard. Only administrators can view this page.
            </p>

            {/* Current User Info */}
            <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Logged in as:</p>
              <p className="text-white font-medium break-all">{session?.user?.email}</p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors font-medium"
              >
                Go to Home
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center mt-6">
              If you believe you should have access, please contact an administrator.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // User is admin, render the protected content
  return <>{children}</>
}
