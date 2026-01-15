'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  Sparkles, 
  Play,
  Eye,
  Edit3,
  Check,
  X,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  FileDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import SlideRenderer from './SlideRenderer'

interface SlideOutline {
  slide_number: number
  type: string
  title: string
  purpose: string
}

interface OutlineData {
  title: string
  subtitle?: string
  target_audience?: string
  outline: SlideOutline[]
}

interface GeneratedSlide {
  slide_number: number
  type: string
  title: string
  content?: string[]
  subtitle?: string
  caption?: string
  notes?: string
  imagePrompt?: string
  image?: {
    url: string
    local_path?: string
    prompt?: string
  }
}

interface StreamEvent {
  type: 'progress' | 'slide' | 'complete' | 'error' | 'done'
  current?: number
  total?: number
  message?: string
  slide_number?: number
  slide?: GeneratedSlide
  title?: string
  slides?: GeneratedSlide[]
}

interface ZStyleSlideGeneratorProps {
  onComplete?: (slides: GeneratedSlide[], title: string) => void
  researchContext?: string
  initialTopic?: string
}

export default function ZStyleSlideGenerator({
  onComplete,
  researchContext,
  initialTopic = ''
}: ZStyleSlideGeneratorProps) {
  // State
  const [step, setStep] = useState<'input' | 'outline' | 'generating' | 'complete'>('input')
  const [topic, setTopic] = useState(initialTopic)
  const [slideCount, setSlideCount] = useState(8)
  const [style, setStyle] = useState('professional')
  const [generateImages, setGenerateImages] = useState(true)
  
  // Outline state
  const [outline, setOutline] = useState<OutlineData | null>(null)
  const [editingOutline, setEditingOutline] = useState(false)
  const [isLoadingOutline, setIsLoadingOutline] = useState(false)
  
  // Generation state
  const [generatedSlides, setGeneratedSlides] = useState<GeneratedSlide[]>([])
  const [currentProgress, setCurrentProgress] = useState({ current: 0, total: 0, message: '' })
  const [isStreaming, setIsStreaming] = useState(false)
  
  // Preview state
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // API base URL
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'

  // =======================================================================
  // STEP 1: GENERATE OUTLINE
  // =======================================================================
  const handleGenerateOutline = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setIsLoadingOutline(true)
    const toastId = toast.loading('📋 Generating outline...')

    try {
      const response = await fetch(`${backendUrl}/api/zstyle/outline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          slide_count: slideCount,
          style,
          user_id: 'demo-user'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setOutline(data.data)
        setStep('outline')
        toast.success('Outline generated! Review and confirm.', { id: toastId })
      } else {
        throw new Error(data.error || 'Failed to generate outline')
      }
    } catch (error: any) {
      console.error('Outline error:', error)
      toast.error(`Failed: ${error.message}`, { id: toastId })
    } finally {
      setIsLoadingOutline(false)
    }
  }

  // =======================================================================
  // EDIT OUTLINE
  // =======================================================================
  const handleOutlineEdit = (index: number, field: keyof SlideOutline, value: string) => {
    if (!outline) return
    
    const newOutline = { ...outline }
    newOutline.outline = [...newOutline.outline]
    newOutline.outline[index] = { ...newOutline.outline[index], [field]: value }
    setOutline(newOutline)
  }

  // =======================================================================
  // STEP 2: GENERATE FULL SLIDES (STREAMING)
  // =======================================================================
  const handleGenerateSlides = async () => {
    if (!outline) return

    setStep('generating')
    setGeneratedSlides([])
    setIsStreaming(true)
    setCurrentProgress({ current: 0, total: outline.outline.length, message: 'Starting...' })

    const toastId = toast.loading('🎨 Generating slides with AI...')

    try {
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()

      const response = await fetch(`${backendUrl}/api/zstyle/slides/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outline,
          generate_images: generateImages,
          research_context: researchContext,
          user_id: 'demo-user'
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Read SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamEvent

              switch (data.type) {
                case 'progress':
                  setCurrentProgress({
                    current: data.current || 0,
                    total: data.total || 0,
                    message: data.message || ''
                  })
                  break

                case 'slide':
                  if (data.slide) {
                    setGeneratedSlides(prev => {
                      const newSlides = [...prev, data.slide!]
                      // Auto-select the latest slide
                      setSelectedSlideIndex(newSlides.length - 1)
                      return newSlides
                    })
                    toast.success(`✅ Slide ${data.slide_number} ready`, { duration: 1500 })
                  }
                  break

                case 'complete':
                  setStep('complete')
                  toast.success('🎉 All slides generated!', { id: toastId })
                  if (onComplete && data.slides) {
                    onComplete(data.slides, data.title || topic)
                  }
                  break

                case 'error':
                  toast.error(data.message || 'Generation error', { id: toastId })
                  break

                case 'done':
                  setIsStreaming(false)
                  break
              }
            } catch (e) {
              console.warn('Failed to parse SSE:', e)
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error('Generation cancelled', { id: toastId })
      } else {
        console.error('Stream error:', error)
        toast.error(`Failed: ${error.message}`, { id: toastId })
      }
    } finally {
      setIsStreaming(false)
    }
  }

  // Cancel streaming
  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
    setStep('outline')
  }

  // =======================================================================
  // NAVIGATION
  // =======================================================================
  const goToPrevSlide = () => {
    setSelectedSlideIndex(prev => Math.max(0, prev - 1))
  }

  const goToNextSlide = () => {
    setSelectedSlideIndex(prev => Math.min(generatedSlides.length - 1, prev + 1))
  }

  // Reset
  const handleReset = () => {
    setStep('input')
    setOutline(null)
    setGeneratedSlides([])
    setSelectedSlideIndex(0)
  }

  // =======================================================================
  // RENDER
  // =======================================================================
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header - Enhanced */}
      <div className="p-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">🎨 AI Slide Generator</h2>
              <p className="text-xs text-muted-foreground">
                {step === 'input' && '📝 Step 1: Enter Topic & Preferences'}
                {step === 'outline' && '📋 Step 2: Review & Customize Outline'}
                {step === 'generating' && '⚡ Step 3: Generating Professional Slides...'}
                {step === 'complete' && '✅ Presentation Ready!'}
              </p>
            </div>
          </div>
          {researchContext && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                Using Deep Research Data
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        
        {/* ============= STEP 1: INPUT - Enhanced UI ============= */}
        {step === 'input' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Create Professional Presentation</h3>
                </div>
                
                {researchContext && (
                  <div className="mb-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-blue-500/10 rounded">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                          🔍 Enhanced with Deep Research
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Your slides will include comprehensive analysis, verified sources, key findings, 
                          and important links from the research session.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Topic */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <span>Presentation Topic</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Machine Learning Basics, Climate Change Solutions..."
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                {/* Options Row - Enhanced */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">📊 Number of Slides</label>
                    <select
                      value={slideCount}
                      onChange={(e) => setSlideCount(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background text-foreground hover:border-primary transition-colors cursor-pointer"
                    >
                      {[5, 6, 7, 8, 9, 10, 12, 15].map(n => (
                        <option key={n} value={n}>{n} slides</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">🎨 Presentation Style</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border-2 border-border bg-background text-foreground hover:border-primary transition-colors cursor-pointer"
                    >
                      <option value="professional">💼 Professional</option>
                      <option value="creative">🎭 Creative</option>
                      <option value="minimal">✨ Minimal</option>
                      <option value="bold">🔥 Bold</option>
                    </select>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-lg">
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1">✨ Powered by GLM-4.7</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• 7-step intelligent generation process</li>
                        <li>• Professional design with modern layouts</li>
                        <li>• Automatic content optimization</li>
                        {researchContext && (
                          <li className="text-green-600 dark:text-green-400 font-medium">
                            • Enhanced with research data & chat context
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Generate Button - Enhanced */}
                <button
                  onClick={handleGenerateOutline}
                  disabled={isLoadingOutline || !topic.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingOutline ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Outline...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Outline
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============= STEP 2: OUTLINE ============= */}
        {step === 'outline' && outline && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Presentation Title */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{outline.title}</h3>
                    {outline.subtitle && (
                      <p className="text-muted-foreground">{outline.subtitle}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingOutline(!editingOutline)}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Slide Outline List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Outline ({outline.outline.length} slides)</h4>
                  <span className="text-sm text-muted-foreground">
                    {editingOutline ? 'Click fields to edit' : 'Click ✏️ to edit'}
                  </span>
                </div>
                
                {outline.outline.map((slide, index) => (
                  <div 
                    key={slide.slide_number}
                    className="bg-card border border-border rounded-lg p-4 flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {slide.slide_number}
                    </div>
                    <div className="flex-1">
                      {editingOutline ? (
                        <>
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => handleOutlineEdit(index, 'title', e.target.value)}
                            className="w-full font-medium mb-1 px-2 py-1 rounded border border-border bg-background"
                          />
                          <input
                            type="text"
                            value={slide.purpose}
                            onChange={(e) => handleOutlineEdit(index, 'purpose', e.target.value)}
                            className="w-full text-sm text-muted-foreground px-2 py-1 rounded border border-border bg-background"
                          />
                        </>
                      ) : (
                        <>
                          <h5 className="font-medium">{slide.title}</h5>
                          <p className="text-sm text-muted-foreground">{slide.purpose}</p>
                        </>
                      )}
                    </div>
                    <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded h-fit">
                      {slide.type}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Start Over
                </button>
                <button
                  onClick={handleGenerateSlides}
                  className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Generate Full Slides {generateImages && '+ Images'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============= STEP 3: GENERATING (STREAMING) ============= */}
        {(step === 'generating' || step === 'complete') && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Slide Thumbnails */}
            <div className="w-64 border-r border-border bg-muted/30 overflow-y-auto p-3 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  Slides ({generatedSlides.length}/{outline?.outline.length || 0})
                </span>
                {isStreaming && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                )}
              </div>

              {/* Progress */}
              {isStreaming && (
                <div className="mb-4 p-2 bg-primary/10 rounded-lg">
                  <div className="text-xs text-primary font-medium mb-1">
                    {currentProgress.message}
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentProgress.current / currentProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Thumbnails */}
              {generatedSlides.map((slide, index) => (
                <button
                  key={slide.slide_number}
                  onClick={() => setSelectedSlideIndex(index)}
                  className={`w-full text-left p-2 rounded-lg border transition-colors ${
                    selectedSlideIndex === index
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {slide.slide_number}
                    </span>
                    <span className="text-sm truncate">{slide.title}</span>
                  </div>
                  {slide.image && (
                    <span className="text-xs text-green-500 flex items-center gap-1 mt-1">
                      <ImageIcon className="w-3 h-3" /> Image ready
                    </span>
                  )}
                </button>
              ))}

              {/* Pending slides */}
              {outline?.outline.slice(generatedSlides.length).map((slide) => (
                <div
                  key={slide.slide_number}
                  className="w-full p-2 rounded-lg border border-dashed border-border opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {slide.slide_number}
                    </span>
                    <span className="text-sm truncate text-muted-foreground">
                      {slide.title}
                    </span>
                  </div>
                </div>
              ))}

              {/* Cancel / Complete buttons */}
              <div className="pt-4">
                {isStreaming ? (
                  <button
                    onClick={handleCancelGeneration}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-sm hover:bg-destructive/20"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                ) : step === 'complete' && (
                  <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/80"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Create New
                  </button>
                )}
              </div>
            </div>

            {/* Right: Slide Preview */}
            <div className="flex-1 flex flex-col bg-muted/10">
              {/* Preview Navigation */}
              <div className="p-3 border-b border-border bg-card flex items-center justify-between">
                <button
                  onClick={goToPrevSlide}
                  disabled={selectedSlideIndex === 0}
                  className="p-2 rounded-lg hover:bg-accent disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <span className="text-sm font-medium">
                  Slide {selectedSlideIndex + 1} of {generatedSlides.length}
                </span>
                
                <button
                  onClick={goToNextSlide}
                  disabled={selectedSlideIndex === generatedSlides.length - 1}
                  className="p-2 rounded-lg hover:bg-accent disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Slide Preview */}
              <div className="flex-1 p-6 flex items-center justify-center overflow-auto">
                {generatedSlides[selectedSlideIndex] ? (
                  <div className="w-full max-w-4xl aspect-video bg-card rounded-lg shadow-lg border border-border overflow-hidden">
                    <SlideRenderer slide={{
                      ...generatedSlides[selectedSlideIndex],
                      id: `slide-${generatedSlides[selectedSlideIndex].slide_number}`,
                      content: generatedSlides[selectedSlideIndex].content || [],
                      type: (generatedSlides[selectedSlideIndex].type as any) || 'content',
                      imageUrl: generatedSlides[selectedSlideIndex].image?.url
                    }} />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Waiting for slides...</p>
                  </div>
                )}
              </div>

              {/* Slide Info */}
              {generatedSlides[selectedSlideIndex] && (
                <div className="p-3 border-t border-border bg-card">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Type: {generatedSlides[selectedSlideIndex].type}</span>
                    {generatedSlides[selectedSlideIndex].notes && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> Speaker notes available
                      </span>
                    )}
                    {generatedSlides[selectedSlideIndex].image && (
                      <span className="flex items-center gap-1 text-green-500">
                        <ImageIcon className="w-4 h-4" /> AI Image generated
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
