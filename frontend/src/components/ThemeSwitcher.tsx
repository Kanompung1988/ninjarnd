'use client'

import { useState } from 'react'
import { useTheme, ThemeType } from '@/contexts/ThemeContext'
import { Palette, Check, Sparkles } from 'lucide-react'

const themes = [
  {
    id: 'dark' as ThemeType,
    name: 'Dark Ninja',
    icon: '🥷',
    colors: ['from-purple-600', 'via-blue-600', 'to-cyan-600'],
    description: 'Classic dark theme'
  },
  {
    id: 'light' as ThemeType,
    name: 'Light Mode',
    icon: '☀️',
    colors: ['from-blue-400', 'via-indigo-400', 'to-purple-400'],
    description: 'Clean light theme'
  },
  {
    id: 'purple' as ThemeType,
    name: 'Purple Dream',
    icon: '💜',
    colors: ['from-purple-600', 'via-fuchsia-600', 'to-pink-600'],
    description: 'Vibrant purple'
  },
  {
    id: 'ocean' as ThemeType,
    name: 'Ocean Blue',
    icon: '🌊',
    colors: ['from-cyan-500', 'via-blue-500', 'to-indigo-600'],
    description: 'Deep ocean vibes'
  },
  {
    id: 'sunset' as ThemeType,
    name: 'Sunset Glow',
    icon: '🌅',
    colors: ['from-orange-500', 'via-pink-500', 'to-rose-600'],
    description: 'Warm sunset'
  },
  {
    id: 'forest' as ThemeType,
    name: 'Forest Green',
    icon: '🌲',
    colors: ['from-emerald-500', 'via-teal-500', 'to-green-600'],
    description: 'Natural green'
  }
]

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Theme Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 
                   border border-gray-700 hover:border-gray-600
                   transition-all duration-300 group
                   hover:scale-105 hover:shadow-lg"
        title="Change Theme"
      >
        <Palette className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
        
        {/* Active indicator */}
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
        
        {/* Sparkle effect */}
        <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
      </button>

      {/* Theme Selector Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel - Opens to the Right */}
          <div className="absolute left-full ml-3 top-0 z-50 w-80 
                          bg-gray-900/95 backdrop-blur-xl 
                          border border-gray-800 rounded-2xl 
                          shadow-2xl shadow-purple-500/20
                          animate-slide-in-right">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Choose Your Theme</h3>
                  <p className="text-xs text-gray-400">Customize your experience</p>
                </div>
              </div>
            </div>

            {/* Theme Grid */}
            <div className="p-4 grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {themes.map((themeOption) => {
                const isActive = theme === themeOption.id
                
                return (
                  <button
                    key={themeOption.id}
                    onClick={() => {
                      setTheme(themeOption.id)
                      setTimeout(() => setIsOpen(false), 500)
                    }}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all duration-300
                      hover:scale-105 hover:shadow-lg group
                      ${isActive 
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20' 
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }
                    `}
                  >
                    {/* Theme Preview */}
                    <div className={`
                      h-16 rounded-lg mb-3 bg-gradient-to-br ${themeOption.colors.join(' ')}
                      shadow-lg transform transition-transform group-hover:scale-105
                    `}>
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {themeOption.icon}
                      </div>
                    </div>

                    {/* Theme Info */}
                    <div className="text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm text-white">
                          {themeOption.name}
                        </h4>
                        {isActive && (
                          <div className="p-1 rounded-full bg-purple-500">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {themeOption.description}
                      </p>
                    </div>

                    {/* Active Glow */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-purple-500/5 animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-800 text-center">
              <p className="text-xs text-gray-500">
                Theme preference is saved automatically
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
