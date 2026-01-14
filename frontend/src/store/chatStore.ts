import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChatSession, ChatMessage, AppSettings, ResearchContext } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface ChatStore {
  // State
  sessions: ChatSession[]
  currentSessionId: string | null
  settings: AppSettings
  userId: string | null
  
  // Chat Actions
  createSession: () => string
  loadSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  setResearchContext: (sessionId: string, context: ResearchContext) => void
  
  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => void
  toggleTheme: () => void
  
  // User Actions
  setUserId: (userId: string) => void
  clearUserData: () => void
  
  // Getters
  getCurrentSession: () => ChatSession | null
  getSessionById: (sessionId: string) => ChatSession | null
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  enable_hybrid_search: true,
  enable_ai_images: true,
  debug_mode: false,
  deep_research_enabled: false,
  realtime_research_enabled: false,
  agent_mode_enabled: false,
  selected_model: 'typhoon-v2.5-30b-a3b-instruct',
  selected_search_engine: 'hybrid',
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial State
      sessions: [],
      currentSessionId: null,
      userId: null,
      settings: DEFAULT_SETTINGS,

      // Set user ID and switch to user-specific storage
      setUserId: (userId: string) => {
        set({ userId })
      },

      // Clear user data on logout
      clearUserData: () => {
        set({
          sessions: [],
          currentSessionId: null,
          userId: null,
        })
      },

      // Create new chat session
      createSession: () => {
        const newSession: ChatSession = {
          chat_id: uuidv4(),
          title: 'New Chat',
          timestamp: new Date().toISOString(),
          messages: [],
        }
        
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.chat_id,
        }))
        
        return newSession.chat_id
      },

      // Load existing session
      loadSession: (sessionId: string) => {
        set({ currentSessionId: sessionId })
      },

      // Delete session
      deleteSession: (sessionId: string) => {
        set((state) => {
          const filteredSessions = state.sessions.filter(
            (s) => s.chat_id !== sessionId
          )
          const newCurrentId =
            state.currentSessionId === sessionId
              ? filteredSessions[0]?.chat_id || null
              : state.currentSessionId
          
          return {
            sessions: filteredSessions,
            currentSessionId: newCurrentId,
          }
        })
      },

      // Add message to current session
      addMessage: (message) => {
        const currentSessionId = get().currentSessionId
        if (!currentSessionId) return

        const newMessage: ChatMessage = {
          ...message,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
        }

        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.chat_id === currentSessionId
              ? {
                  ...session,
                  messages: [...session.messages, newMessage],
                  // Auto-update title from first user message
                  title:
                    session.messages.length === 0 && message.role === 'user'
                      ? message.content.slice(0, 50) +
                        (message.content.length > 50 ? '...' : '')
                      : session.title,
                }
              : session
          ),
        }))
      },

      // Update session title
      updateSessionTitle: (sessionId, title) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.chat_id === sessionId ? { ...session, title } : session
          ),
        }))
      },

      // Set research context for session
      setResearchContext: (sessionId, context) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.chat_id === sessionId
              ? { ...session, research_context: context }
              : session
          ),
        }))
      },

      // Update settings
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }))
      },

      // Toggle theme
      toggleTheme: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            theme: state.settings.theme === 'light' ? 'dark' : 'light',
          },
        }))
      },

      // Get current session
      getCurrentSession: () => {
        const state = get()
        return (
          state.sessions.find((s) => s.chat_id === state.currentSessionId) ||
          null
        )
      },

      // Get session by ID
      getSessionById: (sessionId) => {
        return get().sessions.find((s) => s.chat_id === sessionId) || null
      },
    }),
    {
      name: 'ninja-chat-storage',
    }
  )
)

// Helper hook to sync userId with localStorage
export const useSyncUserId = (userId: string | null | undefined) => {
  const setUserId = useChatStore((state) => state.setUserId)
  const clearUserData = useChatStore((state) => state.clearUserData)
  const currentUserId = useChatStore((state) => state.userId)
  
  if (userId && userId !== currentUserId) {
    setUserId(userId)
  } else if (!userId && currentUserId) {
    clearUserData()
  }
}
