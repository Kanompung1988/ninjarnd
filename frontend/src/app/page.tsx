'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      router.push('/dashboard')
    } else {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ninja-dark via-purple-900 to-blue-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
        <p className="text-white text-lg">Loading NINJA Research System...</p>
      </div>
    </div>
  )
}
