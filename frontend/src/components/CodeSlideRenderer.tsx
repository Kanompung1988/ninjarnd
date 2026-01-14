'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Download, 
  Maximize2,
  Minimize2,
  Grid,
  Monitor,
  Loader2,
  Check
} from 'lucide-react'

interface CodeSlide {
  slide_number: number
  type: string
  title: string
  html_code: string
  content: any
  theme: string
}

interface CodeSlideRendererProps {
  slides: CodeSlide[]
  isGenerating?: boolean
  currentGeneratingSlide?: number
  totalSlides?: number
  onExportPPTX?: () => void
}

export default function CodeSlideRenderer({
  slides,
  isGenerating = false,
  currentGeneratingSlide = 0,
  totalSlides = 0,
  onExportPPTX
}: CodeSlideRendererProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')
  const slideContainerRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  // Auto-advance slides when playing
  useEffect(() => {
    if (isPlaying && slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length)
      }, 5000) // 5 seconds per slide
      return () => clearInterval(timer)
    }
  }, [isPlaying, slides.length])

  // Follow generating slide
  useEffect(() => {
    if (isGenerating && currentGeneratingSlide > 0) {
      setCurrentSlide(currentGeneratingSlide - 1)
    }
  }, [isGenerating, currentGeneratingSlide])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        nextSlide()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevSlide()
      } else if (e.key === 'Escape') {
        setIsFullscreen(false)
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slides.length])

  const nextSlide = () => {
    if (slides.length > 0) {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }
  }

  const prevSlide = () => {
    if (slides.length > 0) {
      setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && slideContainerRef.current) {
      slideContainerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (slides.length === 0 && !isGenerating) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <div className="text-center text-gray-500">
          <Monitor className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No slides to display</p>
          <p className="text-sm mt-2">Generate slides to see them here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Slide Display */}
      <div 
        ref={slideContainerRef}
        className={`relative bg-gray-900 rounded-xl overflow-hidden ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
        }`}
      >
        {/* Slide Container */}
        <div className={`relative ${isFullscreen ? 'h-screen' : 'aspect-[16/9]'}`}>
          {viewMode === 'single' ? (
            // Single Slide View
            <div className="w-full h-full">
              {slides[currentSlide] ? (
                <div 
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: slides[currentSlide].html_code }}
                  style={{
                    fontSize: isFullscreen ? '1.5vw' : '0.8vw'
                  }}
                />
              ) : isGenerating ? (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-600 to-purple-600">
                  <div className="text-center text-white">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" />
                    <p className="text-2xl font-semibold">Generating Slide {currentGeneratingSlide}/{totalSlides}</p>
                    <p className="text-lg opacity-80 mt-2">Please wait...</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            // Grid View
            <div className="w-full h-full overflow-auto p-4 grid grid-cols-3 gap-4">
              {slides.map((slide, index) => (
                <div 
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index)
                    setViewMode('single')
                  }}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    index === currentSlide 
                      ? 'border-blue-500 ring-2 ring-blue-500/50' 
                      : 'border-transparent'
                  }`}
                >
                  <div 
                    className="aspect-[16/9]"
                    dangerouslySetInnerHTML={{ __html: slide.html_code }}
                    style={{ fontSize: '0.3vw', pointerEvents: 'none' }}
                  />
                  <div className="bg-gray-800 text-white text-xs p-2 text-center truncate">
                    {index + 1}. {slide.title}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Arrows (Single View) */}
          {viewMode === 'single' && slides.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Slide Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white rounded-full text-sm">
            {currentSlide + 1} / {slides.length}
            {isGenerating && ` (Generating...)`}
          </div>

          {/* Control Bar */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
              title={isPlaying ? 'Pause' : 'Play slideshow'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
              title={viewMode === 'single' ? 'Grid view' : 'Single view'}
            >
              {viewMode === 'single' ? <Grid className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            {onExportPPTX && slides.length > 0 && (
              <button
                onClick={onExportPPTX}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="Export to PowerPoint"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide Thumbnails */}
      {!isFullscreen && viewMode === 'single' && slides.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`flex-shrink-0 w-32 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentSlide 
                  ? 'border-blue-500 ring-2 ring-blue-500/30' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <div 
                className="aspect-[16/9] bg-gray-100 dark:bg-gray-800"
                dangerouslySetInnerHTML={{ __html: slide.html_code }}
                style={{ fontSize: '0.15vw', pointerEvents: 'none' }}
              />
              <div className="bg-gray-100 dark:bg-gray-800 text-xs p-1.5 text-center truncate flex items-center justify-center gap-1">
                {isGenerating && index === currentGeneratingSlide - 1 ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : index < slides.length ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : null}
                <span>{index + 1}</span>
              </div>
            </button>
          ))}
          
          {/* Placeholder for generating slides */}
          {isGenerating && Array.from({ length: totalSlides - slides.length }).map((_, index) => (
            <div
              key={`placeholder-${index}`}
              className="flex-shrink-0 w-32 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600"
            >
              <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-pulse" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 text-xs p-1.5 text-center text-gray-400">
                {slides.length + index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generation Progress */}
      {isGenerating && (
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Generating slides with AI...
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Slide {currentGeneratingSlide} of {totalSlides}
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-600">
                {Math.round((slides.length / totalSlides) * 100)}%
              </span>
            </div>
          </div>
          <div className="mt-3 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${(slides.length / totalSlides) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
