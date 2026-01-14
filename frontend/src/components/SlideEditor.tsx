'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Type, 
  Image as ImageIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Bold,
  Italic,
  Underline,
  Palette,
  Layout,
  Trash2
} from 'lucide-react'

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

interface SlideEditorProps {
  slide: Slide
  onUpdate: (slide: Slide) => void
}

export default function SlideEditor({ slide, onUpdate }: SlideEditorProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  
  const titleRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Helper to get content as string
  const getContentString = () => {
    if (typeof slide.content === 'string') {
      return slide.content
    } else if (typeof slide.content === 'object' && slide.content !== null) {
      // If content is an object (e.g., {left: "...", right: "..."}), convert to string
      return JSON.stringify(slide.content, null, 2)
    }
    return ''
  }

  const backgroundColors = [
    { name: 'Purple', value: '#6366f1' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'White', value: '#ffffff' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Dark', value: '#1f2937' },
  ]

  const layouts = [
    { id: 'title', name: 'Title', icon: Type },
    { id: 'content', name: 'Content', icon: AlignLeft },
    { id: 'two-column', name: 'Two Column', icon: Layout },
    { id: 'image', name: 'Image', icon: ImageIcon },
  ]

  const handleTitleChange = () => {
    if (titleRef.current) {
      onUpdate({
        ...slide,
        title: titleRef.current.innerText,
      })
    }
  }

  const handleContentChange = () => {
    if (contentRef.current) {
      onUpdate({
        ...slide,
        content: contentRef.current.innerText,
      })
    }
  }

  const handleBackgroundColorChange = (color: string) => {
    const isDark = ['#1f2937', '#6b7280', '#6366f1', '#3b82f6', '#ef4444', '#ec4899'].includes(color)
    onUpdate({
      ...slide,
      layout: {
        ...slide.layout!,
        backgroundColor: color,
        textColor: isDark ? '#ffffff' : '#1f2937',
      },
    })
    setShowColorPicker(false)
  }

  const handleLayoutChange = (layoutType: string) => {
    onUpdate({
      ...slide,
      type: layoutType as Slide['type'],
    })
    setShowLayoutMenu(false)
  }

  const renderSlideContent = () => {
    const bgColor = slide.layout?.backgroundColor || '#ffffff'
    const textColor = slide.layout?.textColor || '#1f2937'

    switch (slide.type) {
      case 'title':
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-12 relative"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {/* Background Image if available */}
            {slide.imageUrl && (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${slide.imageUrl})`,
                  filter: 'brightness(0.4)'
                }}
              />
            )}
            
            {/* Content overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div
                ref={titleRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleTitleChange}
                onFocus={() => setEditingTitle(true)}
                className="text-6xl font-bold text-center mb-6 outline-none focus:ring-2 focus:ring-purple-500 rounded px-4 py-2"
                style={{ color: slide.imageUrl ? '#ffffff' : textColor }}
              >
                {slide.title}
              </div>
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleContentChange}
                onFocus={() => setEditingContent(true)}
                className="text-3xl text-center outline-none focus:ring-2 focus:ring-purple-500 rounded px-4 py-2 opacity-80"
                style={{ color: slide.imageUrl ? '#ffffff' : textColor }}
              >
                {getContentString()}
              </div>
            </div>
          </div>
        )

      case 'content':
        return (
          <div
            className="w-full h-full p-12 flex gap-8"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {/* Content Side */}
            <div className={slide.imageUrl ? "w-1/2" : "w-full"}>
              <div
                ref={titleRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleTitleChange}
                onFocus={() => setEditingTitle(true)}
                className="text-5xl font-bold mb-8 outline-none focus:ring-2 focus:ring-purple-500 rounded px-4 py-2"
              >
                {slide.title}
              </div>
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleContentChange}
                onFocus={() => setEditingContent(true)}
                className="text-2xl leading-relaxed outline-none focus:ring-2 focus:ring-purple-500 rounded px-4 py-2"
              >
                {getContentString()}
              </div>
            </div>
            
            {/* Image Side */}
            {slide.imageUrl && (
              <div className="w-1/2 flex items-center justify-center">
                <img 
                  src={slide.imageUrl} 
                  alt={slide.title} 
                  className="max-w-full max-h-full rounded-lg shadow-lg object-contain"
                />
              </div>
            )}
          </div>
        )

      case 'two-column':
        return (
          <div
            className="w-full h-full p-12"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            <div
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleTitleChange}
              onFocus={() => setEditingTitle(true)}
              className="text-5xl font-bold mb-8 outline-none focus:ring-2 focus:ring-purple-500 rounded px-4 py-2"
            >
              {slide.title}
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleContentChange}
                onFocus={() => setEditingContent(true)}
                className="text-xl leading-relaxed outline-none focus:ring-2 focus:ring-purple-500 rounded px-4 py-2"
              >
                {getContentString()}
              </div>
              <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
                <ImageIcon className="w-16 h-16 text-gray-400" />
              </div>
            </div>
          </div>
        )

      case 'image':
        return (
          <div
            className="w-full h-full p-12"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            <div
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleTitleChange}
              onFocus={() => setEditingTitle(true)}
              className="text-4xl font-bold mb-8 outline-none focus:ring-2 focus:ring-purple-500 rounded px-4 py-2"
            >
              {slide.title}
            </div>
            <div className="flex items-center justify-center h-2/3 bg-gray-200 dark:bg-gray-700 rounded-lg">
              {slide.imageUrl ? (
                <img src={slide.imageUrl} alt={slide.title} className="max-h-full rounded-lg" />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Click to add image</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'quote':
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-12"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            <div className="text-6xl mb-8 opacity-50">"</div>
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleContentChange}
              onFocus={() => setEditingContent(true)}
              className="text-4xl italic text-center mb-8 outline-none focus:ring-2 focus:ring-purple-500 rounded px-4 py-2"
            >
              {getContentString()}
            </div>
            <div
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleTitleChange}
              onFocus={() => setEditingTitle(true)}
              className="text-2xl outline-none focus:ring-2 focus:ring-purple-500 rounded px-4 py-2 opacity-70"
            >
              {slide.title}
            </div>
          </div>
        )

      case 'stats-grid':
        return (
          <div
            className="w-full h-full p-12"
            style={{ 
              background: slide.layout?.backgroundGradient || bgColor,
              color: textColor 
            }}
          >
            <div className="text-4xl font-bold mb-8">{slide.title}</div>
            <div className={`grid gap-6 h-2/3`} style={{ gridTemplateColumns: `repeat(${slide.layout?.gridColumns || 3}, 1fr)` }}>
              {slide.stats?.map((stat, idx) => {
                // Safely extract string values from potentially nested objects
                const iconValue = typeof stat.icon === 'string' ? stat.icon : '📊'
                const colorValue = typeof stat.color === 'string' ? stat.color : textColor
                const statValue = typeof stat.value === 'string' ? stat.value : String(stat.value || '')
                const labelValue = typeof stat.label === 'string' ? stat.label : String(stat.label || '')
                
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20"
                  >
                    <div className="text-5xl mb-4">{iconValue}</div>
                    <div className="text-5xl font-bold mb-2" style={{ color: colorValue }}>
                      {statValue}
                    </div>
                    <div className="text-xl opacity-80 text-center">{labelValue}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'chart':
        return (
          <div
            className="w-full h-full p-12"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            <div className="text-4xl font-bold mb-8">{slide.title}</div>
            <div className="h-2/3 flex items-end justify-around gap-4 px-8">
              {slide.chartData?.labels.map((label, idx) => {
                const value = slide.chartData?.values[idx] || 0
                const maxValue = Math.max(...(slide.chartData?.values || [100]))
                const height = (value / maxValue) * 100
                const color = slide.chartData?.colors?.[idx] || '#6366f1'
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex items-end h-96">
                      <div
                        className="w-full rounded-t-xl transition-all flex items-center justify-center text-white font-bold text-2xl"
                        style={{ 
                          height: `${height}%`, 
                          backgroundColor: color,
                          minHeight: '60px'
                        }}
                      >
                        {value}%
                      </div>
                    </div>
                    <div className="mt-4 text-lg font-medium text-center">{label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'infographic':
        return (
          <div
            className="w-full h-full p-12"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            <div className="text-4xl font-bold mb-8 text-center">{slide.title}</div>
            <div className="flex items-center justify-around h-2/3">
              {slide.steps?.map((step, idx) => {
                const iconValue = typeof step.icon === 'string' ? step.icon : '✓'
                const numberValue = typeof step.number === 'string' ? step.number : String(step.number || idx + 1)
                const titleValue = typeof step.title === 'string' ? step.title : String(step.title || '')
                const descValue = typeof step.description === 'string' ? step.description : String(step.description || '')
                
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 relative">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold mb-4"
                      style={{ backgroundColor: '#6366f1', color: '#ffffff' }}
                    >
                      {numberValue}
                    </div>
                    <div className="text-6xl mb-3">{iconValue}</div>
                    <div className="text-2xl font-bold mb-2 text-center">{titleValue}</div>
                    <div className="text-lg opacity-80 text-center px-4">{descValue}</div>
                    {idx < (slide.steps?.length || 0) - 1 && (
                      <div className="absolute top-12 left-full w-full h-1 bg-purple-300" style={{ width: 'calc(100% - 96px)' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'comparison':
        return (
          <div
            className="w-full h-full p-12"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            <div className="text-4xl font-bold mb-8 text-center">{slide.title}</div>
            <div className="grid grid-cols-2 gap-8 h-2/3">
              <div className="flex flex-col items-center p-8 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                <div className="text-6xl mb-4">
                  {typeof slide.leftSide?.icon === 'string' ? slide.leftSide.icon : '❌'}
                </div>
                <div className="text-3xl font-bold mb-6" style={{ 
                  color: typeof slide.leftSide?.color === 'string' ? slide.leftSide.color : '#ef4444' 
                }}>
                  {typeof slide.leftSide?.title === 'string' ? slide.leftSide.title : String(slide.leftSide?.title || '')}
                </div>
                <div className="space-y-3 w-full">
                  {slide.leftSide?.points?.map((point, idx) => (
                    <div key={idx} className="text-xl flex items-start">
                      <span className="mr-3">•</span>
                      <span>{typeof point === 'string' ? point : String(point || '')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center p-8 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                <div className="text-6xl mb-4">
                  {typeof slide.rightSide?.icon === 'string' ? slide.rightSide.icon : '✓'}
                </div>
                <div className="text-3xl font-bold mb-6" style={{ 
                  color: typeof slide.rightSide?.color === 'string' ? slide.rightSide.color : '#10b981' 
                }}>
                  {typeof slide.rightSide?.title === 'string' ? slide.rightSide.title : String(slide.rightSide?.title || '')}
                </div>
                <div className="space-y-3 w-full">
                  {slide.rightSide?.points?.map((point, idx) => (
                    <div key={idx} className="text-xl flex items-start">
                      <span className="mr-3">✓</span>
                      <span>{typeof point === 'string' ? point : String(point || '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-950">
      {/* Toolbar */}
      <div className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center px-6 space-x-2">
        {/* Layout Button */}
        <div className="relative">
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Change Layout"
          >
            <Layout className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {showLayoutMenu && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[200px]">
              {layouts.map((layout) => {
                const Icon = layout.icon
                return (
                  <button
                    key={layout.id}
                    onClick={() => handleLayoutChange(layout.id)}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{layout.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />

        {/* Color Picker */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Background Color"
          >
            <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-3">
              <div className="grid grid-cols-3 gap-2">
                {backgroundColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleBackgroundColorChange(color.value)}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="text-sm text-gray-500 dark:text-gray-400">
          {slide.type.charAt(0).toUpperCase() + slide.type.slice(1)} Slide
        </div>
      </div>

      {/* Slide Canvas (16:9 Aspect Ratio) */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div 
          className="relative bg-white shadow-2xl"
          style={{ 
            width: '100%', 
            maxWidth: '1200px',
            aspectRatio: '16/9',
          }}
        >
          {renderSlideContent()}
        </div>
      </div>
    </div>
  )
}
