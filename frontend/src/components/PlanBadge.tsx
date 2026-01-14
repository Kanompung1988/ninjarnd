'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Crown, Zap, Sparkles, TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Subscription {
  plan_name: string
  display_name: string
  status: string
  limits: Record<string, any>
}

interface UsageLimits {
  message: {
    allowed: boolean
    limit?: number
    used?: number
    remaining?: number
    unlimited?: boolean
  }
}

export default function PlanBadge({ compact = false }: { compact?: boolean }) {
  const { data: session } = useSession()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageLimits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      loadSubscriptionData()
    }
  }, [session])

  const loadSubscriptionData = async () => {
    try {
      const [subRes, usageRes] = await Promise.all([
        fetch('/api/user/subscription'),
        fetch('/api/user/usage'),
      ])

      if (subRes.ok) {
        const data = await subRes.json()
        setSubscription(data.subscription)
      }

      if (usageRes.ok) {
        const data = await usageRes.json()
        setUsage(data.limits)
      }
    } catch (error) {
      console.error('Failed to load subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !subscription) {
    return null
  }

  const planColors = {
    Go: 'from-blue-500 to-cyan-500',
    Plus: 'from-purple-500 to-pink-500',
    Pro: 'from-amber-500 to-orange-500',
  }

  const planIcons = {
    Go: Zap,
    Plus: Sparkles,
    Pro: Crown,
  }

  const PlanIcon = planIcons[subscription.plan_name as keyof typeof planIcons] || Sparkles
  const gradient = planColors[subscription.plan_name as keyof typeof planColors] || planColors.Plus

  if (compact) {
    return (
      <Link href="/upgrade" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all border border-white/20">
        <PlanIcon className="w-5 h-5 text-white" />
        <span className="text-white font-semibold">{subscription.plan_name}</span>
        {subscription.plan_name !== 'Pro' && (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </Link>
    )
  }

  const messageLimit = usage?.message
  const isUnlimited = messageLimit?.unlimited || subscription.limits?.unlimited
  const usagePercentage = isUnlimited
    ? 0
    : messageLimit && messageLimit.limit
    ? ((messageLimit.used || 0) / messageLimit.limit) * 100
    : 0

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <PlanIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{subscription.display_name}</h3>
            <p className="text-sm text-gray-400">
              {subscription.status === 'active' ? 'Active' : subscription.status}
            </p>
          </div>
        </div>

        {subscription.plan_name !== 'Pro' && (
          <Link
            href="/upgrade"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all"
          >
            <TrendingUp className="w-5 h-5" />
            Upgrade
          </Link>
        )}
      </div>

      {/* Usage Stats */}
      {!isUnlimited && messageLimit && messageLimit.limit && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Messages this month</span>
            <span className="text-white font-semibold">
              {messageLimit.used || 0} / {messageLimit.limit}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${gradient} transition-all`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          {usagePercentage > 80 && (
            <p className="text-sm text-amber-400 mt-2">
              You're running low on messages. Consider upgrading!
            </p>
          )}
        </div>
      )}

      {isUnlimited && (
        <div className="flex items-center gap-2 text-amber-400">
          <Crown className="w-5 h-5" />
          <span className="font-semibold">Unlimited access to all features</span>
        </div>
      )}
    </div>
  )
}
