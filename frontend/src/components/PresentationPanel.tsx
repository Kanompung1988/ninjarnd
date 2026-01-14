'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Plus, 
  Sparkles, 
  FileDown, 
  Loader2,
  Play,
  Eye,
  FileText,
  Download,
  Trash2,
  Edit3,
  Save,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react'
import SlideEditor from './SlideEditor'
import ZStyleSlideGenerator from './ZStyleSlideGenerator'
import CodeSlideRenderer from './CodeSlideRenderer'
import toast from 'react-hot-toast'

interface Slide {
  id: string
  type: 'title' | 'content' | 'two-column' | 'image' | 'quote' | 'stats-grid' | 'chart' | 'infographic' | 'comparison' | 'timeline' | 'icon-grid'
  title: string
  content: string | any
  imageUrl?: string
  stats?: Array<{label: string, value: string, icon?: string, color?: string}>
  chartType?: 'bar' | 'pie' | 'line' | 'donut'
  chartData?: {
    labels: string[]
    values: number[]
    colors?: string[]
  }
  steps?: Array<{number: string, title: string, description: string, icon?: string}>
  leftSide?: {title: string, points: string[], color?: string, icon?: string}
  rightSide?: {title: string, points: string[], color?: string, icon?: string}
  layout?: {
    backgroundColor?: string
    backgroundGradient?: string
    textColor?: string
    fontSize?: string
    gridColumns?: number
    flowDirection?: string
    alignment?: string
  }
}

interface Presentation {
  id: string
  title: string
  slides: Slide[]
  createdAt: string
  updatedAt: string
}

export default function PresentationPanel() {
  const { data: session } = useSession()
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [currentPresentation, setCurrentPresentation] = useState<Presentation | null>(null)
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateTopic, setGenerateTopic] = useState('')
  const [slideCount, setSlideCount] = useState(8)
  const [presentationStyle, setPresentationStyle] = useState('professional')
  const [researchBlogs, setResearchBlogs] = useState<any[]>([])
  const [showResearchBlogs, setShowResearchBlogs] = useState(true) // Changed to true by default
  const [isLoadingPresentations, setIsLoadingPresentations] = useState(false)
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false)
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null) // Track selected blog
  const [selectedModel] = useState<'glm-7step'>('glm-7step') // GLM-4.7 7-Step Only
  
  // Z-Style Mode States (2-Step Generation)
  const [useZStyleMode, setUseZStyleMode] = useState(true) // Default to Z-Style
  const [zStyleOutline, setZStyleOutline] = useState<any>(null)
  const [zStyleStep, setZStyleStep] = useState<'input' | 'outline' | 'generating' | 'complete'>('input')
  const [streamingSlides, setStreamingSlides] = useState<Slide[]>([])
  const [streamProgress, setStreamProgress] = useState({ current: 0, total: 0, message: '' })
  
  // 7-Step Progress State (Z.AI Style)
  const [thinkingSteps, setThinkingSteps] = useState<{
    step: number;
    name: string;
    status: 'pending' | 'in_progress' | 'complete';
    result?: any;
  }[]>([
    { step: 1, name: 'Content Analysis', status: 'pending' },
    { step: 2, name: 'Planning & Direction', status: 'pending' },
    { step: 3, name: 'Research & Data', status: 'pending' },
    { step: 4, name: 'Image Generation', status: 'pending' },
    { step: 5, name: 'Create Slides', status: 'pending' },
    { step: 6, name: 'Review & Improve', status: 'pending' },
    { step: 7, name: 'Finalize', status: 'pending' },
  ])
  const [currentThinkingStep, setCurrentThinkingStep] = useState(0)
  const [previewSlides, setPreviewSlides] = useState<any[]>([]) // Live preview
  
  // Code Slides Mode (Z.AI Style HTML/CSS)
  const [useCodeSlides, setUseCodeSlides] = useState(false)
  const [codeSlides, setCodeSlides] = useState<any[]>([])
  const [codeSlideTheme, setCodeSlideTheme] = useState('professional')
  const [currentCodeSlideIndex, setCurrentCodeSlideIndex] = useState(0)

  // Auto-load research blogs on mount
  useEffect(() => {
    loadResearchBlogs()
  }, [])

  // Load presentations from backend
  const loadPresentations = async () => {
    setIsLoadingPresentations(true)
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/presentations`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.presentations) {
          // Transform backend format to frontend format
          const loadedPresentations = data.presentations.map((p: any) => ({
            id: p.id,
            title: p.title,
            slides: [],
            createdAt: p.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))
          setPresentations(loadedPresentations)
          toast.success(`Loaded ${data.presentations.length} presentations`)
        }
      }
    } catch (error) {
      console.error('Failed to load presentations:', error)
      toast.error('Failed to load presentations')
    } finally {
      setIsLoadingPresentations(false)
    }
  }

  // Load full presentation data
  const loadPresentationData = async (presentationId: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/presentations/${presentationId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.presentation) {
          return {
            id: presentationId,
            title: data.presentation.title,
            slides: data.presentation.slides,
            createdAt: data.presentation.metadata?.generated_at || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      }
    } catch (error) {
      console.error('Failed to load presentation data:', error)
    }
    return null
  }

  // Save presentation to backend
  const savePresentationToBackend = async (presentation: Presentation) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/presentations/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: presentation.title,
          slides: presentation.slides,
          metadata: {
            createdAt: presentation.createdAt,
            updatedAt: presentation.updatedAt
          }
        }),
      })
      if (response.ok) {
        const data = await response.json()
        toast.success('Presentation saved to backend!')
        return data.presentation_id
      }
    } catch (error) {
      console.error('Failed to save presentation:', error)
      toast.error('Failed to save presentation')
    }
    return null
  }

  // Load research blogs when modal opens
  const loadResearchBlogs = async () => {
    setIsLoadingBlogs(true)
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'
      const userEmail = session?.user?.email || 'anonymous'
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/research-blogs?user_id=${encodeURIComponent(userEmail)}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setResearchBlogs(data.blogs || [])
        console.log(`📚 Loaded ${data.blogs?.length || 0} research blogs`)
      }
    } catch (error) {
      console.error('Failed to load research blogs:', error)
    } finally {
      setIsLoadingBlogs(false)
    }
  }

  // Generate slides from research blog
  const handleGenerateSlidesFromBlog = async (blogId: string) => {
    try {
      setIsGenerating(true)
      setZStyleStep('generating')
      toast.loading('Generating slides from research...', { id: 'blog-slides' })
      
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'
      const userEmail = session?.user?.email || 'anonymous'
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/research-blogs/${blogId}/generate-slides`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blog_id: blogId,
          user_id: userEmail,
          slide_count: 8,
          style: 'professional'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate slides')
      }
      
      const data = await response.json()
      
      if (data.success && data.slides) {
        // Convert to internal format
        const formattedSlides: Slide[] = data.slides.map((slide: any, index: number) => ({
          id: slide.id || `slide-${index + 1}`,
          type: slide.type || 'content',
          title: slide.title || '',
          subtitle: slide.subtitle,
          content: Array.isArray(slide.content) ? slide.content : [slide.content].filter(Boolean),
          notes: slide.notes || '',
          imageUrl: slide.imageUrl
        }))
        
        setStreamingSlides(formattedSlides)
        setSelectedSlideIndex(0)
        setZStyleStep('complete')
        
        toast.success(`Generated ${formattedSlides.length} slides from research!`, { id: 'blog-slides' })
      }
    } catch (error) {
      console.error('Failed to generate slides from blog:', error)
      toast.error('Failed to generate slides from research', { id: 'blog-slides' })
      setZStyleStep('input')
    } finally {
      setIsGenerating(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Z-STYLE GENERATION (2-Step + Streaming) - NEW!
  // ═══════════════════════════════════════════════════════════════
  
  const handleZStyleGenerateOutline = async () => {
    if (!generateTopic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setIsGenerating(true)
    setZStyleStep('input')
    const modelName = 'GLM-4.7 (7-Step)'
    const toastId = toast.loading(`📋 Generating outline with ${modelName}...`)
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zstyle/outline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: generateTopic,
          slide_count: slideCount,
          style: presentationStyle,
          model: selectedModel, // 🎯 Model selection: 'glm', 'azure', or 'auto'
          user_id: 'user'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate outline')
      }

      const data = await response.json()
      
      if (data.success) {
        setZStyleOutline(data.data)
        setZStyleStep('outline')
        toast.success('✅ Outline ready! Review and confirm.', { id: toastId })
      } else {
        throw new Error(data.error || 'Failed to generate outline')
      }
    } catch (error: any) {
      console.error('Outline error:', error)
      toast.error(`❌ ${error.message}`, { id: toastId })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleZStyleGenerateSlides = async () => {
    if (!zStyleOutline) return

    setIsGenerating(true)
    setZStyleStep('generating')
    setStreamingSlides([])
    setStreamProgress({ current: 0, total: zStyleOutline.outline?.length || 0, message: 'Starting...' })
    
    const toastId = toast.loading('🎨 Generating slides with streaming...')

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zstyle/slides/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outline: zStyleOutline,
          generate_images: true,
          model: selectedModel, // 🎯 Model selection: 'glm', 'azure', or 'auto'
          research_context: null,
          user_id: 'user'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start slide generation')
      }

      // Read SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      const generatedSlides: Slide[] = []

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              switch (data.type) {
                case 'progress':
                  setStreamProgress({
                    current: data.current || 0,
                    total: data.total || 0,
                    message: data.message || ''
                  })
                  break

                case 'step_start':
                  // 7-Step process step starting
                  setStreamProgress({
                    current: data.step || 0,
                    total: 7,
                    message: data.message || `Step ${data.step}: ${data.name || ''}`
                  })
                  break

                case 'step_complete':
                  // 7-Step process step completed
                  setStreamProgress({
                    current: data.step || 0,
                    total: 7,
                    message: data.message || `✅ Step ${data.step} complete`
                  })
                  break

                case 'slide':
                  if (data.slide) {
                    const newSlide: Slide = {
                      id: `slide-${data.slide_number}`,
                      type: data.slide.type || 'content',
                      title: data.slide.title || '',
                      content: Array.isArray(data.slide.content) 
                        ? data.slide.content.join('\n• ') 
                        : data.slide.content || '',
                      imageUrl: data.slide.image?.url,
                      layout: {
                        backgroundColor: '#ffffff',
                        textColor: '#1e293b'
                      }
                    }
                    generatedSlides.push(newSlide)
                    setStreamingSlides([...generatedSlides])
                    setSelectedSlideIndex(generatedSlides.length - 1)
                    toast.success(`✅ Slide ${data.slide_number} ready`, { duration: 1500 })
                  }
                  break

                case 'complete':
                  setZStyleStep('complete')
                  
                  // Create presentation
                  const newPresentation: Presentation = {
                    id: Date.now().toString(),
                    title: data.title || zStyleOutline.title || generateTopic,
                    slides: generatedSlides,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }

                  setPresentations([newPresentation, ...presentations])
                  setCurrentPresentation(newPresentation)
                  setSelectedSlideIndex(0)
                  setShowGenerateModal(false)
                  toast.success('🎉 All slides generated!', { id: toastId })
                  break

                case 'error':
                  toast.error(data.message || 'Generation error', { id: toastId })
                  break
              }
            } catch (e) {
              console.warn('Failed to parse SSE:', e)
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Stream error:', error)
      toast.error(`❌ ${error.message}`, { id: toastId })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleZStyleReset = () => {
    setZStyleStep('input')
    setZStyleOutline(null)
    setStreamingSlides([])
    setStreamProgress({ current: 0, total: 0, message: '' })
  }

  // Generate presentation with Gemini 2.5 Pro
  const handleGeneratePresentation = async (blogId: string | null = null) => {
    if (!generateTopic.trim() && !blogId) {
      toast.error('Please enter a topic or select a research blog')
      return
    }

    setIsGenerating(true)
    const toastId = toast.loading('🔍 Running DeepResearch to gather comprehensive data...')
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'
      
      let researchContext = ''
      let finalTopic = generateTopic
      
      // If blog ID provided, fetch that specific blog
      if (blogId) {
        try {
          toast.loading('📖 Loading research blog...', { id: toastId })
          const blogResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/research-blogs/${blogId}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          })
          
          if (blogResponse.ok) {
            const blogData = await blogResponse.json()
            if (blogData.success && blogData.blog) {
              // Extract comprehensive research context
              researchContext = `# Research Report: ${blogData.blog.query}\n\n`
              
              if (blogData.blog.executive_summary) {
                researchContext += `## Executive Summary\n${blogData.blog.executive_summary}\n\n`
              }
              
              if (blogData.blog.key_findings && blogData.blog.key_findings.length > 0) {
                researchContext += `## Key Findings\n`
                blogData.blog.key_findings.forEach((finding: string, idx: number) => {
                  researchContext += `${idx + 1}. ${finding}\n`
                })
                researchContext += '\n'
              }
              
              if (blogData.blog.detailed_analysis) {
                researchContext += `## Detailed Analysis\n${blogData.blog.detailed_analysis}\n\n`
              }
              
              if (blogData.blog.recommendations && blogData.blog.recommendations.length > 0) {
                researchContext += `## Recommendations\n`
                blogData.blog.recommendations.forEach((rec: string, idx: number) => {
                  researchContext += `${idx + 1}. ${rec}\n`
                })
                researchContext += '\n'
              }
              
              // Include sources for credibility
              if (blogData.blog.sources && blogData.blog.sources.length > 0) {
                researchContext += `## Sources (${blogData.blog.sources.length} references)\n`
                blogData.blog.sources.slice(0, 10).forEach((source: any, idx: number) => {
                  researchContext += `${idx + 1}. ${source.title || source.url}\n`
                  if (source.snippet) {
                    researchContext += `   "${source.snippet}"\n`
                  }
                })
              }
              
              finalTopic = blogData.blog.query || generateTopic
              toast.success('✅ Research context loaded!', { id: toastId })
            }
          }
        } catch (error) {
          console.error('Failed to fetch blog content:', error)
          toast.error('Failed to load research context', { id: toastId })
        }
      } else {
        // No blog selected - run DeepResearch now!
        try {
          toast.loading('🔬 Running comprehensive DeepResearch...', { id: toastId })
          
          const researchResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/research`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic: finalTopic,
              days_back: 30,
              effort: 'maximum',
              scope: 'comprehensive',
              model: 'typhoon-v2.5-30b-a3b-instruct',
              chat_id: `pres_${Date.now()}`,
              search_engine: 'hybrid',
              use_hybrid_search: true
            }),
          })
          
          if (researchResponse.ok) {
            const researchData = await researchResponse.json()
            if (researchData.success && researchData.report) {
              // Build comprehensive research context
              researchContext = `# Research Report: ${finalTopic}\n\n`
              
              if (researchData.report.executive_summary) {
                researchContext += `## Executive Summary\n${researchData.report.executive_summary}\n\n`
              }
              
              if (researchData.report.key_findings && researchData.report.key_findings.length > 0) {
                researchContext += `## Key Findings\n`
                researchData.report.key_findings.forEach((finding: string, idx: number) => {
                  researchContext += `${idx + 1}. ${finding}\n`
                })
                researchContext += '\n'
              }
              
              if (researchData.report.detailed_analysis) {
                researchContext += `## Detailed Analysis\n${researchData.report.detailed_analysis}\n\n`
              }
              
              if (researchData.report.market_intelligence) {
                researchContext += `## Market Intelligence\n${JSON.stringify(researchData.report.market_intelligence, null, 2)}\n\n`
              }
              
              if (researchData.report.recommendations && researchData.report.recommendations.length > 0) {
                researchContext += `## Recommendations\n`
                researchData.report.recommendations.forEach((rec: string, idx: number) => {
                  researchContext += `${idx + 1}. ${rec}\n`
                })
                researchContext += '\n'
              }
              
              if (researchData.report.key_metrics) {
                researchContext += `## Key Metrics\n${JSON.stringify(researchData.report.key_metrics, null, 2)}\n\n`
              }
              
              // Include sources
              if (researchData.report.sources && researchData.report.sources.length > 0) {
                researchContext += `## Sources (${researchData.report.sources.length} references)\n`
                researchData.report.sources.slice(0, 15).forEach((source: any, idx: number) => {
                  researchContext += `${idx + 1}. ${source.title || source.url}\n`
                  if (source.snippet) {
                    researchContext += `   "${source.snippet}"\n`
                  }
                })
              }
              
              toast.success(`✅ DeepResearch complete! Found ${researchData.report.sources?.length || 0} sources`, { id: toastId })
            } else {
              toast.error('DeepResearch returned no results', { id: toastId })
            }
          } else {
            throw new Error('DeepResearch failed')
          }
        } catch (error) {
          console.error('DeepResearch error:', error)
          toast.error('DeepResearch failed, generating without research context', { id: toastId })
        }
      }
      
      // Now generate presentation with research context
      toast.loading('🎨 Generating presentation slides with AI...', { id: toastId })
      
      const requestBody: any = {
        topic: finalTopic,
        slideCount,
        style: presentationStyle,
        aspectRatio: '16:9',
        fontSizeMode: 'optimized',
        researchContext: researchContext || undefined,
        generate_images: true, // ✅ Enabled: Using CogView-3 (GLM)
        model: selectedModel, // 🎯 GLM-4.7 7-Step Only
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/presentations/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error('Failed to generate presentation')
      }

      const data = await response.json()
      const newPresentation: Presentation = {
        id: data.presentation_id || Date.now().toString(),
        title: data.title || generateTopic,
        slides: data.slides,
        createdAt: data.metadata?.generated_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setPresentations([newPresentation, ...presentations])
      setCurrentPresentation(newPresentation)
      setSelectedSlideIndex(0)
      setShowGenerateModal(false)
      setGenerateTopic('')
      toast.success('✅ Presentation with AI images generated successfully!', { id: toastId })
      
      // Reload presentations list
      await loadPresentations()
    } catch (error) {
      console.error('Generate error:', error)
      toast.error('❌ Failed to generate presentation', { id: toastId })
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate Code-based Slides (Z.AI Style) - Using new zstyle_engine with 7-Step Progress
  const handleGenerateCodeSlides = async () => {
    if (!generateTopic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setIsGenerating(true)
    setCodeSlides([])
    setPreviewSlides([])
    setZStyleStep('generating')
    setCurrentThinkingStep(0)
    
    // Reset thinking steps
    setThinkingSteps([
      { step: 1, name: 'Content Analysis', status: 'pending' },
      { step: 2, name: 'Planning & Direction', status: 'pending' },
      { step: 3, name: 'Research & Data', status: 'pending' },
      { step: 4, name: 'Image Generation', status: 'pending' },
      { step: 5, name: 'Create Slides', status: 'pending' },
      { step: 6, name: 'Review & Improve', status: 'pending' },
      { step: 7, name: 'Finalize', status: 'pending' },
    ])
    
    // Model name - GLM-4.7 7-Step Only
    const modelDisplayName = 'GLM-4.7 (Z.AI Direct)'
    const toastId = toast.loading(`🎨 Generating slides with ${modelDisplayName}...`)

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'
      
      // Use SSE streaming endpoint for real-time updates
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/zslides/generate/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: generateTopic.trim(),
          slide_count: slideCount,
          theme: codeSlideTheme,
          model: selectedModel,
          generate_images: true,
          use_research: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start slide generation')
      }

      // Read SSE stream for real-time updates
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      const generatedSlides: any[] = []

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              switch (data.type) {
                case 'step_start':
                  // Update step to in_progress
                  setCurrentThinkingStep(data.step)
                  setThinkingSteps(prev => prev.map(s => 
                    s.step === data.step ? { ...s, status: 'in_progress' } :
                    s.step < data.step ? { ...s, status: 'complete' } : s
                  ))
                  break

                case 'step_complete':
                  // Mark step as complete
                  setThinkingSteps(prev => prev.map(s => 
                    s.step === data.step ? { ...s, status: 'complete' } : s
                  ))
                  break

                case 'slide':
                  if (data.slide) {
                    generatedSlides.push(data.slide)
                    setPreviewSlides([...generatedSlides])
                    setCurrentCodeSlideIndex(generatedSlides.length - 1)
                    toast.success(`✅ Slide ${data.slide_number} ready`, { duration: 1500 })
                  }
                  break

                case 'complete':
                  // All done
                  setThinkingSteps(prev => prev.map(s => ({ ...s, status: 'complete' })))
                  setCurrentThinkingStep(7)
                  setCodeSlides(data.slides || generatedSlides)
                  setCurrentCodeSlideIndex(0)
                  setZStyleStep('complete')
                  setShowGenerateModal(false)
                  toast.success(`🎉 Generated ${(data.slides || generatedSlides).length} slides!`, { id: toastId })
                  break

                case 'error':
                  toast.error(data.message || 'Generation error', { id: toastId })
                  break
              }
            } catch (e) {
              console.warn('Failed to parse SSE:', e)
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Z-Style slides generation error:', error)
      toast.error(`❌ ${error.message || 'Failed to generate slides'}`)
      setZStyleStep('input')
      // Reset steps on error
      setThinkingSteps(prev => prev.map(s => ({ ...s, status: 'pending' })))
      setCurrentThinkingStep(0)
    } finally {
      setIsGenerating(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GENERATE PRESENTATION FROM CHAT CONTEXT (Z.AI Style)
  // ═══════════════════════════════════════════════════════════════
  const handleGenerateFromChat = async (chatContext: any) => {
    setIsGenerating(true)
    setCodeSlides([])
    setPreviewSlides([])
    setZStyleStep('generating')
    setCurrentThinkingStep(0)
    
    // Reset thinking steps
    setThinkingSteps([
      { step: 1, name: 'Content Analysis', status: 'pending' },
      { step: 2, name: 'Planning & Direction', status: 'pending' },
      { step: 3, name: 'Research & Data', status: 'pending' },
      { step: 4, name: 'Image Generation', status: 'pending' },
      { step: 5, name: 'Create Slides', status: 'pending' },
      { step: 6, name: 'Review & Improve', status: 'pending' },
      { step: 7, name: 'Finalize', status: 'pending' },
    ])
    
    const toastId = toast.loading('🤖 Generating presentation from chat with GLM-4.7...')

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'
      
      // Start progress animation
      let currentStep = 1
      const progressInterval = setInterval(() => {
        if (currentStep <= 7) {
          setCurrentThinkingStep(currentStep)
          setThinkingSteps(prev => prev.map(s => 
            s.step === currentStep ? { ...s, status: 'in_progress' } :
            s.step < currentStep ? { ...s, status: 'complete' } : s
          ))
          if (currentStep < 5) currentStep++
          else if (currentStep === 5) setTimeout(() => { currentStep++ }, 2000)
          else currentStep++
        }
      }, 1500)
      
      // Call the chat-to-presentation endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat-to-presentation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_history: chatContext.chat_history?.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })) || [],
          topic_hint: chatContext.research_data?.query || chatContext.chat_title,
          slide_count: slideCount,
          style: presentationStyle,
          generate_images: true,
          user_id: session?.user?.email || 'anonymous'
        })
      })
      
      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error('Failed to generate presentation from chat')
      }

      const data = await response.json()
      
      // Mark all steps complete
      setThinkingSteps(prev => prev.map(s => ({ ...s, status: 'complete' })))
      setCurrentThinkingStep(7)
      
      if (data.success && data.slides) {
        // Add slides one by one with preview effect
        for (let i = 0; i < data.slides.length; i++) {
          await new Promise(r => setTimeout(r, 200))
          setPreviewSlides(prev => [...prev, data.slides[i]])
        }
        
        setCodeSlides(data.slides)
        setCurrentCodeSlideIndex(0)
        setZStyleStep('complete')
        
        // Create presentation object
        const newPresentation: Presentation = {
          id: Date.now().toString(),
          title: data.title || chatContext.chat_title || 'Chat Presentation',
          slides: data.slides.map((slide: any, idx: number) => ({
            id: `slide-${idx + 1}`,
            type: slide.type || 'content',
            title: slide.title || '',
            content: slide.content || '',
            imageUrl: slide.image_url
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        setPresentations([newPresentation, ...presentations])
        setCurrentPresentation(newPresentation)
        
        toast.success(`✅ Generated ${data.slides.length} slides from chat!`, { id: toastId })
      } else {
        throw new Error('Invalid slides response')
      }

    } catch (error: any) {
      console.error('Chat-to-presentation error:', error)
      toast.error(`❌ ${error.message || 'Failed to generate from chat'}`, { id: toastId })
      setZStyleStep('input')
      setThinkingSteps(prev => prev.map(s => ({ ...s, status: 'pending' })))
      setCurrentThinkingStep(0)
    } finally {
      setIsGenerating(false)
    }
  }

  // Check for chat context on mount
  useEffect(() => {
    const chatContextStr = sessionStorage.getItem('chat_context_for_slides')
    if (chatContextStr) {
      try {
        const chatContext = JSON.parse(chatContextStr)
        sessionStorage.removeItem('chat_context_for_slides')
        sessionStorage.removeItem('research_data_for_slides')
        
        // Set the topic from chat
        if (chatContext.research_data?.query) {
          setGenerateTopic(chatContext.research_data.query)
        }
        
        // Auto-generate from chat context
        toast.success('📚 Chat context loaded! Starting presentation generation...')
        setTimeout(() => {
          handleGenerateFromChat(chatContext)
        }, 500)
      } catch (e) {
        console.error('Failed to parse chat context:', e)
      }
    }
  }, [])

  // Create new blank presentation
  const handleCreateBlank = () => {
    const newPresentation: Presentation = {
      id: Date.now().toString(),
      title: 'Untitled Presentation',
      slides: [
        {
          id: '1',
          type: 'title',
          title: 'Click to edit title',
          content: 'Click to edit subtitle',
          layout: {
            backgroundColor: '#6366f1',
            textColor: '#ffffff',
            fontSize: 'large',
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setPresentations([newPresentation, ...presentations])
    setCurrentPresentation(newPresentation)
    setSelectedSlideIndex(0)
    toast.success('New presentation created')
  }

  // Download slides as HTML
  const handleDownloadHTML = async () => {
    if (codeSlides.length === 0) {
      toast.error('No slides to download')
      return
    }

    const toastId = toast.loading('📥 Preparing download...')

    try {
      // Create full HTML document
      const slidesHtml = codeSlides.map(s => s.html_code || '').join('\n')
      const fullHtml = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${generateTopic || 'Presentation'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; }
        .presentation { scroll-snap-type: y mandatory; overflow-y: scroll; height: 100vh; }
        .slide { scroll-snap-align: start; }
        .nav-controls {
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            display: flex; gap: 15px; z-index: 1000;
            background: rgba(0,0,0,0.5); padding: 10px 20px;
            border-radius: 50px; backdrop-filter: blur(10px);
        }
        .nav-btn {
            width: 40px; height: 40px; border-radius: 50%;
            border: 2px solid white; background: transparent;
            color: white; cursor: pointer; display: flex;
            align-items: center; justify-content: center; transition: all 0.3s;
        }
        .nav-btn:hover { background: white; color: black; }
    </style>
</head>
<body>
    <div class="presentation" id="presentation">
        ${slidesHtml}
    </div>
    <div class="nav-controls">
        <button class="nav-btn" onclick="prevSlide()">←</button>
        <button class="nav-btn" onclick="nextSlide()">→</button>
        <button class="nav-btn" onclick="toggleFullscreen()">⛶</button>
    </div>
    <script>
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        function goToSlide(n) {
            currentSlide = Math.max(0, Math.min(n, slides.length - 1));
            slides[currentSlide].scrollIntoView({ behavior: 'smooth' });
        }
        function nextSlide() { goToSlide(currentSlide + 1); }
        function prevSlide() { goToSlide(currentSlide - 1); }
        function toggleFullscreen() {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'f') toggleFullscreen();
        });
    </script>
</body>
</html>`

      // Create download blob
      const blob = new Blob([fullHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(generateTopic || 'presentation').replace(/\s+/g, '_')}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('✅ Downloaded successfully!', { id: toastId })
    } catch (error: any) {
      console.error('Download error:', error)
      toast.error(`❌ Download failed: ${error.message}`, { id: toastId })
    }
  }

  // Update slide
  const handleUpdateSlide = (slideIndex: number, updatedSlide: Slide) => {
    if (!currentPresentation) return

    const updatedSlides = [...currentPresentation.slides]
    updatedSlides[slideIndex] = updatedSlide

    const updatedPresentation = {
      ...currentPresentation,
      slides: updatedSlides,
      updatedAt: new Date().toISOString(),
    }

    setCurrentPresentation(updatedPresentation)
    setPresentations(presentations.map(p => 
      p.id === updatedPresentation.id ? updatedPresentation : p
    ))
  }

  // Add new slide
  const handleAddSlide = (type: Slide['type'] = 'content') => {
    if (!currentPresentation) return

    const newSlide: Slide = {
      id: Date.now().toString(),
      type,
      title: 'New Slide Title',
      content: 'Click to edit content',
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontSize: 'medium',
      },
    }

    const updatedPresentation = {
      ...currentPresentation,
      slides: [...currentPresentation.slides, newSlide],
      updatedAt: new Date().toISOString(),
    }

    setCurrentPresentation(updatedPresentation)
    setPresentations(presentations.map(p => 
      p.id === updatedPresentation.id ? updatedPresentation : p
    ))
    setSelectedSlideIndex(currentPresentation.slides.length)
  }

  // Delete slide
  const handleDeleteSlide = (index: number) => {
    if (!currentPresentation || currentPresentation.slides.length <= 1) {
      toast.error('Cannot delete the only slide')
      return
    }

    const updatedSlides = currentPresentation.slides.filter((_, i) => i !== index)
    const updatedPresentation = {
      ...currentPresentation,
      slides: updatedSlides,
      updatedAt: new Date().toISOString(),
    }

    setCurrentPresentation(updatedPresentation)
    setPresentations(presentations.map(p => 
      p.id === updatedPresentation.id ? updatedPresentation : p
    ))
    setSelectedSlideIndex(Math.max(0, index - 1))
  }

  // Export to PPTX
  const handleExportPPTX = async () => {
    if (!currentPresentation) {
      toast.error('No presentation to export')
      return
    }

    setIsExporting(true)
    const toastId = toast.loading('Exporting to PPTX...')
    
    try {
      console.log('📄 Starting PPTX export...', {
        title: currentPresentation.title,
        slideCount: currentPresentation.slides?.length || 0,
        hasSlides: !!currentPresentation.slides
      })

      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'
      const response = await fetch('/api/presentations/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          presentation: currentPresentation,
          format: 'pptx',
        }),
      })

      console.log('   Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Export failed:', errorData)
        throw new Error(errorData.error || 'Export failed')
      }

      const blob = await response.blob()
      console.log('✅ Export successful! Blob size:', blob.size)
      
      if (blob.size === 0) {
        throw new Error('Exported file is empty')
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentPresentation.title}.pptx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Exported to PPTX successfully!', { id: toastId })
    } catch (error) {
      console.error('❌ Export error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to export presentation',
        { id: toastId }
      )
    } finally {
      setIsExporting(false)
    }
  }

  // Export to PDF
  const handleExportPDF = async () => {
    if (!currentPresentation) return

    setIsExporting(true)
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key'
      const response = await fetch('/api/presentations/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          presentation: currentPresentation,
          format: 'pdf',
        }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentPresentation.title}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Exported to PDF successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export presentation')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Bar - Responsive */}
      <div className="h-auto min-h-[64px] border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 md:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Title Section */}
          <div className="flex items-center space-x-3">
            {currentPresentation ? (
              <input
                type="text"
                value={currentPresentation.title}
                onChange={(e) => {
                  const updated = { ...currentPresentation, title: e.target.value }
                  setCurrentPresentation(updated)
                  setPresentations(presentations.map(p => p.id === updated.id ? updated : p))
                }}
                className="text-lg md:text-xl font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 text-gray-900 dark:text-white w-full md:w-auto"
                placeholder="Presentation Title"
              />
            ) : (
              <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                My Presentations
              </h1>
            )}
          </div>

          {/* Action Buttons - Responsive Grid */}
          <div className="flex flex-wrap items-center gap-2">
            {currentPresentation ? (
              <>
                {/* Save Button */}
                <button
                  onClick={() => savePresentationToBackend(currentPresentation)}
                  className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                  title="Save Presentation"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save</span>
                </button>

                {/* Export Dropdown */}
                <div className="relative group">
                  <button
                    className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    title="Export"
                  >
                    <FileDown className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
                    <button
                      onClick={handleExportPPTX}
                      disabled={isExporting}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                      <span>PPTX</span>
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Load Presentations - Only show when no presentation */}
                <button
                  onClick={loadPresentations}
                  disabled={isLoadingPresentations}
                  className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                  title="Load Presentations"
                >
                  {isLoadingPresentations ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="hidden md:inline">Load</span>
                </button>
              </>
            )}

            {/* New Blank */}
            <button
              onClick={handleCreateBlank}
              className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              title="Create Blank Presentation"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Blank</span>
            </button>

            {/* Generate with AI */}
            <button
              onClick={() => {
                setShowGenerateModal(true)
                if (researchBlogs.length === 0) loadResearchBlogs()
              }}
              className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 ninja-gradient text-white rounded-lg hover:shadow-lg transition-all text-sm"
              title="Generate with AI"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">{/* Research Blogs Sidebar - Responsive */}
        <div className={`${
          showResearchBlogs ? 'w-full sm:w-80' : 'w-0'
        } transition-all duration-300 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden`}>
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">
                  Research Sources
                </h3>
              </div>
              <button
                onClick={() => setShowResearchBlogs(!showResearchBlogs)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                title="Toggle Sidebar"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Research Blogs List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isLoadingBlogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : researchBlogs.length > 0 ? (
                <div className="space-y-3">
                  {researchBlogs.map((blog) => (
                    <div
                      key={blog.id}
                      onClick={() => {
                        setSelectedBlogId(blog.id)
                        setGenerateTopic(blog.query)
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedBlogId === blog.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500 shadow-md'
                          : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                          {blog.query}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setGenerateTopic(blog.query)
                            setSelectedBlogId(blog.id)
                            setShowGenerateModal(true)
                          }}
                          className="p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors flex-shrink-0 ml-2"
                          title="Generate Slides"
                        >
                          <Sparkles className="w-4 h-4 text-purple-500" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span>📅 {new Date(blog.timestamp).toLocaleDateString('th-TH', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>🤖 {blog.model?.split('-')[0] || 'AI'}</span>
                        </div>
                        {blog.total_sources > 0 && (
                          <div className="flex items-center space-x-2">
                            <span>📚 {blog.total_sources} sources</span>
                          </div>
                        )}
                        {blog.key_findings && blog.key_findings.length > 0 && (
                          <div className="mt-2 text-xs">
                            <span className="font-medium text-purple-600 dark:text-purple-400">🔑 Key Findings:</span>
                            <ul className="mt-1 space-y-0.5">
                              {blog.key_findings.slice(0, 2).map((finding: string, idx: number) => (
                                <li key={idx} className="text-gray-600 dark:text-gray-300 line-clamp-1">
                                  • {finding.substring(0, 50)}...
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {selectedBlogId === blog.id && (
                        <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGenerateSlidesFromBlog(blog.id)
                            }}
                            disabled={isGenerating}
                            className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs rounded-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-lg"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                <span>🎨 Generate Slides from Research</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No research blogs yet</p>
                  <p className="text-xs mt-1">Use DeepResearch mode in Chat</p>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
              <button
                onClick={loadResearchBlogs}
                disabled={isLoadingBlogs}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm disabled:opacity-50"
              >
                {isLoadingBlogs ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Sidebar Button (when collapsed) */}
        {!showResearchBlogs && (
          <button
            onClick={() => setShowResearchBlogs(true)}
            className="w-8 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-r-lg flex items-center justify-center self-start mt-4 shadow-lg transition-all hover:w-10"
            title="Show Research Sources"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {currentPresentation ? (
          <>
            {/* Slide Thumbnails - Responsive */}
            <div className="hidden md:block w-48 lg:w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto custom-scrollbar">
              <div className="p-3 lg:p-4 space-y-2">
                {currentPresentation.slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    onClick={() => setSelectedSlideIndex(index)}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedSlideIndex === index
                        ? 'border-purple-500 shadow-lg ring-2 ring-purple-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                    }`}
                  >
                    <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-2 lg:p-3">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate mb-1">
                        {index + 1}. {slide.title}
                      </div>
                      <div className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {typeof slide.content === 'string' 
                          ? slide.content 
                          : typeof slide.content === 'object' && slide.content !== null
                          ? JSON.stringify(slide.content).slice(0, 50) + '...'
                          : ''}
                      </div>
                    </div>
                    
                    {currentPresentation.slides.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSlide(index)
                        }}
                        className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    
                    {/* Slide Number Badge */}
                    <div className={`absolute bottom-1 left-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedSlideIndex === index
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-700 text-gray-200'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => handleAddSlide()}
                  className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Slide</span>
                </button>
              </div>
            </div>

            {/* Mobile Slide Navigator */}
            <div className="md:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center space-x-3">
              <button
                onClick={() => setSelectedSlideIndex(Math.max(0, selectedSlideIndex - 1))}
                disabled={selectedSlideIndex === 0}
                className="p-1 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium">
                {selectedSlideIndex + 1} / {currentPresentation.slides.length}
              </span>
              <button
                onClick={() => setSelectedSlideIndex(Math.min(currentPresentation.slides.length - 1, selectedSlideIndex + 1))}
                disabled={selectedSlideIndex === currentPresentation.slides.length - 1}
                className="p-1 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Slide Editor */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50 dark:bg-gray-900">
              <SlideEditor
                slide={currentPresentation.slides[selectedSlideIndex]}
                onUpdate={(updatedSlide: Slide) => handleUpdateSlide(selectedSlideIndex, updatedSlide)}
              />
            </div>
          </>
        ) : codeSlides.length > 0 ? (
          /* Code Slides View (Z.AI Style) */
          <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    ✨ Code Slides Preview
                    <span className="text-sm font-normal bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full">
                      {codeSlides.length} slides
                    </span>
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{generateTopic}</p>
                </div>
                <button
                  onClick={() => { setCodeSlides([]); setZStyleStep('input'); }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
                >
                  ← Create New
                </button>
              </div>
              <CodeSlideRenderer
                slides={codeSlides}
                isGenerating={isGenerating}
                currentGeneratingSlide={streamProgress.current}
                totalSlides={slideCount}
                onExportPPTX={handleDownloadHTML}
              />
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
            <div className="text-center max-w-md w-full">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 ninja-gradient rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Create Your First Presentation
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-8">
                Start from scratch or let AI generate a professional presentation for you
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:space-x-4">
                <button
                  onClick={handleCreateBlank}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Start Blank</span>
                </button>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="flex items-center justify-center space-x-2 px-6 py-3 ninja-gradient text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Generate with AI</span>
                </button>
              </div>

              {presentations.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 text-left">
                    Recent Presentations ({presentations.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {presentations.slice(0, 6).map((pres) => (
                      <div
                        key={pres.id}
                        className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 cursor-pointer transition-colors group"
                      >
                        <div
                          onClick={async () => {
                            // Load full data if slides are empty
                            if (!pres.slides || pres.slides.length === 0) {
                              const fullData = await loadPresentationData(pres.id)
                              if (fullData) {
                                setCurrentPresentation(fullData)
                                setSelectedSlideIndex(0)
                              }
                            } else {
                              setCurrentPresentation(pres)
                              setSelectedSlideIndex(0)
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <FileText className="w-5 h-5 text-purple-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {pres.slides?.length || 0} slides
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {pres.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(pres.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {researchBlogs.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Available Research Blogs ({researchBlogs.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                    {researchBlogs.map((blog) => (
                      <div
                        key={blog.id}
                        className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm text-gray-900 dark:text-white">
                              {blog.query}
                            </h5>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {blog.summary}
                            </p>
                            <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                              <span>{blog.model}</span>
                              <span>•</span>
                              <span>{blog.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Generate Modal - Z-Style Mode */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  🎨 AI Slide Generator
                </h2>
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded-full">
                  {zStyleStep === 'input' && 'Step 1: Topic'}
                  {zStyleStep === 'outline' && 'Step 2: Review Outline'}
                  {zStyleStep === 'generating' && 'Step 3: Generating...'}
                  {zStyleStep === 'complete' && '✅ Complete'}
                </span>
              </div>

              {/* Mode Toggle: PPTX vs Code Slides */}
              {zStyleStep === 'input' && (
                <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {useCodeSlides ? '✨ Code Slides (Z.AI Style)' : '📄 Standard PPTX'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {useCodeSlides 
                          ? 'Beautiful HTML/CSS slides rendered in browser' 
                          : 'Traditional PowerPoint with CogView-3 images'
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => setUseCodeSlides(!useCodeSlides)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        useCodeSlides 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        useCodeSlides ? 'translate-x-8' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Input Topic */}
              {zStyleStep === 'input' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Topic
                    </label>
                    <input
                      type="text"
                      value={generateTopic}
                      onChange={(e) => setGenerateTopic(e.target.value)}
                      placeholder="e.g., Artificial Intelligence in Healthcare"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white text-sm sm:text-base"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Slides: {slideCount}
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="15"
                        value={slideCount}
                        onChange={(e) => setSlideCount(parseInt(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {useCodeSlides ? 'Theme' : 'Style'}
                      </label>
                      <select
                        value={useCodeSlides ? codeSlideTheme : presentationStyle}
                        onChange={(e) => useCodeSlides ? setCodeSlideTheme(e.target.value) : setPresentationStyle(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                      >
                        <option value="professional">Professional</option>
                        <option value="modern">Modern Dark</option>
                        <option value="creative">Creative</option>
                        <option value="minimal">Minimal</option>
                        <option value="nature">Nature</option>
                      </select>
                    </div>
                  </div>

                  {/* Model Info - GLM-4.7 7-Step Only */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🧠</span>
                      <span className="font-semibold text-blue-800 dark:text-blue-200">GLM-4.7 (7-Step Process)</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ✨ AI generates presentation using 7-step workflow:
                    </p>
                    <ol className="text-xs text-blue-600 dark:text-blue-400 mt-2 space-y-1">
                      <li>1. Content Analysis</li>
                      <li>2. Planning & Direction</li>
                      <li>3. Research & Data</li>
                      <li>4. Image Generation (CogView-3)</li>
                      <li>5. Create Slides</li>
                      <li>6. Review & Improve</li>
                      <li>7. Finalize</li>
                    </ol>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => { setShowGenerateModal(false); handleZStyleReset(); setCodeSlides([]); }}
                      className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={useCodeSlides ? handleGenerateCodeSlides : handleZStyleGenerateOutline}
                      disabled={isGenerating || !generateTopic.trim()}
                      className={`flex-1 px-4 py-3 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium ${
                        useCodeSlides 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                          : 'ninja-gradient'
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>Generate Outline</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Review Outline */}
              {zStyleStep === 'outline' && zStyleOutline && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{zStyleOutline.title}</h3>
                    {zStyleOutline.subtitle && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{zStyleOutline.subtitle}</p>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {zStyleOutline.outline?.map((slide: any, index: number) => (
                      <div
                        key={slide.slide_number}
                        className="flex gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
                          {slide.slide_number}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{slide.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{slide.purpose}</p>
                        </div>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded h-fit">
                          {slide.type}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleZStyleReset}
                      className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleZStyleGenerateSlides}
                      disabled={isGenerating}
                      className="flex-[2] px-4 py-3 ninja-gradient text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          <span>Generate Full Slides + Images</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: 7-Step Generation Progress (Z.AI Style) */}
              {zStyleStep === 'generating' && (
                <div className="space-y-4">
                  {/* Header with Model Info */}
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-2xl">🧠</span>
                      </div>
                      <div>
                        <p className="font-bold">AI กำลังคิดและสร้าง Presentation</p>
                        <p className="text-sm opacity-90">
                          Model: GLM-4.7 (7-Step Process)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 7-Step Progress */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                      7-Step GLM-Style Thinking Process
                    </p>
                    {thinkingSteps.map((step) => (
                      <div 
                        key={step.step}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                          step.status === 'complete' 
                            ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700' 
                            : step.status === 'in_progress'
                            ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 animate-pulse'
                            : 'bg-gray-100 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 opacity-50'
                        }`}
                      >
                        {/* Step Number */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          step.status === 'complete' 
                            ? 'bg-green-500 text-white' 
                            : step.status === 'in_progress'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                        }`}>
                          {step.status === 'complete' ? '✓' : step.step}
                        </div>
                        
                        {/* Step Name */}
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${
                            step.status === 'complete' 
                              ? 'text-green-700 dark:text-green-300' 
                              : step.status === 'in_progress'
                              ? 'text-purple-700 dark:text-purple-300'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {step.name}
                          </p>
                        </div>

                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                          {step.status === 'complete' && (
                            <span className="text-green-500">✅</span>
                          )}
                          {step.status === 'in_progress' && (
                            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                          )}
                          {step.status === 'pending' && (
                            <span className="text-gray-400">○</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>{Math.round((currentThinkingStep / 7) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(currentThinkingStep / 7) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Live Preview of Generated Slides */}
                  {previewSlides.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        📑 Slides Preview ({previewSlides.length})
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {previewSlides.map((slide, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm animate-fadeIn"
                          >
                            <span className="text-blue-500 font-bold">#{index + 1}</span>
                            <span className="text-gray-700 dark:text-gray-300 truncate">{slide.title || 'Untitled'}</span>
                            {slide.image && <span className="text-xs">📷</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Complete */}
              {zStyleStep === 'complete' && (
                <div className="text-center py-6">
                  <div className="text-4xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Presentation Complete!
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Generated {streamingSlides.length} slides with AI
                  </p>
                  <button
                    onClick={() => { setShowGenerateModal(false); handleZStyleReset(); }}
                    className="px-6 py-3 ninja-gradient text-white rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    View Presentation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
