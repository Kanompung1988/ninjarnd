'use client'

import { useState } from 'react'
import { ChevronDown, ExternalLink, Check, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ResearchResult {
  title?: string
  url?: string
  snippet?: string
  source?: string
  credibility?: number
  date?: string
}

interface RealtimeDeepResearchDisplayProps {
  data: {
    query?: string
    summary?: string
    key_findings?: string[]
    quick_summary?: string
    key_points?: string[]
    sources?: ResearchResult[]
    total_sources?: number
    confidence?: string
    timestamp?: string
    model?: string
  }
}

export default function RealtimeDeepResearchDisplay({ data }: RealtimeDeepResearchDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    keypoints: true,
    sources: true,
  })
  const [copiedSourceId, setCopiedSourceId] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleCopySource = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedSourceId(id)
    toast.success('Link copied!')
    setTimeout(() => setCopiedSourceId(null), 2000)
  }

  const SourceCard = ({ source, index }: { source: ResearchResult; index: number }) => {
    const credibilityColor = 
      (source.credibility || 0) > 0.7 ? 'bg-green-500/20 text-green-300' :
      (source.credibility || 0) > 0.5 ? 'bg-yellow-500/20 text-yellow-300' :
      'bg-orange-500/20 text-orange-300'

    return (
      <div className="border border-gray-700/50 rounded-lg p-4 hover:border-gray-600/80 transition-all hover:bg-gray-900/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-400 bg-gray-800/60 px-2 py-1 rounded">
                [{index + 1}]
              </span>
              {source.credibility && (
                <span className={`text-xs px-2 py-1 rounded font-medium ${credibilityColor}`}>
                  Credibility: {(source.credibility * 100).toFixed(0)}%
                </span>
              )}
              {source.date && (
                <span className="text-xs text-gray-500">
                  📅 {source.date}
                </span>
              )}
            </div>
            
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-blue-400 hover:text-blue-300 truncate block"
              title={source.title || source.url}
            >
              {source.title || source.url}
            </a>

            {source.source && (
              <p className="text-xs text-gray-500 mt-1">
                Source: {source.source}
              </p>
            )}

            {source.snippet && (
              <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                {source.snippet}
              </p>
            )}
          </div>

          <button
            onClick={() => handleCopySource(source.url || '', `source-${index}`)}
            className="flex-shrink-0 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/80 transition-colors"
            title="Copy URL"
          >
            {copiedSourceId === `source-${index}` ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400 hover:text-gray-200" />
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-gray-100">
      {/* Header */}
      {(data.query || data.model) && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-3">
          <p className="text-sm text-gray-300">
            {data.query && (
              <>
                <span className="font-semibold text-cyan-400">🔍 Query:</span>
                <span className="ml-2">{data.query}</span>
              </>
            )}
            {data.model && (
              <>
                <br />
                <span className="font-semibold text-blue-400">🤖 Model:</span>
                <span className="ml-2 text-gray-400">{data.model}</span>
              </>
            )}
            {data.timestamp && (
              <>
                <br />
                <span className="font-semibold text-gray-500">⏰ Time:</span>
                <span className="ml-2 text-gray-500 text-xs">{data.timestamp}</span>
              </>
            )}
          </p>
        </div>
      )}

      {/* Quick Summary */}
      {(data.summary || data.quick_summary) && (
        <div className="bg-gray-800/40 rounded-lg border border-gray-700/50">
          <button
            onClick={() => toggleSection('summary')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-800/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h3 className="font-semibold text-white">Quick Summary</h3>
              <span className="text-xs text-gray-500">({(data.summary || data.quick_summary)?.split('\n').length} points)</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.summary ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.summary && (
            <div className="px-4 pb-4 text-sm text-gray-300 space-y-2 border-t border-gray-700/50">
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-gray dark:prose-invert max-w-none text-sm">
                {data.summary || data.quick_summary || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Key Points / Key Findings */}
      {(data.key_points?.length || data.key_findings?.length) && (
        <div className="bg-gray-800/40 rounded-lg border border-gray-700/50">
          <button
            onClick={() => toggleSection('keypoints')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-800/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🔑</span>
              <h3 className="font-semibold text-white">Key Points</h3>
              <span className="text-xs text-gray-500">({(data.key_points?.length || data.key_findings?.length) || 0} items)</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.keypoints ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.keypoints && (
            <div className="px-4 pb-4 border-t border-gray-700/50">
              <ul className="space-y-2">
                {(data.key_points || data.key_findings || []).map((point, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300">
                    <span className="flex-shrink-0 font-bold text-cyan-400">•</span>
                    <span className="line-clamp-3">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sources */}
      {data.sources && data.sources.length > 0 && (
        <div className="bg-gray-800/40 rounded-lg border border-gray-700/50">
          <button
            onClick={() => toggleSection('sources')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-800/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📰</span>
              <h3 className="font-semibold text-white">Sources</h3>
              <span className="text-xs text-gray-500">({data.total_sources || data.sources.length} found)</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.sources ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.sources && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-700/50">
              {data.sources.map((source, i) => (
                <SourceCard key={i} source={source} index={i} />
              ))}
              
              {(data.total_sources || 0) > data.sources.length && (
                <p className="text-xs text-gray-500 text-center py-2">
                  +{(data.total_sources || 0) - data.sources.length} more sources available
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Metadata Footer */}
      {(data.confidence || data.model) && (
        <div className="text-xs text-gray-500 flex items-center justify-between py-2 px-2 bg-gray-800/20 rounded">
          <div className="flex gap-3">
            {data.confidence && (
              <span>Confidence: <span className="text-gray-400">{data.confidence}</span></span>
            )}
            {data.model && (
              <span>Model: <span className="text-gray-400">{data.model.split('/').pop()}</span></span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
