'use client'

import '../styles/slides.css'

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

interface SlideRendererProps {
  slide: Slide
  isExportMode?: boolean
  className?: string
}

export default function SlideRenderer({ slide, isExportMode = false, className = '' }: SlideRendererProps) {
  const {
    type,
    title,
    content,
    stats,
    leftSide,
    rightSide,
    steps,
    layout = {}
  } = slide

  const {
    backgroundColor = '#ffffff',
    backgroundGradient,
    textColor = '#1f2937',
    fontSize = 'optimized',
    alignment = 'left'
  } = layout

  const containerStyle: React.CSSProperties = {
    background: backgroundGradient || backgroundColor,
    color: textColor,
  }

  const containerClasses = `
    slide-container
    slide-type-${type}
    font-size-${fontSize}
    ${isExportMode ? 'slide-export-mode' : ''}
    ${className}
  `

  // Title Slide
  if (type === 'title') {
    return (
      <div className={containerClasses} style={containerStyle}>
        <div className="slide-type-title">
          <h1 className="title">{title}</h1>
          <p className="subtitle">{typeof content === 'string' ? content : JSON.stringify(content)}</p>
        </div>
      </div>
    )
  }

  // Content Slide
  if (type === 'content') {
    const contentString = typeof content === 'string' ? content : JSON.stringify(content)
    const contentLines = contentString.split('\n').filter(line => line.trim())

    return (
      <div className={containerClasses} style={containerStyle}>
        <div className="slide-type-content">
          <h2 className="title">{title}</h2>
          <div className="content">
            {contentLines.length > 1 ? (
              <ul>
                {contentLines.map((line, i) => (
                  <li key={i}>{line.replace(/^[•\-*]\s*/, '')}</li>
                ))}
              </ul>
            ) : (
              <p>{contentString}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Two Column Slide
  if (type === 'two-column' && leftSide && rightSide) {
    return (
      <div className={containerClasses} style={containerStyle}>
        <div className="slide-type-two-column">
          <div className="column" style={{ backgroundColor: leftSide.color || 'rgba(99, 102, 241, 0.1)' }}>
            <h3 className="column-title">{leftSide.title}</h3>
            <div className="column-content">
              <ul>
                {leftSide.points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="column" style={{ backgroundColor: rightSide.color || 'rgba(16, 185, 129, 0.1)' }}>
            <h3 className="column-title">{rightSide.title}</h3>
            <div className="column-content">
              <ul>
                {rightSide.points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Comparison Slide
  if (type === 'comparison' && leftSide && rightSide) {
    return (
      <div className={containerClasses} style={containerStyle}>
        <div className="slide-type-comparison">
          <div className="side" style={{ backgroundColor: leftSide.color || '#ef4444' }}>
            <h3 className="side-title">{leftSide.title}</h3>
            <div className="side-content">
              <ul>
                {leftSide.points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="side" style={{ backgroundColor: rightSide.color || '#10b981' }}>
            <h3 className="side-title">{rightSide.title}</h3>
            <div className="side-content">
              <ul>
                {rightSide.points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Stats Grid
  if (type === 'stats-grid' && stats) {
    return (
      <div className={containerClasses} style={containerStyle}>
        <div className="slide-type-stats-grid">
          <h2 className="title">{title}</h2>
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card" style={{ backgroundColor: stat.color || 'rgba(99, 102, 241, 0.2)' }}>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Timeline
  if (type === 'timeline' && steps) {
    return (
      <div className={containerClasses} style={containerStyle}>
        <div className="slide-type-timeline">
          <h2 className="title">{title}</h2>
          <div className="timeline-items">
            {steps.map((step, i) => (
              <div key={i} className="timeline-item">
                <div 
                  className="timeline-number"
                  style={{ backgroundColor: '#6366f1', color: 'white' }}
                >
                  {step.number}
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">{step.title}</div>
                  <div className="timeline-description">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Quote
  if (type === 'quote') {
    return (
      <div className={containerClasses} style={containerStyle}>
        <div className="slide-type-quote">
          <div className="quote-mark">"</div>
          <p className="quote-text">{typeof content === 'string' ? content : JSON.stringify(content)}</p>
          <p className="quote-author">— {title}</p>
        </div>
      </div>
    )
  }

  // Default fallback
  return (
    <div className={containerClasses} style={containerStyle}>
      <div className="slide-type-content">
        <h2 className="title">{title}</h2>
        <div className="content">
          <p>{typeof content === 'string' ? content : JSON.stringify(content)}</p>
        </div>
      </div>
    </div>
  )
}
