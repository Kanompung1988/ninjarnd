'use client'

import { useChatStore } from '@/store/chatStore'
import { FileText, Sparkles, Zap, Bot } from 'lucide-react'

export default function ModeToggleBar() {
  const { settings, updateSettings } = useChatStore()

  const modes = [
    {
      id: 'normal',
      icon: Bot,
      label: 'Normal Chat',
      color: 'blue',
      isActive: !settings.deep_research_enabled && !settings.realtime_research_enabled && !settings.agent_mode_enabled,
      onClick: () => updateSettings({
        deep_research_enabled: false,
        realtime_research_enabled: false,
        agent_mode_enabled: false
      })
    },
    {
      id: 'full_research',
      icon: FileText,
      label: 'Full DeepResearch',
      color: 'purple',
      isActive: settings.deep_research_enabled,
      onClick: () => updateSettings({
        deep_research_enabled: true,
        realtime_research_enabled: false,
        agent_mode_enabled: false
      })
    },
    {
      id: 'realtime_research',
      icon: Sparkles,
      label: 'Realtime Research',
      color: 'cyan',
      isActive: settings.realtime_research_enabled,
      onClick: () => updateSettings({
        realtime_research_enabled: true,
        deep_research_enabled: false,
        agent_mode_enabled: false
      })
    },
    {
      id: 'agent',
      icon: Zap,
      label: 'Agent Mode',
      color: 'green',
      isActive: settings.agent_mode_enabled,
      onClick: () => updateSettings({
        agent_mode_enabled: true,
        deep_research_enabled: false,
        realtime_research_enabled: false
      })
    }
  ]

  const getColorClasses = (color: string, isActive: boolean) => {
    if (!isActive) {
      return {
        bg: 'bg-white/5 hover:bg-white/10',
        text: 'text-gray-400',
        border: 'border-white/10'
      }
    }
    
    const colors = {
      blue: {
        bg: 'bg-blue-500/20 border-blue-500/50',
        text: 'text-blue-300',
        border: 'border-blue-500/50'
      },
      purple: {
        bg: 'bg-purple-500/20 border-purple-500/50',
        text: 'text-purple-300',
        border: 'border-purple-500/50'
      },
      cyan: {
        bg: 'bg-cyan-500/20 border-cyan-500/50',
        text: 'text-cyan-300',
        border: 'border-cyan-500/50'
      },
      green: {
        bg: 'bg-green-500/20 border-green-500/50',
        text: 'text-green-300',
        border: 'border-green-500/50'
      }
    }
    
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="border-t border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Mode Selection Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {modes.map((mode) => {
            const Icon = mode.icon
            const colors = getColorClasses(mode.color, mode.isActive)
            
            return (
              <button
                key={mode.id}
                onClick={mode.onClick}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full
                  border transition-all duration-200
                  ${colors.bg} ${colors.border}
                  ${mode.isActive ? 'ring-2 ring-white/20' : 'hover:scale-105'}
                `}
              >
                <Icon className={`w-4 h-4 ${colors.text}`} />
                <span className={`text-sm font-medium ${colors.text}`}>
                  {mode.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
