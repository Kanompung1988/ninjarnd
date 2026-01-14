'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Check, Crown, Zap, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number
  features: string[]
  limits: Record<string, any>
}

export default function UpgradePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlan, setCurrentPlan] = useState<string>('Plus')
  const [billingType, setBillingType] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      loadPlans()
    }
  }, [status])

  const loadPlans = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/user/subscription'),
      ])

      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(data.plans || [])
      }

      if (subRes.ok) {
        const data = await subRes.json()
        if (data.subscription) {
          setCurrentPlan(data.subscription.plan_name)
        }
      }
    } catch (error) {
      console.error('Failed to load plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const planIcons = {
    Go: Zap,
    Plus: Sparkles,
    Pro: Crown,
  }

  const planColors = {
    Go: 'from-blue-500 to-cyan-500',
    Plus: 'from-purple-500 to-pink-500',
    Pro: 'from-amber-500 to-orange-500',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading plans...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>

          <h1 className="text-5xl font-bold text-white mb-4">Upgrade your plan</h1>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setBillingType('monthly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                billingType === 'monthly'
                  ? 'bg-white text-slate-900'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setBillingType('yearly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                billingType === 'yearly'
                  ? 'bg-white text-slate-900'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Business
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = planIcons[plan.name as keyof typeof planIcons] || Sparkles
            const gradient = planColors[plan.name as keyof typeof planColors] || planColors.Plus
            const isCurrentPlan = plan.name === currentPlan
            const price = billingType === 'monthly' ? plan.price_monthly : plan.price_yearly

            return (
              <div
                key={plan.id}
                className={`bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 transition-all ${
                  isCurrentPlan
                    ? 'border-purple-500 shadow-xl shadow-purple-500/20'
                    : 'border-white/20 hover:border-white/40'
                } ${plan.name === 'Plus' ? 'md:scale-105' : ''}`}
              >
                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-400 text-xl">$</span>
                    {plan.name === 'Plus' && price === 0 ? (
                      <span className="text-5xl font-bold text-white">0</span>
                    ) : (
                      <>
                        {price > 0 && price < plan.price_monthly && (
                          <span className="text-3xl font-bold text-gray-500 line-through">
                            {plan.price_monthly}
                          </span>
                        )}
                        <span className="text-5xl font-bold text-white">
                          {price === 0 ? '0' : Math.floor(price)}
                        </span>
                      </>
                    )}
                    <span className="text-gray-400">
                      USD / {billingType === 'monthly' ? 'month' : 'month'}
                    </span>
                  </div>
                  {plan.name === 'Plus' && price === 0 && (
                    <p className="text-sm text-green-400 mt-2">
                      USD / month until Nov 8, 2025
                    </p>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-300 mb-6">{plan.description}</p>

                {/* CTA Button */}
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 px-6 rounded-lg bg-white/20 text-gray-400 font-semibold mb-6 cursor-not-allowed"
                  >
                    Your current plan
                  </button>
                ) : plan.name === 'Go' ? (
                  <button
                    onClick={() => alert('Plan switching coming soon!')}
                    className="w-full py-3 px-6 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold mb-6 transition-all border border-white/20"
                  >
                    Switch to {plan.name}
                  </button>
                ) : (
                  <button
                    onClick={() => alert('Plan upgrade coming soon!')}
                    className={`w-full py-3 px-6 rounded-lg font-semibold mb-6 transition-all ${
                      plan.name === 'Pro'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                        : 'bg-white hover:bg-gray-100 text-slate-900'
                    }`}
                  >
                    Get {plan.name}
                  </button>
                )}

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limits Info */}
                {plan.name === 'Go' && (
                  <p className="text-xs text-gray-500 mt-6">
                    Only available in certain regions. Limits apply
                  </p>
                )}
                
                {plan.name !== 'Go' && billingType === 'monthly' && (
                  <p className="text-xs text-gray-500 mt-6">
                    Limits apply | I need help with a billing issue
                  </p>
                )}

                {plan.name === 'Pro' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Unlimited subject to abuse guardrails. Learn more | I need help with a billing issue
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 text-gray-400 text-sm">
          <p>Need a custom plan for your organization?</p>
          <button className="text-purple-400 hover:text-purple-300 underline mt-2">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  )
}
