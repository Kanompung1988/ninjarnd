'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import Sidebar from '@/components/Sidebar'
import ChatInterface from '@/components/ChatInterface'
import PresentationPanel from '@/components/PresentationPanel'
import Header from '@/components/Header'
import ThemeDebug from '@/components/ThemeDebug'
import { Loader2 } from 'lucide-react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { currentSessionId, createSession, setUserId, clearUserData } = useChatStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'slides'>('chat')

  // Sync user ID with session
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      setUserId(session.user.email)
    } else if (status === 'unauthenticated') {
      clearUserData()
    }
  }, [status, session, setUserId, clearUserData])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    // Create initial session if none exists
    if (status === 'authenticated' && !currentSessionId) {
      createSession()
    }
  }, [status, currentSessionId, createSession])

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === 'true')
    }
  }, [])

  // Save collapsed state to localStorage
  const handleToggleCollapse = () => {
    const newCollapsed = !sidebarCollapsed
    setSidebarCollapsed(newCollapsed)
    localStorage.setItem('sidebarCollapsed', String(newCollapsed))
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'chat' && (
            <div className="flex-1 overflow-hidden">
              <ChatInterface />
            </div>
          )}
          {activeTab === 'slides' && (
            <PresentationPanel />
          )}
        </div>
      </div>

      {/* Theme Debug - Development Only */}
      <ThemeDebug />
    </div>
  )
}
