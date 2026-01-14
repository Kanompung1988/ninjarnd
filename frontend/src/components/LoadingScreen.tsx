'use client'

import { Sparkles, Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export default function LoadingScreen({ 
  message = 'กำลังโหลด...', 
  fullScreen = false 
}: LoadingScreenProps) {
  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm'
    : 'flex items-center justify-center p-8'

  return (
    <div className={containerClass}>
      <div className="text-center space-y-6 animate-fade-in">
        {/* Animated Logo */}
        <div className="relative inline-block">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping" />
          
          {/* Main circle */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 
                        flex items-center justify-center shadow-2xl shadow-purple-500/50
                        animate-bounce-in">
            <Sparkles className="w-10 h-10 text-white animate-rotate" />
          </div>

          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-rotate">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full" />
          </div>
          <div className="absolute inset-0 animate-rotate" style={{ animationDelay: '0.3s' }}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full" />
          </div>
          <div className="absolute inset-0 animate-rotate" style={{ animationDelay: '0.6s' }}>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full" />
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <div className="loading-dots flex justify-center space-x-1">
            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full" />
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
            <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full" />
          </div>
          <p className="text-lg font-semibold text-white animate-pulse">
            {message}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 
                        progress-animated animate-shimmer" />
        </div>
      </div>
    </div>
  )
}

// Mini loading spinner for inline use
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className="inline-flex items-center justify-center">
      <Loader2 className={`${sizeClasses[size]} text-purple-500 animate-spin`} />
    </div>
  )
}

// Skeleton loader
export function SkeletonLoader({ 
  lines = 3,
  className = ''
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className="h-4 bg-gray-800/50 rounded animate-pulse"
          style={{ 
            width: `${Math.random() * 30 + 70}%`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  )
}
