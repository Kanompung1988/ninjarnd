// Type definitions for NINJA Research System
export interface User {
  id: string
  email: string
  name: string
  image?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    research_id?: string
    has_slides?: boolean
    mode?: string  // 'normal_chat', 'deep_research', 'realtime_research', 'agent_mode'
    model?: string
    sources?: any[]
    citations?: any[]
    research_data?: {
      query?: string
      summary?: string
      key_findings?: string[]
      quick_summary?: string
      key_points?: string[]
      sources?: any[]
      total_sources?: number
      confidence?: string
      timestamp?: string
    }
  }
}

export interface ChatSession {
  chat_id: string
  title: string
  timestamp: string
  messages: ChatMessage[]
  research_context?: ResearchContext
}

export interface ResearchContext {
  query: string
  results: any
  timestamp: string
  model: string
  search_engine?: string
}

export interface ResearchParams {
  topic: string
  days_back: number
  effort: 'quick' | 'standard' | 'comprehensive' | 'exhaustive'
  scope: 'focused' | 'balanced' | 'comprehensive' | 'all-inclusive'
  model: 'typhoon-v2.1-12b-instruct'
    | 'typhoon-v2.5-30b-a3b-instruct' 
    | 'gpt-4o' 
    | 'gpt-5'
    | 'o3'
    | 'models/gemini-flash-latest'
    | 'gemini-2.5-flash'
    | 'gemini-2.5-pro'
  search_engine?: 'tavily' | 'serpapi' | 'hybrid'
  use_hybrid_search?: boolean
}

export interface ResearchResult {
  executive_brief: {
    date_generated: string
    core_question: string
    direct_answer: string
    supporting_details: string
    confidence_assessment: string
  }
  sources: Array<{
    id: string
    title: string
    url: string
    date: string
    relevance_score: number
  }>
  metadata: {
    search_engine: string
    total_sources: number
    processing_time: number
  }
}

export interface PresentationSettings {
  enable_ai_images: boolean
  image_style: string
  max_images: number
  theme: string
}

export interface SlideGenerationRequest {
  chat_id: string
  json_path: string
  output_format: 'pptx' | 'html' | 'both'
  settings?: PresentationSettings
}

export interface SlideGenerationResult {
  success: boolean
  message: string
  pptx_file?: string
  html_file?: string
  preview?: string
}

export type Theme = 'light' | 'dark'

export interface AppSettings {
  theme: Theme
  enable_hybrid_search: boolean
  enable_ai_images: boolean
  debug_mode: boolean
  deep_research_enabled: boolean  // Toggle for full DeepResearch mode (with blog generation)
  realtime_research_enabled: boolean   // Toggle for Realtime DeepResearch (quick, no blog)
  agent_mode_enabled: boolean     // Toggle for Agent mode (autonomous actions)
  selected_model: string  // Current LLM model
  selected_search_engine: string  // Current search engine
}
