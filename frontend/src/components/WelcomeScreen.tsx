'use client'

import { Sparkles, Brain, Zap, Shield } from 'lucide-react'
import Image from 'next/image'

export default function WelcomeScreen() {
  const features = [
    {
      icon: Brain,
      title: 'Deep Research with Multiple AI Models',
      description: 'ค้นคว้าเชิงลึกด้วย AI หลายโมเดล'
    },
    {
      icon: Zap,
      title: 'Instant Presentation Generation',
      description: 'สร้างงานนำเสนออัตโนมัติทันที'
    },
    {
      icon: Shield,
      title: 'Secure Google Authentication',
      description: 'ปลอดภัยด้วย Google Auth'
    }
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto custom-scrollbar bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      {/* Animated Purple Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl animate-breathing" />
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl w-full space-y-12 animate-fade-in relative z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 animate-slide-up-fade">
          <div className="inline-block">
            <div className="relative">
              {/* Logo with Purple Glow */}
              <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 
                            flex items-center justify-center shadow-2xl shadow-purple-600/50
                            animate-float relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 animate-shimmer" />
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden">
                  <Image
                    src="/ninja_rnd.png"
                    alt="NINJA Research Logo"
                    width={80}
                    height={80}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              {/* Floating particles with purple theme */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full animate-ping" />
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
              <div className="absolute top-0 left-0 w-full h-full border-2 border-purple-500/30 rounded-3xl animate-breathing" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400 bg-clip-text text-transparent animate-neon-glow">
              NINJA Research
            </h1>
            <p className="text-xl text-purple-300/80 max-w-2xl mx-auto animate-blur-in font-light">
              AI-Powered Intelligence Platform
            </p>
          </div>

        </div>

        {/* Features Grid with Purple Theme */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group relative bg-gray-900/50 backdrop-blur-xl p-6 rounded-2xl 
                          border border-purple-500/20 hover:border-purple-500/50
                          transition-all duration-500 cursor-pointer
                          hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30
                          animate-slide-up-fade"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Purple Glow Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/0 
                              group-hover:from-purple-600/10 group-hover:to-blue-600/10 
                              rounded-2xl transition-all duration-500" />
                
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800
                                flex items-center justify-center mb-4
                                group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
                                shadow-lg shadow-purple-600/50 group-hover:shadow-purple-500/80">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-purple-200/60 group-hover:text-purple-200/80 transition-colors">
                    {feature.description}
                  </p>
                </div>

                {/* Animated border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/0 
                              group-hover:border-purple-500/50 transition-all duration-500
                              group-hover:animate-pulse" />
              </div>
            )
          })}
        </div>

        {/* Call to Action with Purple Animations */}
        <div className="text-center space-y-6 mt-16 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full 
                        bg-purple-600/20 border border-purple-500/30 backdrop-blur-xl
                        animate-breathing">
            <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span className="text-purple-200 text-sm font-medium">Start your research journey</span>
          </div>
          
          <p className="text-purple-300/60 text-sm max-w-md mx-auto animate-blur-in">
            Begin by typing your question below or select a chat from the sidebar
          </p>
        </div>
      </div>
    </div>
  )
}
