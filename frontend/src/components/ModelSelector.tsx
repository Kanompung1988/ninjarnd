'use client'

import { useChatStore } from '@/store/chatStore'
import { Bot, Sparkles, Zap } from 'lucide-react'

export type ModelType = 
  | 'typhoon-v2.1-12b-instruct'
  | 'typhoon-v2.5-30b-a3b-instruct'
  | 'gpt-5'
  | 'gpt-5-pro'
  | 'o1'
  | 'o1-mini'
  | 'o1-preview'
  | 'o1-pro'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'models/gemini-flash-latest'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'ensemble-thai-expert'
  | 'ensemble-balanced'
  | 'ensemble-deep-reasoning'

export interface ModelOption {
  value: ModelType
  label: string
  description: string
  provider: 'typhoon' | 'openai' | 'gemini'
  icon: any
  color: string
}

const modelOptions: ModelOption[] = [
  // Typhoon Models (Thai LLM)
  {
    value: 'typhoon-v2.1-12b-instruct',
    label: 'Typhoon 2.1 12B',
    description: 'Thai LLM - Fast & Efficient',
    provider: 'typhoon',
    icon: Zap,
    color: 'text-blue-500'
  },
  {
    value: 'typhoon-v2.5-30b-a3b-instruct',
    label: 'Typhoon 2.5 30B',
    description: 'Thai LLM - High Quality',
    provider: 'typhoon',
    icon: Sparkles,
    color: 'text-blue-600'
  },
  
  // Azure OpenAI - GPT-5 Series
  {
    value: 'gpt-5',
    label: 'GPT-5',
    description: 'Azure - Most Advanced (Latest)',
    provider: 'openai',
    icon: Sparkles,
    color: 'text-green-600'
  },
  {
    value: 'gpt-5-pro',
    label: 'GPT-5 Pro',
    description: 'Azure - Professional Grade',
    provider: 'openai',
    icon: Sparkles,
    color: 'text-green-700'
  },
  
  // Azure OpenAI - O1 Series (Reasoning)
  {
    value: 'o1',
    label: 'O1',
    description: 'Azure - Advanced Reasoning',
    provider: 'openai',
    icon: Bot,
    color: 'text-purple-600'
  },
  {
    value: 'o1-mini',
    label: 'O1 Mini',
    description: 'Azure - Fast Reasoning',
    provider: 'openai',
    icon: Bot,
    color: 'text-purple-500'
  },
  {
    value: 'o1-preview',
    label: 'O1 Preview',
    description: 'Azure - Preview Reasoning',
    provider: 'openai',
    icon: Bot,
    color: 'text-purple-600'
  },
  {
    value: 'o1-pro',
    label: 'O1 Pro',
    description: 'Azure - Professional Reasoning',
    provider: 'openai',
    icon: Bot,
    color: 'text-purple-700'
  },
  
  // Azure OpenAI - GPT-4o Series
  {
    value: 'gpt-4o',
    label: 'GPT-4o',
    description: 'Azure - Fast & Capable',
    provider: 'openai',
    icon: Zap,
    color: 'text-green-500'
  },
  {
    value: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    description: 'Azure - Affordable & Fast',
    provider: 'openai',
    icon: Zap,
    color: 'text-green-400'
  },
  
  // Gemini Models
  {
    value: 'models/gemini-flash-latest',
    label: 'Gemini Flash',
    description: 'Google - Ultra Fast',
    provider: 'gemini',
    icon: Zap,
    color: 'text-purple-500'
  },
  {
    value: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Google - Fast & Efficient',
    provider: 'gemini',
    icon: Sparkles,
    color: 'text-purple-600'
  },
  {
    value: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: 'Google - Highest Quality',
    provider: 'gemini',
    icon: Sparkles,
    color: 'text-purple-700'
  },
  
  // Ensemble Models (Typhoon 30B + Partners)
  {
    value: 'ensemble-thai-expert',
    label: '🇹🇭 Thai Expert Ensemble',
    description: 'Typhoon 30B + Gemini Flash (Best Thai: 89.8%)',
    provider: 'typhoon',
    icon: Sparkles,
    color: 'text-blue-700'
  },
  {
    value: 'ensemble-balanced',
    label: '⚖️ Balanced Ensemble',
    description: 'Typhoon 30B + GPT-4o (Quality + Speed)',
    provider: 'typhoon',
    icon: Sparkles,
    color: 'text-blue-700'
  },
  {
    value: 'ensemble-deep-reasoning',
    label: '🧠 Deep Reasoning Ensemble',
    description: 'Typhoon 30B + O1 (Thai + Complex Reasoning)',
    provider: 'typhoon',
    icon: Bot,
    color: 'text-blue-700'
  }
]

export default function ModelSelector() {
  const { settings, updateSettings } = useChatStore()
  const selectedModel = settings.selected_model || 'typhoon-v2.5-30b-a3b-instruct'
  
  const currentOption = modelOptions.find(opt => opt.value === selectedModel) || modelOptions[1]
  const Icon = currentOption.icon

  const handleModelChange = (model: string) => {
    updateSettings({ selected_model: model })
  }

  return (
    <div className="relative group">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
        AI Model
      </label>
      
      <div className="relative">
        <select
          value={selectedModel}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full px-3 py-2.5 pl-10 pr-8 
                   bg-white dark:bg-gray-800 
                   border border-gray-200 dark:border-gray-700
                   rounded-lg
                   text-sm text-gray-900 dark:text-white
                   hover:border-gray-300 dark:hover:border-gray-600
                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                   transition-all duration-200
                   cursor-pointer
                   appearance-none"
        >
          <optgroup label="🐉 Typhoon (Thai)">
            {modelOptions
              .filter(opt => opt.provider === 'typhoon')
              .map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
          </optgroup>
          
          <optgroup label="🤖 ChatGPT / OpenAI">
            {modelOptions
              .filter(opt => opt.provider === 'openai')
              .map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
          </optgroup>
          
          <optgroup label="✨ Google Gemini">
            {modelOptions
              .filter(opt => opt.provider === 'gemini')
              .map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
          </optgroup>
        </select>
        
        {/* Icon */}
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${currentOption.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        
        {/* Dropdown Arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Model Info */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          Provider: {currentOption.provider.toUpperCase()}
        </span>
        <span className={`${currentOption.color} font-medium`}>
          {currentOption.label}
        </span>
      </div>
    </div>
  )
}
