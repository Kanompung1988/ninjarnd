'use client'

import { useChatStore } from '@/store/chatStore'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  LogOut,
  Moon,
  Sun,
  Search,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Loader2,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ModelSelector from './ModelSelector'
import ThemeSwitcher from './ThemeSwitcher'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const {
    sessions,
    currentSessionId,
    createSession,
    loadSession,
    deleteSession,
    settings,
    toggleTheme,
  } = useChatStore()
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNewChat = () => {
    const newId = createSession()
    loadSession(newId)
    onClose()
  }

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteSession(sessionId)
    }
  }

  // Desktop collapsed view
  if (isCollapsed) {
    return (
      <div className="hidden lg:flex w-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col items-center py-4 space-y-4">
        {/* Expand Button */}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl ninja-gradient flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        {/* New Chat */}
        <button
          onClick={handleNewChat}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="New chat"
        >
          <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Toggle theme"
        >
          {settings.theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* User Avatar */}
        {session?.user && (
          <div className="mt-auto">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
                {session.user.name?.[0] || session.user.email?.[0] || 'U'}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl ninja-gradient flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  NINJA AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Research Assistant</p>
              </div>
            </div>
            
            {/* Close button (mobile) and Collapse button (desktop) */}
            <div className="flex items-center space-x-1">
              {/* Desktop collapse button */}
              <button
                onClick={onToggleCollapse}
                className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              {/* Mobile close button */}
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Model Selector */}
          <div className="mb-4">
            <ModelSelector />
          </div>

          <div className="flex items-center gap-2 mb-4">
            {/* Theme Switcher */}
            <ThemeSwitcher />
            
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-2.5 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No conversations found' : 'Start a new conversation'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredSessions.map((session) => (
                <button
                  key={session.chat_id}
                  onClick={() => { loadSession(session.chat_id); onClose(); }}
                  className={`w-full group flex items-start space-x-3 p-3 rounded-xl transition-all duration-200 ${
                    currentSessionId === session.chat_id
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 shadow-sm'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <MessageSquare
                    className={`w-4 h-4 mt-1 flex-shrink-0 ${
                      currentSessionId === session.chat_id
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p
                      className={`text-sm font-medium truncate leading-tight ${
                        currentSessionId === session.chat_id
                          ? 'text-purple-700 dark:text-purple-300'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {session.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                      {format(new Date(session.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(session.chat_id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer - User Profile and Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          {session?.user && (
            <div className="flex items-center space-x-3">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full ring-2 ring-purple-500/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                  {session.user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          )}

          {/* Admin Button - Only visible for admin users */}
          {!loadingAdmin && isAdmin && (
            <button
              onClick={() => {
                router.push('/admin')
                onClose()
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold text-sm"
              title="Go to Admin Dashboard"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>
          )}

          {/* Select Plan Button - For all users */}
          <button
            onClick={() => {
              router.push('/upgrade')
              onClose()
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold text-sm"
            title="Upgrade your plan"
          >
            <Zap className="w-4 h-4" />
            <span>Upgrade Plan</span>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="w-full flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 py-2.5 px-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}
