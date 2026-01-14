'use client'

import { signIn } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import { Chrome, Sparkles, Zap, Shield, Brain } from 'lucide-react'

export default function SignIn() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 relative overflow-hidden">
      {/* Animated Purple Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl animate-breathing"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8">
        {/* Logo and Title with Purple Theme */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block relative mb-6">
            {/* Logo Container with Enhanced Glow */}
            <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 
                          flex items-center justify-center 
                          shadow-[0_0_40px_rgba(168,85,247,0.6),0_0_80px_rgba(168,85,247,0.4)]
                          hover:shadow-[0_0_60px_rgba(168,85,247,0.8),0_0_120px_rgba(168,85,247,0.6)]
                          relative overflow-hidden
                          transition-all duration-700 ease-in-out
                          animate-float-smooth">
              {/* Enhanced Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-purple-400/30 to-blue-400/30 animate-shimmer-slow"></div>
              
              {/* Rotating Border Glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 
                           opacity-0 group-hover:opacity-100 blur-xl animate-spin-slow"></div>
              
              {/* Logo Image */}
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden z-10 
                           transition-transform duration-700 ease-out
                           hover:scale-110 hover:rotate-6">
                <Image
                  src="/ninja_rnd.png"
                  alt="NINJA Research Logo"
                  width={80}
                  height={80}
                  className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  priority
                />
              </div>
            </div>
            
            {/* Enhanced Floating Particles */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full animate-ping 
                         shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-purple-500 rounded-full animate-pulse 
                         shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
            <div className="absolute top-0 left-0 w-full h-full border-2 border-purple-400/40 rounded-3xl 
                         animate-breathing shadow-[0_0_20px_rgba(168,85,247,0.4)]"></div>
            
            {/* Additional orbiting particles */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full animate-orbit 
                         shadow-[0_0_6px_rgba(255,255,255,0.9)]"></div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-3 relative">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent 
                           drop-shadow-[0_0_30px_rgba(255,255,255,0.9)] 
                           drop-shadow-[0_0_60px_rgba(168,85,247,0.6)]
                           drop-shadow-[0_0_90px_rgba(168,85,247,0.4)]
                           animate-glow-pulse">
              NINJA Research
            </span>
          </h1>
          <p className="text-purple-200/90 text-lg font-light animate-blur-in drop-shadow-[0_0_10px_rgba(216,180,254,0.5)]">
            AI-Powered Intelligence Platform
          </p>
        </div>

        {/* Features with Purple Theme */}
        <div className="space-y-3 mb-8">
          {[
            { icon: Sparkles, text: 'Deep Research with Multiple AI Models' },
            { icon: Zap, text: 'Instant Presentation Generation' },
            { icon: Shield, text: 'Secure Google Authentication' },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-3 bg-gray-900/50 backdrop-blur-xl border border-purple-500/20 
                       rounded-xl p-4 transition-all duration-300 hover:border-purple-500/50 hover:scale-105
                       hover:shadow-lg hover:shadow-purple-500/20 animate-slide-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 
                           flex items-center justify-center shadow-lg shadow-purple-600/50">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-purple-100 text-sm font-medium">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Sign In Card with Purple Theme */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 
                      shadow-2xl shadow-purple-500/20 animate-fade-in"
             style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-bold text-white text-center mb-6 animate-blur-in">
            Welcome Back
          </h2>
          
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 
                     rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 
                     shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105
                     border-2 border-transparent hover:border-purple-200"
          >
            <Chrome className="w-6 h-6" />
            <span>Continue with Google</span>
          </button>

          <p className="text-purple-300/60 text-xs text-center mt-6 animate-blur-in">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Footer with Purple Theme */}
        <div className="text-center mt-8 animate-breathing">
          <p className="text-purple-400/60 text-sm">
            Powered by Typhoon AI, OpenAI & Gemini
          </p>
        </div>
      </div>
    </div>
  )
}
