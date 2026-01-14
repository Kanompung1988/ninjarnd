'use client'

import { useState, useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { Send, Copy, Check, Sparkles, Bot, Mic, Paperclip, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import RealtimeDeepResearchDisplay from './RealtimeDeepResearchDisplay'
import BeautifulResearchReport from './BeautifulResearchReport'

export default function ChatInterface() {
  const { getCurrentSession, addMessage, settings, updateSettings } = useChatStore()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showModeMenu, setShowModeMenu] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentSession = getCurrentSession()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    addMessage({
      role: 'user',
      content: userMessage,
    })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          chat_history: currentSession?.messages || [],
          chat_id: currentSession?.chat_id || 'default',
          deep_research_mode: settings.deep_research_enabled,
          realtime_research_mode: settings.realtime_research_enabled,
          agent_mode: settings.agent_mode_enabled,
          model: settings.selected_model || 'typhoon-v2.5-30b-a3b-instruct',
          search_engine: settings.selected_search_engine || 'hybrid',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      addMessage({
        role: 'assistant',
        content: data.response,
        metadata: {
          mode: data.mode,
          model: data.model,
          sources: data.sources || [],
          has_slides: false,
          citations: data.sources || [],
          research_data: data.research_data,  // Include research data for realtime research display
        },
      })

      if (data.mode === 'deep_research') {
        toast.success('Full DeepResearch completed (' + (data.total_sources || 0) + ' sources)')
      } else if (data.mode === 'realtime_research') {
        toast.success('Realtime DeepResearch completed (' + (data.total_sources || 0) + ' sources)')
      } else if (data.mode === 'agent_mode') {
        toast.success('Agent completed task')
      } else {
        toast.success('Response received')
      }
    } catch (error) {
      console.error('Chat error:', error)
      toast.error('Failed to get response')
      addMessage({
        role: 'assistant',
        content: 'ขออภัย เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleGenerateSlides = async (researchData: any) => {
    try {
      toast.loading('Preparing presentation from chat...', { id: 'prepare-slides' })
      
      // Navigate to presentations page with research data AND chat context
      const params = new URLSearchParams({
        topic: researchData.query || 'Research Results',
        from_research: 'true',
        from_chat: 'true'
      })
      
      // Store research data AND chat context in sessionStorage for presentation page
      const chatContext = {
        research_data: researchData,
        chat_id: currentSession?.chat_id || 'default',
        chat_history: currentSession?.messages || [],
        chat_title: currentSession?.title || 'Research Chat'
      }
      sessionStorage.setItem('research_data_for_slides', JSON.stringify(researchData))
      sessionStorage.setItem('chat_context_for_slides', JSON.stringify(chatContext))
      
      toast.dismiss('prepare-slides')
      toast.success('Ready to generate presentation!')
      
      // Navigate to presentations
      window.location.href = `/dashboard?tab=presentations&${params.toString()}`
      
    } catch (error) {
      console.error('Error preparing slides:', error)
      toast.dismiss('prepare-slides')
      toast.error('Failed to prepare slides')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === 'application/pdf') {
        setUploadedFile(file)
        toast.success('File "' + file.name + '" uploaded successfully!')
      } else {
        toast.error('Please upload a PDF file only')
      }
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 relative overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6 relative z-10">
        {!currentSession?.messages || currentSession.messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="max-w-3xl w-full text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
                What are you working on?
              </h1>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {currentSession.messages.map((message, idx) => (
              <div
                key={message.id || idx}
                className={'flex ' + (message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={'max-w-[80%] rounded-2xl px-5 py-4 ' + (
                    message.role === 'user'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'bg-transparent text-gray-900 dark:text-gray-100'
                  )}
                >
                  {message.role === 'assistant' && message.metadata?.mode && (
                    <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      {message.metadata.mode === 'deep_research' || message.metadata.mode === 'realtime_research' ? (
                        <>
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-medium text-purple-500">
                            {message.metadata.mode === 'realtime_research' ? '⚡ Realtime DeepResearch' : '🔬 Full DeepResearch'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-medium text-blue-500">AI</span>
                        </>
                      )}
                      {message.metadata.sources && message.metadata.sources.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          • {message.metadata.sources.length} sources
                        </span>
                      )}
                    </div>
                  )}

                  {/* Use specialized display for research modes */}
                  {message.role === 'assistant' && 
                   (message.metadata?.mode === 'realtime_research' || message.metadata?.mode === 'deep_research') && 
                   message.metadata?.research_data ? (
                    <div className="space-y-4">
                      <BeautifulResearchReport 
                        data={message.metadata.research_data} 
                        onGenerateSlides={() => handleGenerateSlides(message.metadata?.research_data)}
                      />
                      {/* No duplicate markdown content - BeautifulResearchReport shows everything */}
                    </div>
                  ) : (
                    <div className="prose prose-gray dark:prose-invert prose-sm max-w-none leading-relaxed">
                      {message.role === 'assistant' ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  )}


                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Copy message"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                      )}
                    </button>
                  </div>

                  {/* Only show sources for non-research modes (research modes show sources in BeautifulResearchReport) */}
                  {message.metadata?.sources && message.metadata.sources.length > 0 && 
                   message.metadata?.mode !== 'realtime_research' && 
                   message.metadata?.mode !== 'deep_research' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">Sources:</p>
                      <div className="space-y-2">
                        {message.metadata.sources.slice(0, 5).map((source: any, i: number) => (
                          <a
                            key={i}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 truncate transition-colors"
                          >
                            [{i + 1}] {source.title || source.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-transparent rounded-2xl px-5 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="relative z-10">
        <div className="bg-white dark:bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowModeMenu(!showModeMenu)}
                    className="h-[56px] w-[56px] rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center"
                  >
                    <span className="text-gray-900 dark:text-white text-xl">+</span>
                  </button>
                  
                  {showModeMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowModeMenu(false)}
                      />
                      
                      <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                        <div className="p-2 space-y-1">
                          <button
                            onClick={() => {
                              updateSettings({
                                deep_research_enabled: false,
                                realtime_research_enabled: false,
                                agent_mode_enabled: false
                              })
                              setShowModeMenu(false)
                            }}
                            className={'w-full text-left px-4 py-3 rounded-xl transition-colors ' + (
                              !settings.deep_research_enabled && !settings.realtime_research_enabled && !settings.agent_mode_enabled
                                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <Bot className="w-4 h-4" />
                              <span className="text-sm font-medium">Normal Chat</span>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => {
                              updateSettings({
                                deep_research_enabled: true,
                                realtime_research_enabled: false,
                                agent_mode_enabled: false
                              })
                              setShowModeMenu(false)
                            }}
                            className={'w-full text-left px-4 py-3 rounded-xl transition-colors ' + (
                              settings.deep_research_enabled
                                ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <Sparkles className="w-4 h-4" />
                              <span className="text-sm font-medium">Full DeepResearch</span>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => {
                              updateSettings({
                                realtime_research_enabled: true,
                                deep_research_enabled: false,
                                agent_mode_enabled: false
                              })
                              setShowModeMenu(false)
                            }}
                            className={'w-full text-left px-4 py-3 rounded-xl transition-colors ' + (
                              settings.realtime_research_enabled
                                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <Sparkles className="w-4 h-4" />
                              <span className="text-sm font-medium">Realtime Research</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex-1 relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {uploadedFile && (
                    <div className="absolute -top-10 left-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex items-center space-x-2 text-sm">
                      <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{uploadedFile.name}</span>
                      <button
                        onClick={removeFile}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                    placeholder="Ask anything..."
                    disabled={isLoading}
                    rows={1}
                    className="w-full h-[56px] pl-6 pr-24 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                  
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Attach PDF file"
                    >
                      <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Voice input (coming soon)"
                    >
                      <Mic className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={'h-[56px] w-[56px] rounded-2xl transition-all duration-200 flex items-center justify-center ' + (
                    isLoading || !input.trim()
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100'
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
