'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ThemeType = 'dark' | 'light' | 'purple' | 'ocean' | 'sunset' | 'forest'

interface ThemeContextType {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('dark')
  const [mounted, setMounted] = useState(false)

  // Initialize theme on mount (client-side only)
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('ninja-theme') as ThemeType
    if (savedTheme && ['dark', 'light', 'purple', 'ocean', 'sunset', 'forest'].includes(savedTheme)) {
      setThemeState(savedTheme)
      applyTheme(savedTheme)
    } else {
      // Apply default dark theme
      applyTheme('dark')
    }
  }, [])

  const setTheme = (newTheme: ThemeType) => {
    if (!['dark', 'light', 'purple', 'ocean', 'sunset', 'forest'].includes(newTheme)) {
      console.error('Invalid theme:', newTheme)
      return
    }
    setThemeState(newTheme)
    localStorage.setItem('ninja-theme', newTheme)
    applyTheme(newTheme)
  }

  const applyTheme = (themeToApply: ThemeType) => {
    if (typeof window === 'undefined') return
    
    const root = document.documentElement
    
    // Remove all theme classes
    root.classList.remove('dark', 'light', 'purple', 'ocean', 'sunset', 'forest')
    
    // Add new theme class
    root.classList.add(themeToApply)
    
    // Apply theme-specific CSS variables
    switch (themeToApply) {
      case 'dark':
        root.style.setProperty('--theme-primary', '#8b5cf6')
        root.style.setProperty('--theme-secondary', '#3b82f6')
        root.style.setProperty('--theme-accent', '#06b6d4')
        root.style.setProperty('--theme-bg', '#0f0f1e')
        root.style.setProperty('--theme-bg-secondary', '#1a1a2e')
        root.style.setProperty('--theme-bg-tertiary', '#1f2937')
        root.style.setProperty('--theme-text', '#f3f4f6')
        root.style.setProperty('--theme-text-secondary', '#d1d5db')
        root.style.setProperty('--theme-border', '#374151')
        break
      case 'light':
        root.style.setProperty('--theme-primary', '#6366f1')
        root.style.setProperty('--theme-secondary', '#3b82f6')
        root.style.setProperty('--theme-accent', '#8b5cf6')
        root.style.setProperty('--theme-bg', '#ffffff')
        root.style.setProperty('--theme-bg-secondary', '#f9fafb')
        root.style.setProperty('--theme-bg-tertiary', '#f3f4f6')
        root.style.setProperty('--theme-text', '#111827')
        root.style.setProperty('--theme-text-secondary', '#6b7280')
        root.style.setProperty('--theme-border', '#e5e7eb')
        break
      case 'purple':
        root.style.setProperty('--theme-primary', '#a855f7')
        root.style.setProperty('--theme-secondary', '#c084fc')
        root.style.setProperty('--theme-accent', '#e879f9')
        root.style.setProperty('--theme-bg', '#1e0a2e')
        root.style.setProperty('--theme-bg-secondary', '#2d1042')
        root.style.setProperty('--theme-bg-tertiary', '#3b1458')
        root.style.setProperty('--theme-text', '#f3e8ff')
        root.style.setProperty('--theme-text-secondary', '#e9d5ff')
        root.style.setProperty('--theme-border', '#7e22ce')
        break
      case 'ocean':
        root.style.setProperty('--theme-primary', '#06b6d4')
        root.style.setProperty('--theme-secondary', '#0ea5e9')
        root.style.setProperty('--theme-accent', '#22d3ee')
        root.style.setProperty('--theme-bg', '#0a1929')
        root.style.setProperty('--theme-bg-secondary', '#0d2438')
        root.style.setProperty('--theme-bg-tertiary', '#1e3a5f')
        root.style.setProperty('--theme-text', '#e0f2fe')
        root.style.setProperty('--theme-text-secondary', '#bae6fd')
        root.style.setProperty('--theme-border', '#0e7490')
        break
      case 'sunset':
        root.style.setProperty('--theme-primary', '#f97316')
        root.style.setProperty('--theme-secondary', '#ec4899')
        root.style.setProperty('--theme-accent', '#f59e0b')
        root.style.setProperty('--theme-bg', '#1e0e0a')
        root.style.setProperty('--theme-bg-secondary', '#2d1410')
        root.style.setProperty('--theme-bg-tertiary', '#451a03')
        root.style.setProperty('--theme-text', '#fef3c7')
        root.style.setProperty('--theme-text-secondary', '#fde68a')
        root.style.setProperty('--theme-border', '#c2410c')
        break
      case 'forest':
        root.style.setProperty('--theme-primary', '#10b981')
        root.style.setProperty('--theme-secondary', '#14b8a6')
        root.style.setProperty('--theme-accent', '#22c55e')
        root.style.setProperty('--theme-bg', '#0a1f0f')
        root.style.setProperty('--theme-bg-secondary', '#0f2e16')
        root.style.setProperty('--theme-bg-tertiary', '#14532d')
        root.style.setProperty('--theme-text', '#d1fae5')
        root.style.setProperty('--theme-text-secondary', '#a7f3d0')
        root.style.setProperty('--theme-border', '#047857')
        break
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
