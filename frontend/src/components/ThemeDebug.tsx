'use client'

import { useTheme, ThemeType } from '@/contexts/ThemeContext'
import { useEffect, useState } from 'react'

/**
 * Theme Debug Component
 * Shows current theme state and allows testing theme switching
 * Only visible in development mode
 */
export default function ThemeDebug() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null
  }

  const themes: ThemeType[] = ['dark', 'light', 'purple', 'ocean', 'sunset', 'forest']

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg shadow-lg"
      >
        🎨 Theme: {theme}
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4">
          <h3 className="text-white font-semibold mb-3 text-sm">Theme Debugger</h3>
          
          <div className="space-y-2">
            <div className="text-xs text-gray-400">
              Current: <span className="text-white font-mono">{theme}</span>
            </div>
            
            <div className="text-xs text-gray-400 mb-2">Quick Switch:</div>
            
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`
                    px-3 py-2 text-xs rounded transition-all
                    ${theme === t 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }
                  `}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-400">CSS Variables:</div>
              <div className="text-xs font-mono text-gray-500 space-y-1 mt-1">
                <div>--theme-primary: <span className="text-purple-400">{getComputedStyle(document.documentElement).getPropertyValue('--theme-primary')}</span></div>
                <div>--theme-bg: <span className="text-purple-400">{getComputedStyle(document.documentElement).getPropertyValue('--theme-bg')}</span></div>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('ninja-theme')
                window.location.reload()
              }}
              className="w-full mt-3 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              Reset Theme (Reload)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
