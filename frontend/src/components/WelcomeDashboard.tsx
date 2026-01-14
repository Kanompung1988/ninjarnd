'use client'

import { Calendar, Mail, ListTodo, Search } from 'lucide-react'

interface DelegateCard {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  onClick: () => void
}

export default function WelcomeDashboard({ onTaskSelect }: { onTaskSelect?: (task: string) => void }) {
  const delegateTasks: DelegateCard[] = [
    {
      icon: Calendar,
      title: 'Schedule a team meeting',
      description: 'for next week and send invites',
      color: 'bg-purple-500/20 border-purple-500/30',
      onClick: () => onTaskSelect?.('Schedule a team meeting for next week and send invites')
    },
    {
      icon: Mail,
      title: 'Draft an email',
      description: 'to project stakeholders with status update',
      color: 'bg-blue-500/20 border-blue-500/30',
      onClick: () => onTaskSelect?.('Draft an email to project stakeholders with status update')
    },
    {
      icon: ListTodo,
      title: 'Create a to-do list',
      description: 'from the last meeting notes',
      color: 'bg-cyan-500/20 border-cyan-500/30',
      onClick: () => onTaskSelect?.('Create a to-do list from the last meeting notes')
    },
    {
      icon: Search,
      title: 'Research industry trends',
      description: 'and provide comprehensive analysis',
      color: 'bg-green-500/20 border-green-500/30',
      onClick: () => onTaskSelect?.('Research industry trends and provide comprehensive analysis')
    }
  ]

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-5xl w-full">
        {/* Main Title - Cleaner and more elegant */}
        <div className="text-center mb-16 space-y-3">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent leading-tight">
            What do you want to delegate today?
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            Select a task below or type your own request to get started
          </p>
        </div>

        {/* Delegate Cards Grid - Improved spacing and styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {delegateTasks.map((task, index) => {
            const Icon = task.icon
            return (
              <button
                key={index}
                onClick={task.onClick}
                className={`${task.color} border rounded-3xl p-7 text-left transition-all duration-200 hover:scale-[1.02] hover:border-opacity-60 group backdrop-blur-sm`}
              >
                <div className="flex items-start space-x-5">
                  <div className="p-3.5 rounded-2xl bg-white/10 group-hover:bg-white/15 transition-all duration-200 flex-shrink-0">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-white font-semibold text-xl mb-2 leading-tight">
                      {task.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
