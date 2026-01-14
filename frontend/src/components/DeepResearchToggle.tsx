'use client'

import { useState, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { ChevronDown, ChevronUp, Sparkles, Info } from 'lucide-react'

interface ModelOption {
  key: string
  name: string
  description: string
}

const MODELS: ModelOption[] = [
  { key: 'typhoon-v2.5-30b-a3b-instruct', name: 'Typhoon 2.5', description: 'Thai-optimized, fast reasoning' },
  { key: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Most capable, latest OpenAI' },
  { key: 'gpt-4', name: 'GPT-4', description: 'Reliable, powerful' },
  { key: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: 'Fast, experimental' },
  { key: 'gemini-pro', name: 'Gemini 1.5 Pro', description: 'Extended context' },
]

export default function DeepResearchToggle() {
  const { settings, updateSettings } = useChatStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  const selectModel = (modelKey: string) => {
    updateSettings({ selected_model: modelKey })
    setShowModelDropdown(false)
  }

  const getSelectedModel = () => {
    return MODELS.find(m => m.key === settings.selected_model) || MODELS[0]
  }

  return (
    <div className="p-4 space-y-3">
      {/* Main Toggle Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-ping opacity-75"></div>
            </div>
            <span className="text-sm font-semibold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
              Comprehensive DeepResearch Active
            </span>
          </div>
          
          {/* Info Badge */}
          <div className="group relative">
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium cursor-help">
              <Sparkles className="w-3 h-3" />
              <span>Always On</span>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                All queries use full research pipeline
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Expandable Settings */}
      {isExpanded && (
        <div className="space-y-4 pt-3 border-t border-gray-200 dark:border-gray-800 animate-slideInDown">
          {/* Model Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <span className="mr-2">🧠</span>
              AI Reasoning Model
            </label>
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-400 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {getSelectedModel().name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getSelectedModel().description}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showModelDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {MODELS.map((model) => (
                    <button
                      key={model.key}
                      onClick={() => selectModel(model.key)}
                      className={`w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors ${
                        settings.selected_model === model.key
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {model.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {model.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Research Pipeline Info */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  Universal Research Pipeline
                </h4>
                <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                  All models use the same comprehensive 8-stage research process:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-purple-600 dark:text-purple-400">
                  <div>✓ Query Expansion</div>
                  <div>✓ Multi-Search</div>
                  <div>✓ Noise Filtering</div>
                  <div>✓ Credibility Scoring</div>
                  <div>✓ Synthesis</div>
                  <div>✓ Fact Validation</div>
                  <div>✓ Data Redaction</div>
                  <div>✓ Report Generation</div>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  🔍 <strong>Search Sources:</strong> Tavily + SerperAPI + JINA AI (Hybrid)
                </p>
              </div>
            </div>
          </div>

          {/* Model Impact Note */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 Model selection only affects reasoning style. All models use the same search & validation pipeline.
          </div>
        </div>
      )}
    </div>
  )
}
