'use client'

import { useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { X, Search, Loader2, FileDown, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface ResearchPanelProps {
  onClose: () => void
}

export default function ResearchPanel({ onClose }: ResearchPanelProps) {
  const { getCurrentSession, setResearchContext, settings } = useChatStore()
  const currentSession = getCurrentSession()

  const [isResearching, setIsResearching] = useState(false)
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false)
  const [researchResults, setResearchResults] = useState<any>(null)

  const [formData, setFormData] = useState({
    topic: '',
    days_back: 7,
    effort: 'standard',
    scope: 'balanced',
    model: 'typhoon-v2.5-30b-a3b-instruct',
    search_engine: 'hybrid',
  })

  const handleResearch = async () => {
    if (!formData.topic.trim()) {
      toast.error('Please enter a research topic')
      return
    }

    setIsResearching(true)
    setResearchResults(null)

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          chat_id: currentSession?.chat_id,
          use_hybrid_search: settings.enable_hybrid_search,
        }),
      })

      if (!response.ok) throw new Error('Research request failed')

      const data = await response.json()
      setResearchResults(data)

      // Save to store
      if (currentSession) {
        setResearchContext(currentSession.chat_id, {
          query: formData.topic,
          results: data,
          timestamp: new Date().toISOString(),
          model: formData.model,
          search_engine: formData.search_engine,
        })
      }

      toast.success('Research completed!')
    } catch (error) {
      console.error('Research error:', error)
      toast.error('Research failed. Please try again.')
    } finally {
      setIsResearching(false)
    }
  }

  const handleGenerateSlides = async () => {
    if (!researchResults) return

    setIsGeneratingSlides(true)

    try {
      const response = await fetch('/api/slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: currentSession?.chat_id,
          json_path: researchResults.json_path || '',
          output_format: 'both',
          settings: {
            enable_ai_images: settings.enable_ai_images,
            image_style: 'professional',
            max_images: 6,
            theme: 'modern',
          },
        }),
      })

      if (!response.ok) throw new Error('Slides generation failed')

      const data = await response.json()
      toast.success('Presentation generated successfully!')

      // Trigger download if files are ready
      if (data.pptx_file) {
        window.open(
          `/api/slides?chat_id=${currentSession?.chat_id}&file_type=pptx`,
          '_blank'
        )
      }
    } catch (error) {
      console.error('Slides generation error:', error)
      toast.error('Failed to generate presentation.')
    } finally {
      setIsGeneratingSlides(false)
    }
  }

  return (
    <div className="h-full bg-white dark:bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Deep Research
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Comprehensive AI-powered research with multiple sources
        </p>
      </div>

      {/* Research Form */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Research Topic
          </label>
          <textarea
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="What would you like to research?"
            rows={3}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Days Back */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Range: {formData.days_back} days
          </label>
          <input
            type="range"
            min="1"
            max="90"
            value={formData.days_back}
            onChange={(e) =>
              setFormData({ ...formData, days_back: parseInt(e.target.value) })
            }
            className="w-full"
          />
        </div>

        {/* Effort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Research Effort
          </label>
          <select
            value={formData.effort}
            onChange={(e) => setFormData({ ...formData, effort: e.target.value })}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="quick">Quick</option>
            <option value="standard">Standard</option>
            <option value="comprehensive">Comprehensive</option>
            <option value="exhaustive">Exhaustive</option>
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AI Model
          </label>
          <select
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="typhoon-v2.5-30b-a3b-instruct">Typhoon v2.5 (30B)</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gemini-pro">Gemini Pro</option>
          </select>
        </div>

        {/* Research Button */}
        <button
          onClick={handleResearch}
          disabled={isResearching || !formData.topic.trim()}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {isResearching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Researching...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Start Research</span>
            </>
          )}
        </button>

        {/* Results */}
        {researchResults && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Research Complete!
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                  Found {researchResults.metadata?.total_sources || 0} sources
                </p>
                <button
                  onClick={handleGenerateSlides}
                  disabled={isGeneratingSlides}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  {isGeneratingSlides ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>Generate Presentation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
