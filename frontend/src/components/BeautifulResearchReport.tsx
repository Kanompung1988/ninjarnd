'use client'

import { useState } from 'react'
import { 
  ChevronDown, 
  ChevronUp,
  ExternalLink, 
  Check, 
  Copy, 
  Search,
  BookOpen,
  Lightbulb,
  FileText,
  Shield,
  Clock,
  Zap,
  Globe,
  Star,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Source {
  title?: string
  url?: string
  snippet?: string
  source?: string
  credibility?: number
  date?: string
}

interface ResearchData {
  query?: string
  mode?: 'realtime' | 'deep' | string
  summary?: string
  executive_summary?: string
  key_findings?: string[]
  quick_summary?: string
  key_points?: string[]
  detailed_analysis?: string
  recommendations?: string[]
  sources?: Source[]
  total_sources?: number
  confidence?: string
  timestamp?: string
  model?: string
  search_duration?: number
  average_credibility?: number
  recency_days?: number
}

interface BeautifulResearchReportProps {
  data: ResearchData
  compact?: boolean
  onGenerateSlides?: () => void
}

export default function BeautifulResearchReport({ data, compact = false, onGenerateSlides }: BeautifulResearchReportProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    findings: true,
    analysis: false,
    recommendations: false,
    sources: false,
  })
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    toast.success('URL copied!')
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const getConfidenceColor = (confidence: string) => {
    const level = confidence?.toUpperCase()
    if (level === 'HIGH') return 'from-green-500 to-emerald-500'
    if (level === 'MEDIUM') return 'from-yellow-500 to-amber-500'
    return 'from-orange-500 to-red-500'
  }

  const getCredibilityBadge = (score: number) => {
    if (score >= 0.7) return { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'High' }
    if (score >= 0.5) return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Medium' }
    return { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Low' }
  }

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timestamp
    }
  }

  const isRealtimeMode = data.mode === 'realtime'
  const modeColor = isRealtimeMode ? 'from-yellow-500 to-orange-500' : 'from-cyan-500 to-blue-600'
  const modeBgColor = isRealtimeMode ? 'from-yellow-500/20 via-orange-500/20 to-red-500/20' : 'from-cyan-500/20 via-blue-500/20 to-purple-500/20'
  const modeIcon = isRealtimeMode ? '⚡' : '🔬'
  const modeTitle = isRealtimeMode ? 'Realtime Research' : 'DeepResearch Report'
  const modeSubtitle = isRealtimeMode ? 'Latest News & Updates' : 'Comprehensive Analysis'

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${modeBgColor} animate-pulse`} />
        <div className="relative p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 bg-gradient-to-br ${modeColor} rounded-xl shadow-lg`}>
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{modeIcon} {modeTitle}</h2>
                <p className="text-sm text-slate-400">{modeSubtitle}</p>
              </div>
            </div>
            
            {/* Mode Badge */}
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${isRealtimeMode ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
              {isRealtimeMode ? '⚡ REALTIME' : '🔬 DEEP ANALYSIS'}
            </div>
          </div>

          {/* Query */}
          {data.query && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-sm text-slate-400 mb-1">Research Query</p>
              <p className="text-lg font-semibold text-cyan-400">"{data.query}"</p>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {data.total_sources && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{data.total_sources}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Sources</p>
              </div>
            )}
            
            {data.confidence && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className={`text-lg font-bold bg-gradient-to-r ${getConfidenceColor(data.confidence)} bg-clip-text text-transparent`}>
                    {data.confidence}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Confidence</p>
              </div>
            )}

            {typeof data.average_credibility === 'number' && data.average_credibility > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-2xl font-bold text-white">
                    {(data.average_credibility * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Avg Credibility</p>
              </div>
            )}

            {typeof data.search_duration === 'number' && data.search_duration > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="text-2xl font-bold text-white">
                    {data.search_duration.toFixed(1)}s
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Duration</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {(data.summary || data.executive_summary || data.quick_summary) && (
        <CollapsibleSection
          title="📋 Executive Summary"
          icon={<FileText className="w-5 h-5" />}
          isExpanded={expandedSections.summary}
          onToggle={() => toggleSection('summary')}
          accentColor="cyan"
        >
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.executive_summary || data.summary || data.quick_summary || ''}
            </ReactMarkdown>
          </div>
        </CollapsibleSection>
      )}

      {/* Key Findings */}
      {(data.key_findings?.length || data.key_points?.length) ? (
        <CollapsibleSection
          title="🔑 Key Findings"
          icon={<Lightbulb className="w-5 h-5" />}
          isExpanded={expandedSections.findings}
          onToggle={() => toggleSection('findings')}
          accentColor="yellow"
          badge={`${(data.key_findings || data.key_points)?.length || 0} points`}
        >
          <div className="space-y-3">
            {(data.key_findings || data.key_points || []).map((finding, idx) => (
              <div 
                key={idx}
                className="flex gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-yellow-500/30 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{idx + 1}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{finding}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {/* Detailed Analysis */}
      {data.detailed_analysis && (
        <CollapsibleSection
          title="📊 Detailed Analysis"
          icon={<BookOpen className="w-5 h-5" />}
          isExpanded={expandedSections.analysis}
          onToggle={() => toggleSection('analysis')}
          accentColor="blue"
        >
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.detailed_analysis}
            </ReactMarkdown>
          </div>
        </CollapsibleSection>
      )}

      {/* Recommendations */}
      {data.recommendations?.length ? (
        <CollapsibleSection
          title="💡 Recommendations"
          icon={<CheckCircle2 className="w-5 h-5" />}
          isExpanded={expandedSections.recommendations}
          onToggle={() => toggleSection('recommendations')}
          accentColor="green"
          badge={`${data.recommendations.length} items`}
        >
          <div className="space-y-2">
            {data.recommendations.map((rec, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg border border-green-500/20"
              >
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300">{rec}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {/* Sources */}
      {data.sources?.length ? (
        <CollapsibleSection
          title="📚 Sources"
          icon={<Globe className="w-5 h-5" />}
          isExpanded={expandedSections.sources}
          onToggle={() => toggleSection('sources')}
          accentColor="purple"
          badge={`${data.sources.length} found`}
        >
          <div className="space-y-3">
            {data.sources.map((source, idx) => {
              const credBadge = getCredibilityBadge(source.credibility || 0)
              return (
                <div 
                  key={idx}
                  className="group p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="px-2 py-0.5 bg-slate-700 rounded text-xs font-mono text-slate-300">
                          [{idx + 1}]
                        </span>
                        {typeof source.credibility === 'number' && source.credibility > 0 && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${credBadge.color}`}>
                            {(source.credibility * 100).toFixed(0)}% {credBadge.label}
                          </span>
                        )}
                        {source.source && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">
                            {source.source}
                          </span>
                        )}
                      </div>

                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 group-hover:underline"
                      >
                        {source.title || 'Untitled Source'}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>

                      {source.snippet && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {source.snippet}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopyUrl(source.url || '')}
                      className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy URL"
                    >
                      {copiedUrl === source.url ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </CollapsibleSection>
      ) : null}

      {/* Action Buttons */}
      {onGenerateSlides && (
        <div className="p-4 border-t border-slate-700/50 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
          <button
            onClick={onGenerateSlides}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileText className="w-5 h-5" />
            <span>📊 Generate Presentation Slides</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            {data.mode && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${isRealtimeMode ? 'bg-yellow-500/10 text-yellow-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                {isRealtimeMode ? '⚡ Realtime' : '🔬 Deep'}
              </span>
            )}
            {data.model && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Model: <span className="text-slate-400">{data.model}</span>
              </span>
            )}
            {data.timestamp && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(data.timestamp)}
              </span>
            )}
          </div>
          <span className="text-slate-600">Powered by NINJA DeepResearch</span>
        </div>
      </div>
    </div>
  )
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  accentColor = 'blue',
  badge
}: {
  title: string
  icon: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
  accentColor?: 'cyan' | 'yellow' | 'blue' | 'green' | 'purple'
  badge?: string
}) {
  const colorClasses = {
    cyan: 'from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400',
    yellow: 'from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400',
    blue: 'from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400',
    green: 'from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400',
    purple: 'from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400',
  }

  return (
    <div className="border-b border-slate-700/50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[accentColor]} text-white`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {badge && (
            <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs text-slate-400">
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {isExpanded && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  )
}
