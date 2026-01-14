'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Menu,
  Brain,
  MessageSquare,
  Search,
  FileText,
  Settings,
  Sparkles,
  Shield,
  Loader2,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

interface HeaderProps {
  onToggleSidebar: () => void
  activeTab: 'chat' | 'slides'
  onTabChange: (tab: 'chat' | 'slides') => void
}

export default function Header({ onToggleSidebar, activeTab, onTabChange }: HeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loadingAdmin, setLoadingAdmin] = useState(true)

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user?.email) {
        setLoadingAdmin(false)
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
        setLoadingAdmin(false)
      }
    }

    checkAdminStatus()
  }, [session])

  const tabs = [
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { id: 'slides' as const, label: 'Presentations', icon: FileText },
  ]

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 
                       bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl 
                       sticky top-0 z-30 transition-all duration-300
                       shadow-sm dark:shadow-purple-500/5">
      <div className="h-full flex items-center justify-between px-4 animate-fade-in">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Hamburger Menu (Mobile) */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                       transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Logo with Animation */}
          <div className="flex items-center space-x-3 animate-slide-in-left">
            <div className="w-9 h-9 rounded-xl ninja-gradient flex items-center justify-center 
                          shadow-lg hover:shadow-purple-500/50 transition-all duration-300
                          hover:scale-110 animate-float">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gradient">
                NINJA AI
              </h1>
              <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Center Section - Tabs with Enhanced Style */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800/50 
                        rounded-xl p-1 backdrop-blur-sm border border-gray-200 dark:border-gray-700
                        animate-scale-in">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg 
                  transition-all duration-300 transform
                  ${activeTab === tab.id 
                    ? 'bg-white dark:bg-gray-700 shadow-lg text-purple-600 dark:text-purple-400 scale-105' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:scale-105'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-bounce-in' : ''}`} />
                <span className="hidden sm:inline text-sm font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 
                                 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Right Section - User with Animation */}
        <div className="flex items-center space-x-3 animate-slide-in-right">
          {/* Admin Button */}
          {!loadingAdmin && isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold text-sm"
              title="Go to Admin Dashboard"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {session?.user && (
            <div className="flex items-center space-x-3 group">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white 
                             group-hover:text-gradient transition-all duration-300">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session.user.email}
                </p>
              </div>
              {session.user.image ? (
                <div className="relative">
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={40}
                    height={40}
                    className="rounded-full ring-2 ring-purple-500/20 
                             group-hover:ring-4 group-hover:ring-purple-500/40
                             transition-all duration-300 hover:scale-110"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 
                                 rounded-full border-2 border-white dark:border-gray-900
                                 animate-pulse" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 
                              flex items-center justify-center text-white font-semibold
                              ring-2 ring-purple-500/20 group-hover:ring-4 group-hover:ring-purple-500/40
                              transition-all duration-300 hover:scale-110 animate-gradient"
                     style={{ backgroundSize: '200% 200%' }}>
                  {session.user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
