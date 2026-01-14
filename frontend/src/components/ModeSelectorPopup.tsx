'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { Sparkles, Zap, FileText, Plus, X, ChevronDown, Bot } from 'lucide-react'

export default function ModeSelectorPopup() {
  const { settings, updateSettings } = useChatStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowModelDropdown(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleDeepResearch = () => {
    updateSettings({ 
      deep_research_enabled: !settings.deep_research_enabled,
      realtime_research_enabled: false,
      agent_mode_enabled: false
    })
    setIsOpen(false)
  }

  const toggleRealtimeResearch = () => {
    updateSettings({ 
      realtime_research_enabled: !settings.realtime_research_enabled,
      deep_research_enabled: false,
      agent_mode_enabled: false
    })
    setIsOpen(false)
  }

  const toggleAgentMode = () => {
    updateSettings({ 
      agent_mode_enabled: !settings.agent_mode_enabled,
      deep_research_enabled: false,
      realtime_research_enabled: false
    })
    setIsOpen(false)
  }

  const resetToNormalChat = () => {
    updateSettings({ 
      deep_research_enabled: false,
      realtime_research_enabled: false,
      agent_mode_enabled: false
    })
    setIsOpen(false)
  }

  const getCurrentModeInfo = () => {
    if (settings.deep_research_enabled) {
      return { icon: FileText, label: 'Deep research', color: 'text-purple-400', badge: 'Full Report' }
    }
    if (settings.realtime_research_enabled) {
      return { icon: Sparkles, label: 'Deep research', color: 'text-cyan-400', badge: 'Realtime' }
    }
    if (settings.agent_mode_enabled) {
      return { icon: Zap, label: 'Agent mode', color: 'text-green-400', badge: 'Active' }
    }
    return { icon: Bot, label: 'Normal Chat Mode', color: 'text-blue-400', badge: null }
  }

  const currentMode = getCurrentModeInfo()
  const CurrentIcon = currentMode.icon

  return (
    <div className="relative" ref={popupRef}>
      {/* Mode Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        title="Select mode"
      >
        <div className="flex items-center space-x-2">
          <CurrentIcon className={`w-4 h-4 ${currentMode.color}`} />
          <span className="text-sm text-gray-300">{currentMode.label}</span>
          {currentMode.badge && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              settings.deep_research_enabled ? 'bg-purple-500/20 text-purple-300' :
              settings.realtime_research_enabled ? 'bg-cyan-500/20 text-cyan-300' :
              'bg-green-500/20 text-green-300'
            }`}>
              {currentMode.badge}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popup Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 rounded-xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden z-50 animate-slideUp">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Select Mode</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Mode Options */}
          <div className="p-2">
            {/* Full DeepResearch */}
            <button
              onClick={toggleDeepResearch}
              className={`w-full px-3 py-3 rounded-lg text-left transition-all mb-1 ${
                settings.deep_research_enabled
                  ? 'bg-purple-500/20 border border-purple-500/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-start space-x-3">
                <FileText className={`w-5 h-5 mt-0.5 ${
                  settings.deep_research_enabled ? 'text-purple-400' : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      settings.deep_research_enabled ? 'text-white' : 'text-gray-300'
                    }`}>
                      Deep research
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
                      Full Report
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Complete analysis with comprehensive blog report and citations
                  </p>
                </div>
                {settings.deep_research_enabled && (
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                )}
              </div>
            </button>

            {/* Realtime DeepResearch */}
            <button
              onClick={toggleRealtimeResearch}
              className={`w-full px-3 py-3 rounded-lg text-left transition-all mb-1 ${
                settings.realtime_research_enabled
                  ? 'bg-cyan-500/20 border border-cyan-500/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Sparkles className={`w-5 h-5 mt-0.5 ${
                  settings.realtime_research_enabled ? 'text-cyan-400 animate-pulse' : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      settings.realtime_research_enabled ? 'text-white' : 'text-gray-300'
                    }`}>
                      Deep research
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium">
                      Realtime
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Quick research with latest data - instant results, no blog
                  </p>
                </div>
                {settings.realtime_research_enabled && (
                  <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2 animate-pulse"></div>
                )}
              </div>
            </button>

            {/* Agent Mode */}
            <button
              onClick={toggleAgentMode}
              className={`w-full px-3 py-3 rounded-lg text-left transition-all mb-1 ${
                settings.agent_mode_enabled
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Zap className={`w-5 h-5 mt-0.5 ${
                  settings.agent_mode_enabled ? 'text-green-400' : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      settings.agent_mode_enabled ? 'text-white' : 'text-gray-300'
                    }`}>
                      Agent mode
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-xs font-medium">
                      Beta
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Autonomous AI agent with action capabilities
                  </p>
                </div>
                {settings.agent_mode_enabled && (
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                )}
              </div>
            </button>

            {/* Divider */}
            <div className="h-px bg-white/10 my-2"></div>

            {/* Normal Chat */}
            <button
              onClick={resetToNormalChat}
              className={`w-full px-3 py-3 rounded-lg text-left transition-all ${
                !settings.deep_research_enabled && !settings.realtime_research_enabled && !settings.agent_mode_enabled
                  ? 'bg-blue-500/20 border border-blue-500/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Bot className={`w-5 h-5 mt-0.5 ${
                  !settings.deep_research_enabled && !settings.realtime_research_enabled && !settings.agent_mode_enabled
                    ? 'text-blue-400'
                    : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <span className={`font-medium ${
                    !settings.deep_research_enabled && !settings.realtime_research_enabled && !settings.agent_mode_enabled
                      ? 'text-white'
                      : 'text-gray-300'
                  }`}>
                    Normal Chat
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    Fast responses for quick questions and conversations
                  </p>
                </div>
                {!settings.deep_research_enabled && !settings.realtime_research_enabled && !settings.agent_mode_enabled && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                )}
              </div>
            </button>
          </div>

          {/* Footer Info */}
          <div className="px-4 py-2 border-t border-white/10 bg-black/20">
            <p className="text-xs text-gray-400">
              💡 Switch modes anytime to change how NINJA processes your queries
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
