import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  title: 'NINJA Research System - AI-Powered Intelligence Platform',
  description: 'Advanced dual-mode AI system for deep research and presentation generation powered by Typhoon AI',
  keywords: 'AI, Research, Typhoon, OpenAI, Gemini, Presentation, Deep Research',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
