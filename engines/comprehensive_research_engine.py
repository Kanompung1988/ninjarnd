"""
Comprehensive DeepResearch Engine
==================================
Universal research pipeline for all LLM models (Typhoon, GPT, Gemini)

Supported Models:
- Typhoon: typhoon-v2.1-12b-instruct, typhoon-v2.5-30b-a3b-instruct
- ChatGPT: gpt-4o, gpt-5, o3
- Gemini: models/gemini-flash-latest, gemini-2.5-flash, gemini-2.5-pro

Pipeline Stages:
1. Query Expansion - Expand user query into multiple search angles
2. Multi-Search - Tavily + SerperAPI + JINA_API hybrid search
3. Noise Filtering - Remove irrelevant content
4. Credibility Scoring - Score source reliability
5. Synthesis - Generate comprehensive answer
6. Fact Validation - Validate claims against sources
7. Sensitive Data Redaction - Remove sensitive information
8. Report Generation - Create Markdown report
9. PowerPoint Export - Generate branded presentation

Usage Examples:

    from comprehensive_research_engine import ComprehensiveResearch
    
    # Example 1: Using Typhoon 2.1 12B
    engine = ComprehensiveResearch(
        model="typhoon-v2.1-12b-instruct",
        tavily_api_key=os.getenv("TAVILY_API_KEY"),
        serper_api_key=os.getenv("SERPER_API_KEY"),
        jina_api_key=os.getenv("JINA_API_KEY"),
        typhoon_api_key=os.getenv("TYPHOON_API_KEY")
    )
    
    # Example 2: Using ChatGPT (GPT-4o)
    engine = ComprehensiveResearch(
        model="gpt-4o",
        tavily_api_key=os.getenv("TAVILY_API_KEY"),
        serper_api_key=os.getenv("SERPER_API_KEY"),
        jina_api_key=os.getenv("JINA_API_KEY"),
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )
    
    # Example 3: Using Gemini Flash
    engine = ComprehensiveResearch(
        model="models/gemini-flash-latest",
        tavily_api_key=os.getenv("TAVILY_API_KEY"),
        serper_api_key=os.getenv("SERPER_API_KEY"),
        jina_api_key=os.getenv("JINA_API_KEY"),
        gemini_api_key=os.getenv("GEMINI_API_KEY")
    )
    
    # Example 4: Using Gemini Pro
    engine = ComprehensiveResearch(
        model="gemini-2.5-pro",
        tavily_api_key=os.getenv("TAVILY_API_KEY"),
        serper_api_key=os.getenv("SERPER_API_KEY"),
        jina_api_key=os.getenv("JINA_API_KEY"),
        gemini_api_key=os.getenv("GEMINI_API_KEY")
    )
    
    # Run research
    result = engine.research(
        query="What are the latest developments in AI?",
        recency_days=7
    )
    
    print(result.markdown_report)
"""

import os
import re
import json
import requests
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, field
import logging

# External libraries
try:
    from tavily import TavilyClient
except ImportError:
    TavilyClient = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from Azure_OpenAi_core import AzureOpenAICore
except ImportError:
    AzureOpenAICore = None

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════
# DATA CLASSES
# ════════════════════════════════════════════════════════════════════

@dataclass
class SearchResult:
    """Individual search result"""
    title: str
    url: str
    snippet: str
    content: str = ""
    source: str = "unknown"  # tavily, serper, jina
    published_date: Optional[str] = None
    credibility_score: float = 0.5
    relevance_score: float = 0.5


@dataclass
class ResearchReport:
    """Final research report"""
    query: str
    executive_summary: str
    key_findings: List[str]
    detailed_analysis: str
    sources: List[Dict[str, Any]]
    credibility_assessment: Dict[str, Any]
    recommendations: List[str]
    metadata: Dict[str, Any]
    markdown_report: str
    powerpoint_path: Optional[str] = None


# ════════════════════════════════════════════════════════════════════
# CREDIBILITY SCORER
# ════════════════════════════════════════════════════════════════════

class CredibilityScorer:
    """Score source credibility based on domain, freshness, and content quality"""
    
    # High-credibility domains
    TRUSTED_DOMAINS = {
        'gov', 'edu', 'org', 'ac.uk', 'ac.th',
        'arxiv.org', 'nature.com', 'science.org', 'ieee.org',
        'who.int', 'cdc.gov', 'nih.gov',
        'reuters.com', 'apnews.com', 'bbc.com', 'economist.com'
    }
    
    # Low-credibility indicators
    SUSPICIOUS_INDICATORS = [
        'clickbait', 'sponsored', 'advertisement', 'paid content',
        'unverified', 'rumor', 'allegedly', 'claims without evidence'
    ]
    
    @staticmethod
    def score_url(url: str) -> float:
        """Score URL credibility (0.0 - 1.0)"""
        score = 0.5  # Start neutral
        
        # Check domain
        domain = url.split('/')[2] if len(url.split('/')) > 2 else url
        
        # Bonus for trusted domains
        for trusted in CredibilityScorer.TRUSTED_DOMAINS:
            if trusted in domain.lower():
                score += 0.3
                break
        
        # Check for HTTPS
        if url.startswith('https://'):
            score += 0.1
        
        # Penalty for suspicious patterns
        if any(x in url.lower() for x in ['spam', 'scam', 'fake', 'click']):
            score -= 0.3
        
        return max(0.0, min(1.0, score))
    
    @staticmethod
    def score_content(content: str, title: str) -> float:
        """Score content quality (0.0 - 1.0)"""
        score = 0.5
        
        # Length indicator (not too short, not too long)
        if 100 < len(content) < 5000:
            score += 0.1
        
        # Check for citations or references
        if any(x in content.lower() for x in ['according to', 'research shows', 'study found', 'data indicates']):
            score += 0.15
        
        # Check for suspicious indicators
        for indicator in CredibilityScorer.SUSPICIOUS_INDICATORS:
            if indicator in content.lower() or indicator in title.lower():
                score -= 0.2
                break
        
        # Check for balanced language (not too sensational)
        sensational_words = ['shocking', 'unbelievable', 'miracle', 'secret', 'they dont want you to know']
        if any(x in title.lower() for x in sensational_words):
            score -= 0.2
        
        return max(0.0, min(1.0, score))
    
    @staticmethod
    def score_recency(published_date: Optional[str], max_age_days: int = 30) -> float:
        """Score based on recency (0.0 - 1.0)"""
        if not published_date:
            return 0.5  # Neutral if unknown
        
        try:
            pub_date = datetime.fromisoformat(published_date.replace('Z', '+00:00'))
            age_days = (datetime.now(timezone.utc) - pub_date).days
            
            if age_days <= max_age_days:
                return 1.0 - (age_days / max_age_days) * 0.5  # 1.0 to 0.5
            else:
                return max(0.0, 0.5 - ((age_days - max_age_days) / max_age_days) * 0.5)
        except:
            return 0.5
    
    @staticmethod
    def calculate_overall_score(result: SearchResult, recency_days: int = 30) -> float:
        """Calculate overall credibility score"""
        url_score = CredibilityScorer.score_url(result.url)
        content_score = CredibilityScorer.score_content(result.content or result.snippet, result.title)
        recency_score = CredibilityScorer.score_recency(result.published_date, recency_days)
        
        # Weighted average
        overall = (url_score * 0.3 + content_score * 0.4 + recency_score * 0.3)
        return round(overall, 3)


# ════════════════════════════════════════════════════════════════════
# SENSITIVE DATA REDACTOR
# ════════════════════════════════════════════════════════════════════

class SensitiveDataRedactor:
    """Redact sensitive information from reports"""
    
    # Patterns to redact
    PATTERNS = {
        'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        'phone': r'\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',
        'ssn': r'\b\d{3}-\d{2}-\d{4}\b',
        'credit_card': r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
        'api_key': r'\b[A-Za-z0-9]{32,}\b',
        'ip_address': r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'
    }
    
    @staticmethod
    def redact(text: str) -> Tuple[str, List[str]]:
        """Redact sensitive data and return cleaned text + list of redacted types"""
        redacted_types = []
        cleaned_text = text
        
        for data_type, pattern in SensitiveDataRedactor.PATTERNS.items():
            matches = re.findall(pattern, cleaned_text)
            if matches:
                redacted_types.append(data_type)
                cleaned_text = re.sub(pattern, f'[REDACTED_{data_type.upper()}]', cleaned_text)
        
        return cleaned_text, redacted_types


# ════════════════════════════════════════════════════════════════════
# COMPREHENSIVE RESEARCH ENGINE
# ════════════════════════════════════════════════════════════════════

class ComprehensiveResearch:
    """
    Universal DeepResearch engine for all LLM models
    """
    
    def __init__(
        self,
        model: str = "typhoon-v2.5-instruct",
        tavily_api_key: Optional[str] = None,
        serper_api_key: Optional[str] = None,
        jina_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        typhoon_api_key: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
        azure_api_key: Optional[str] = None,
        azure_endpoint: Optional[str] = None
    ):
        self.model = model
        
        # Initialize search clients
        self.tavily_client = TavilyClient(api_key=tavily_api_key) if tavily_api_key and TavilyClient else None
        self.serper_api_key = serper_api_key
        self.jina_api_key = jina_api_key
        
        # Initialize LLM clients
        self.openai_client = None
        self.typhoon_client = None
        self.gemini_model = None
        self.azure_client = None
        
        # Normalize model name for comparison
        model_lower = model.lower()
        
        # Helper function to check if model is Azure OpenAI
        def is_azure_model(model: str) -> bool:
            azure_prefixes = ["gpt-5", "gpt-5-", "o3", "o3-", "gpt-4o", "gpt-4o-", "o1", "o1-"]
            return any(model.startswith(prefix) for prefix in azure_prefixes)
        
        # Initialize Azure OpenAI models (GPT-5, O3, GPT-4o series)
        if is_azure_model(model) and AzureOpenAICore:
            # Use provided credentials or fall back to environment variables
            self.azure_client = AzureOpenAICore(
                api_key=azure_api_key,
                endpoint=azure_endpoint
            )
            logger.info(f"✅ Initialized Azure OpenAI client for model: {model}")
        
        # Initialize ChatGPT/OpenAI models (standard gpt models)
        elif any(x in model_lower for x in ["gpt", "o3"]) and openai_api_key and not is_azure_model(model):
            self.openai_client = OpenAI(api_key=openai_api_key)
            logger.info(f"✅ Initialized OpenAI client for model: {model}")
        
        # Initialize Typhoon models
        if "typhoon" in model_lower and typhoon_api_key:
            self.typhoon_client = OpenAI(
                api_key=typhoon_api_key,
                base_url="https://api.opentyphoon.ai/v1"
            )
            logger.info(f"✅ Initialized Typhoon client for model: {model}")
        
        # Initialize Gemini models (gemini-flash-latest, gemini-2.5-pro)
        if "gemini" in model_lower and gemini_api_key:
            genai.configure(api_key=gemini_api_key)
            
            # Map model names to actual Gemini model identifiers
            gemini_model_map = {
                "gemini-flash-latest": "gemini-2.0-flash-exp",
                "gemini-2.5-flash": "gemini-2.0-flash-exp",
                "gemini-2.5-pro": "gemini-2.0-pro-exp",
                "models/gemini-flash-latest": "gemini-2.0-flash-exp",
            }
            
            # Use mapped model or original model name
            actual_model = gemini_model_map.get(model, model)
            self.gemini_model = genai.GenerativeModel(actual_model)
            logger.info(f"✅ Initialized Gemini client for model: {actual_model}")
        
        logger.info(f"🚀 Initialized ComprehensiveResearch with model: {model}")
    
    # ────────────────────────────────────────────────────────────────
    # STAGE 1: QUERY EXPANSION
    # ────────────────────────────────────────────────────────────────
    
    def expand_query(self, query: str) -> List[str]:
        """Expand user query into multiple search angles"""
        logger.info(f"📝 Stage 1: Expanding query: {query}")
        
        # Detect context and adjust prompt
        is_thai = any(ord(c) >= 0x0E00 and ord(c) <= 0x0E7F for c in query)
        lang_hint = "ภาษาไทย" if is_thai else "English"
        
        prompt = f"""You are a research assistant. Expand this query into 3-5 specific search queries that will help gather comprehensive information.

IMPORTANT CONTEXT RULES:
- If the query mentions "Typhoon" with "model", "LLM", "AI", "API", or technical terms → this refers to "Typhoon LLM/AI model" (NOT weather)
- If the query is in Thai about technology → preserve Thai language and technical context
- If asking about software, APIs, models, tools → focus on technology, NOT weather or natural disasters
- Keep the SAME language as the original query in expanded queries

Original Query: {query}

Generate diverse search queries in {lang_hint} covering:
1. Core facts and definitions (technical/AI context if applicable)
2. Recent developments and news
3. Expert opinions and analysis
4. Statistical data and research
5. Practical applications or implications

Return ONLY a JSON array of search queries, nothing else.
Example: ["query 1", "query 2", "query 3"]"""

        try:
            expanded = self._call_llm(prompt, temperature=0.7, max_tokens=500)
            
            # Parse JSON response
            queries = json.loads(expanded.strip())
            if isinstance(queries, list):
                # Refine queries for search engines
                refined_queries = [self._refine_search_query(q) for q in queries]
                logger.info(f"✅ Expanded to {len(refined_queries)} queries")
                return refined_queries[:5]  # Limit to 5
        except:
            logger.warning("⚠️  Query expansion failed, using original")
        
        return [self._refine_search_query(query)]  # Fallback to original query
    
    def _refine_search_query(self, query: str) -> str:
        """Refine query to add context for search engines"""
        # Detect if it's a technical query about Typhoon LLM
        typhoon_related = any(kw in query.lower() for kw in ['typhoon', 'ไต้ฝุ่น'])
        tech_related = any(kw in query.lower() for kw in ['model', 'api', 'llm', 'ai', 'โมเดล', 'ใช้งาน'])
        
        if typhoon_related and tech_related:
            # It's about Typhoon AI, not weather
            if 'typhoon' in query.lower() and 'scb' not in query.lower():
                # Add SCB context to disambiguate
                query = f"{query} SCB 10X AI model"
            elif 'ไต้ฝุ่น' in query:
                # Replace Thai "ไต้ฝุ่น" with "Typhoon AI" for better search results
                query = query.replace('ไต้ฝุ่น', 'Typhoon')
                query = f"{query} SCB AI LLM"
        
        return query.strip()
    
    # ────────────────────────────────────────────────────────────────
    # STAGE 2: MULTI-SOURCE SEARCH
    # ────────────────────────────────────────────────────────────────
    
    def search_tavily(self, query: str, recency_days: int = 7) -> List[SearchResult]:
        """Search using Tavily"""
        if not self.tavily_client:
            return []
        
        try:
            logger.info(f"🔍 Searching Tavily: {query}")
            results = self.tavily_client.search(
                query=query,
                max_results=5,
                search_depth="advanced",
                include_raw_content=True,
                days=recency_days
            )
            
            search_results = []
            for r in results.get('results', []):
                search_results.append(SearchResult(
                    title=r.get('title', ''),
                    url=r.get('url', ''),
                    snippet=r.get('content', ''),
                    content=r.get('raw_content', r.get('content', '')),
                    source='tavily',
                    published_date=r.get('published_date')
                ))
            
            logger.info(f"✅ Tavily: {len(search_results)} results")
            return search_results
        except Exception as e:
            logger.error(f"❌ Tavily error: {e}")
            return []
    
    def search_serper(self, query: str, recency_days: int = 7) -> List[SearchResult]:
        """Search using SerperAPI (Google Search)"""
        if not self.serper_api_key:
            return []
        
        try:
            logger.info(f"🔍 Searching SerperAPI: {query}")
            
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=recency_days)
            
            url = "https://google.serper.dev/search"
            headers = {
                'X-API-KEY': self.serper_api_key,
                'Content-Type': 'application/json'
            }
            payload = {
                'q': query,
                'num': 5,
                'tbs': f'qdr:w'  # Past week filter
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            search_results = []
            for r in data.get('organic', [])[:5]:
                search_results.append(SearchResult(
                    title=r.get('title', ''),
                    url=r.get('link', ''),
                    snippet=r.get('snippet', ''),
                    content=r.get('snippet', ''),
                    source='serper',
                    published_date=r.get('date')
                ))
            
            logger.info(f"✅ SerperAPI: {len(search_results)} results")
            return search_results
        except Exception as e:
            logger.error(f"❌ SerperAPI error: {e}")
            return []
    
    def search_jina(self, query: str) -> List[SearchResult]:
        """Search using JINA_API"""
        if not self.jina_api_key:
            return []
        
        try:
            logger.info(f"🔍 Searching JINA: {query}")
            
            url = "https://s.jina.ai/"
            headers = {
                'Authorization': f'Bearer {self.jina_api_key}',
                'Content-Type': 'application/json',
                'X-Retain-Images': 'none'
            }
            
            # JINA search query
            search_url = f"{url}{query}"
            response = requests.get(search_url, headers=headers, timeout=15)
            response.raise_for_status()
            
            # Parse JINA response (returns markdown)
            content = response.text
            
            # Extract structured data from markdown
            search_results = []
            
            # Simple parsing - split by ## headers
            sections = content.split('\n##')
            for section in sections[:5]:
                lines = section.strip().split('\n')
                if len(lines) > 1:
                    title = lines[0].strip('#').strip()
                    snippet = '\n'.join(lines[1:5])[:300]
                    
                    # Try to extract URL
                    url_match = re.search(r'https?://[^\s\)]+', section)
                    url = url_match.group(0) if url_match else "https://jina.ai/search"
                    
                    search_results.append(SearchResult(
                        title=title,
                        url=url,
                        snippet=snippet,
                        content=snippet,
                        source='jina'
                    ))
            
            logger.info(f"✅ JINA: {len(search_results)} results")
            return search_results
        except Exception as e:
            logger.error(f"❌ JINA error: {e}")
            return []
    
    def multi_search(self, queries: List[str], recency_days: int = 7) -> List[SearchResult]:
        """Execute hybrid search across all sources"""
        logger.info(f"🔍 Stage 2: Multi-source search ({len(queries)} queries)")
        
        all_results = []
        
        for query in queries:
            # Search all sources
            all_results.extend(self.search_tavily(query, recency_days))
            all_results.extend(self.search_serper(query, recency_days))
            all_results.extend(self.search_jina(query))
        
        # Deduplicate by URL
        seen_urls = set()
        unique_results = []
        for result in all_results:
            if result.url not in seen_urls:
                seen_urls.add(result.url)
                unique_results.append(result)
        
        logger.info(f"✅ Collected {len(unique_results)} unique results")
        return unique_results
    
    # ────────────────────────────────────────────────────────────────
    # STAGE 3: NOISE FILTERING
    # ────────────────────────────────────────────────────────────────
    
    def filter_noise(self, results: List[SearchResult], query: str) -> List[SearchResult]:
        """Filter out irrelevant or low-quality results"""
        logger.info(f"🔍 Stage 3: Filtering noise from {len(results)} results")
        
        if not results:
            return []
        
        # Detect query context
        tech_keywords = ['model', 'api', 'llm', 'ai', 'software', 'typhoon', 'gpt', 'gemini', 'openai', 'ใช้งาน', 'โมเดล']
        is_tech_query = any(kw in query.lower() for kw in tech_keywords)
        
        context_note = ""
        if is_tech_query:
            context_note = """
CRITICAL FILTERING RULES:
- REJECT: Weather, storms, natural disasters (พายุ, ภัยพิบัติ, สภาพอากาศ)
- ACCEPT: AI models, software, APIs, technology, LLMs
- "Typhoon" = AI model (NOT weather phenomenon)
- Focus on technical/software content ONLY"""
        
        # Create summary of all results
        results_summary = "\n\n".join([
            f"[{i+1}] {r.title}\n{r.snippet[:200]}"
            for i, r in enumerate(results[:20])
        ])
        
        prompt = f"""You are a research quality filter. Review these search results for the query: "{query}"
{context_note}

Results:
{results_summary}

Task: Identify which results are RELEVANT and HIGH-QUALITY.

Criteria:
- Directly addresses the query context (technology vs weather)
- Contains substantial information
- From credible sources
- Not spam, ads, or clickbait
- Matches the query intent (technical queries = technical content)

Return ONLY a JSON array of relevant result numbers (1-indexed).
Example: [1, 3, 5, 7]"""

        try:
            response = self._call_llm(prompt, temperature=0.3, max_tokens=200)
            relevant_indices = json.loads(response.strip())
            
            # Filter results
            filtered = [results[i-1] for i in relevant_indices if 0 < i <= len(results)]
            logger.info(f"✅ Filtered to {len(filtered)} relevant results")
            return filtered
        except Exception as e:
            logger.warning(f"⚠️  Filtering failed, keeping top results: {e}")
            return results[:15]  # Keep top 15 if filtering fails
    
    # ────────────────────────────────────────────────────────────────
    # STAGE 4: CREDIBILITY SCORING
    # ────────────────────────────────────────────────────────────────
    
    def score_credibility(self, results: List[SearchResult], recency_days: int = 30) -> List[SearchResult]:
        """Score each result's credibility"""
        logger.info(f"🔍 Stage 4: Scoring credibility")
        
        for result in results:
            result.credibility_score = CredibilityScorer.calculate_overall_score(result, recency_days)
        
        # Sort by credibility
        results.sort(key=lambda x: x.credibility_score, reverse=True)
        
        avg_score = sum(r.credibility_score for r in results) / len(results) if results else 0
        logger.info(f"✅ Scored {len(results)} results (avg: {avg_score:.2f})")
        
        return results
    
    # ────────────────────────────────────────────────────────────────
    # STAGE 5: SYNTHESIS
    # ────────────────────────────────────────────────────────────────
    
    def synthesize_findings(self, results: List[SearchResult], query: str) -> Dict[str, Any]:
        """Synthesize findings into comprehensive analysis with full content"""
        logger.info(f"🔍 Stage 5: Synthesizing findings")
        
        # Detect context
        is_thai = any(ord(c) >= 0x0E00 and ord(c) <= 0x0E7F for c in query)
        lang_hint = "ภาษาไทย" if is_thai else "English"
        
        # Context detection for technical queries
        tech_keywords = ['model', 'api', 'llm', 'ai', 'software', 'typhoon', 'gpt', 'gemini', 'openai']
        is_tech_query = any(kw in query.lower() for kw in tech_keywords)
        
        context_note = ""
        if is_tech_query:
            context_note = """
CRITICAL CONTEXT:
- This query is about AI/Technology/Software (NOT weather or natural disasters)
- "Typhoon" refers to "Typhoon LLM" (AI language model by SCB 10X)
- Focus on technical capabilities, API usage, model comparison
- Ignore any weather/storm-related content"""
        
        # Prepare comprehensive context from ALL results
        context = "\n\n".join([
            f"[Source {i+1}] {r.title}\n{r.content}\nURL: {r.url}\nCredibility: {r.credibility_score:.2f}"
            for i, r in enumerate(results[:15])  # Use more sources
        ])
        
        prompt = f"""You are an expert research analyst and intelligence briefing specialist. Create a COMPREHENSIVE, DETAILED research report in {lang_hint}.

{context_note}

Query: "{query}"

Available Research Sources ({len(results[:15])} high-quality sources):
{context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR MISSION: Create a COMPLETE, ACTIONABLE Intelligence Brief
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a DETAILED JSON report with ALL sections FULLY POPULATED:

{{
    "executive_summary": "📋 Write 3-5 comprehensive paragraphs (minimum 200 words) summarizing:
        - What is this about?
        - Why does it matter?
        - Key insights discovered
        - Strategic implications
        - Main conclusions
        
        Use specific numbers, dates, and facts from the sources. Make it DETAILED and ACTIONABLE.",
    
    "key_findings": [
        "🔑 Finding 1: [DETAILED finding with specific data, numbers, percentages from sources. Cite with [1], [2]]",
        "🔑 Finding 2: [Another DETAILED finding with evidence and source citations]",
        "🔑 Finding 3: [Continue with 5-8 key findings, each with specific details]",
        "🔑 Finding 4: [Each should be 2-3 sentences with concrete information]",
        "🔑 Finding 5: [Include statistics, trends, or specific examples]",
        "Include 5-8 findings minimum"
    ],
    
    "detailed_analysis": "📊 Write 4-6 comprehensive paragraphs (minimum 400 words) covering:
    
        **Market Intelligence & Trends:**
        - Current market size, growth rates, key statistics [cite sources]
        - Rising trends and declining patterns with data
        - Competitive landscape and market leaders
        - Innovation areas and technological developments
        
        **Business Implications:**
        - Revenue opportunities and market potential
        - Cost structures and efficiency factors
        - Risk factors (high, medium, low) with details
        - Strategic advantages and disadvantages
        
        **Technical Deep Dive (if applicable):**
        - Technical specifications and capabilities
        - Performance metrics and benchmarks
        - Integration requirements and compatibility
        - Scalability and limitations
        
        **Stakeholder Impact:**
        - Who is affected and how?
        - Customer/user benefits and concerns
        - Industry reactions and expert opinions
        - Regulatory or compliance considerations
        
        Use specific data, cite sources with [1], [2], make it COMPREHENSIVE and INSIGHTFUL.",
    
    "market_intelligence": {{
        "key_trends": [
            "📈 Rising Trend 1: [Detailed description with data]",
            "📈 Rising Trend 2: [Specific numbers and timeframes]",
            "📉 Declining Trend 1: [What's declining and why]"
        ],
        "competitive_landscape": [
            "🏢 Market Leader 1: [Company/solution with market share, strengths]",
            "🏢 Competitor 2: [Details about positioning]",
            "🏢 Emerging Player: [Innovation and disruption potential]"
        ],
        "risk_factors": [
            "⚠️ High Risk: [Specific risk with mitigation strategies]",
            "⚠️ Medium Risk: [Another risk factor]",
            "💡 Consideration: [Important factors to watch]"
        ],
        "opportunities": [
            "💰 Revenue Opportunity: [Specific opportunity with potential value]",
            "🌟 Expansion Opportunity: [Market or product expansion details]",
            "🤝 Partnership Opportunity: [Strategic collaboration possibilities]"
        ]
    }},
    
    "confidence_level": "high|medium|low - Based on source quality and data availability",
    
    "recommendations": [
        "✅ IMMEDIATE ACTION (0-30 days): [Specific actionable step with rationale]",
        "✅ IMMEDIATE ACTION: [Another urgent action item]",
        "🎯 SHORT-TERM (1-6 months): [Initiative with expected outcomes]",
        "🎯 SHORT-TERM: [Another short-term strategy]",
        "🏆 LONG-TERM (6+ months): [Strategic direction for sustained advantage]",
        "🏆 LONG-TERM: [Vision for future positioning]",
        "Include 6-10 recommendations minimum"
    ],
    
    "key_metrics": {{
        "financial_data": [
            "💰 Market Value: $XXX billion [source]",
            "📊 Growth Rate: XX% YoY [source]",
            "💵 Revenue Impact: $XXX million [source]"
        ],
        "performance_indicators": [
            "📈 KPI 1: XX% improvement [source]",
            "⚡ Metric 2: Specific measurement [source]",
            "🎯 Statistic 3: Notable number [source]"
        ]
    }},
    
    "strategic_takeaways": [
        "🔑 Key Observation 1: [Critical insight that changes the game]",
        "🔑 Key Observation 2: [Another strategic insight]",
        "🔑 Key Observation 3: [Important conclusion]",
        "🔑 Key Observation 4: [Business implication]",
        "🔑 Key Observation 5: [Future direction]"
    ]
}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ CRITICAL REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **NO PLACEHOLDERS**: Every field must have REAL, SPECIFIC content from sources
2. **CITE SOURCES**: Use [1], [2], [3] to cite specific sources throughout
3. **BE SPECIFIC**: Include actual numbers, percentages, dates, names
4. **BE COMPREHENSIVE**: Minimum 400 words for detailed_analysis
5. **BE ACTIONABLE**: Recommendations must be specific and executable
6. **WRITE IN {lang_hint}**: All content in {lang_hint} language naturally

DO NOT write "Analysis in progress..." or "Details needed" or any placeholder text.
EXTRACT AND USE the actual data from the sources provided above.

Return ONLY valid JSON without markdown code blocks or explanations."""

        try:
            logger.info(f"🤖 Calling LLM for comprehensive synthesis...")
            response = self._call_llm(prompt, temperature=0.7, max_tokens=4000)
            
            # Clean response
            response = response.strip()
            if response.startswith('```json'):
                response = response[7:]
            if response.startswith('```'):
                response = response[3:]
            if response.endswith('```'):
                response = response[:-3]
            response = response.strip()
            
            synthesis = json.loads(response)
            
            # Validate that content is not placeholder
            exec_summary = synthesis.get('executive_summary', '')
            if len(exec_summary) < 100 or 'in progress' in exec_summary.lower():
                logger.warning("⚠️  Synthesis returned placeholder content, retrying...")
                raise ValueError("Placeholder content detected")
            
            logger.info(f"✅ Successfully synthesized comprehensive findings")
            logger.info(f"   Executive Summary: {len(exec_summary)} chars")
            logger.info(f"   Key Findings: {len(synthesis.get('key_findings', []))} items")
            logger.info(f"   Detailed Analysis: {len(synthesis.get('detailed_analysis', ''))} chars")
            
            return synthesis
            
        except Exception as e:
            logger.error(f"❌ Synthesis failed: {e}")
            logger.info(f"🔄 Attempting fallback synthesis...")
            
            # Fallback: Create synthesis from raw content
            try:
                fallback_summary = self._create_fallback_synthesis(results, query, lang_hint)
                return fallback_summary
            except:
                return {
                    "executive_summary": f"Research on '{query}' found {len(results)} sources. Analysis pending.",
                    "key_findings": [f"Source {i+1}: {r.title}" for i, r in enumerate(results[:5])],
                    "detailed_analysis": "\n\n".join([f"[{i+1}] {r.title}\n{r.content[:300]}" for i, r in enumerate(results[:5])]),
                    "confidence_level": "medium",
                    "recommendations": ["Review sources for detailed information"],
                    "market_intelligence": {},
                    "key_metrics": {},
                    "strategic_takeaways": []
                }
    
    def _create_fallback_synthesis(self, results: List[SearchResult], query: str, lang: str) -> Dict[str, Any]:
        """Create fallback synthesis when LLM fails"""
        logger.info("📝 Creating fallback synthesis from sources...")
        
        # Extract key content from top results
        top_results = results[:8]
        
        summary_parts = []
        findings = []
        analysis_parts = []
        
        for i, result in enumerate(top_results, 1):
            # Build summary
            if i <= 3:
                summary_parts.append(f"{result.title} [{i}]")
            
            # Extract findings
            finding = f"{result.title}: {result.snippet[:150]}... [Source {i}]"
            findings.append(finding)
            
            # Build analysis
            analysis_parts.append(f"**[{i}] {result.title}** (Credibility: {result.credibility_score:.2f})\n\n{result.content[:400]}...\n")
        
        executive_summary = f"Research on '{query}' analyzed {len(results)} sources. " + " ".join(summary_parts[:3])
        detailed_analysis = "\n\n".join(analysis_parts)
        
        return {
            "executive_summary": executive_summary,
            "key_findings": findings,
            "detailed_analysis": detailed_analysis,
            "confidence_level": "medium",
            "recommendations": [
                f"Review top {len(top_results)} sources for comprehensive information",
                "Verify specific claims with original sources",
                "Consider additional research for deeper insights"
            ],
            "market_intelligence": {
                "key_trends": [f"Trend identified in: {r.title}" for r in top_results[:3]],
                "competitive_landscape": [],
                "risk_factors": [],
                "opportunities": []
            },
            "key_metrics": {
                "financial_data": [],
                "performance_indicators": []
            },
            "strategic_takeaways": [f"Key insight from {r.source.upper()}: {r.snippet[:100]}" for r in top_results[:3]]
        }
    
    # ────────────────────────────────────────────────────────────────
    # STAGE 6: FACT VALIDATION
    # ────────────────────────────────────────────────────────────────
    
    def validate_facts(self, synthesis: Dict[str, Any], results: List[SearchResult]) -> Dict[str, Any]:
        """Validate claims against sources"""
        logger.info(f"🔍 Stage 6: Validating facts")
        
        claims = synthesis.get('key_findings', [])
        if not claims:
            return {'validated_claims': [], 'warnings': []}
        
        # Create verification context
        sources_text = "\n\n".join([
            f"[{i+1}] {r.content[:300]}"
            for i, r in enumerate(results[:5])
        ])
        
        prompt = f"""You are a fact-checker. Verify these claims against the sources.

Claims:
{json.dumps(claims, indent=2)}

Sources:
{sources_text}

For each claim, return:
{{
    "claim": "the claim",
    "status": "verified|partially_verified|unverified",
    "supporting_sources": [1, 2],
    "confidence": "high|medium|low"
}}

Return JSON array of validations."""

        try:
            response = self._call_llm(prompt, temperature=0.2, max_tokens=1000)
            validations = json.loads(response.strip())
            logger.info(f"✅ Validated {len(validations)} claims")
            return {'validated_claims': validations, 'warnings': []}
        except Exception as e:
            logger.warning(f"⚠️  Validation failed: {e}")
            return {'validated_claims': [], 'warnings': ['Fact validation incomplete']}
    
    # ────────────────────────────────────────────────────────────────
    # STAGE 7: SENSITIVE DATA REDACTION
    # ────────────────────────────────────────────────────────────────
    
    def redact_sensitive_data(self, synthesis: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
        """Redact sensitive information"""
        logger.info(f"🔍 Stage 7: Redacting sensitive data")
        
        redacted_types = []
        
        # Redact all text fields
        for key in ['executive_summary', 'detailed_analysis']:
            if key in synthesis:
                synthesis[key], types = SensitiveDataRedactor.redact(synthesis[key])
                redacted_types.extend(types)
        
        # Redact findings and recommendations
        for i, finding in enumerate(synthesis.get('key_findings', [])):
            synthesis['key_findings'][i], types = SensitiveDataRedactor.redact(finding)
            redacted_types.extend(types)
        
        redacted_types = list(set(redacted_types))
        
        if redacted_types:
            logger.info(f"✅ Redacted: {', '.join(redacted_types)}")
        else:
            logger.info(f"✅ No sensitive data found")
        
        return synthesis, redacted_types
    
    # ────────────────────────────────────────────────────────────────
    # STAGE 8: MARKDOWN REPORT GENERATION
    # ────────────────────────────────────────────────────────────────
    
    def generate_markdown_report(
        self,
        query: str,
        synthesis: Dict[str, Any],
        results: List[SearchResult],
        validation: Dict[str, Any],
        redacted_types: List[str],
        metadata: Dict[str, Any]
    ) -> str:
        """Generate comprehensive Markdown report"""
        logger.info(f"🔍 Stage 8: Generating Markdown report")
        
        report = f"""# 🔬 DeepResearch Report

**Query:** {query}  
**Model:** {self.model}  
**Timestamp:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**Confidence:** {synthesis.get('confidence_level', 'medium').upper()}  

---

## 📋 Executive Summary

{synthesis.get('executive_summary', 'No summary available.')}

---

## 🔑 Key Findings

"""
        
        for i, finding in enumerate(synthesis.get('key_findings', []), 1):
            report += f"{i}. {finding}\n"
        
        report += f"""
---

## 📊 Detailed Analysis

{synthesis.get('detailed_analysis', 'Analysis in progress...')}

---

## ✅ Fact Validation

"""
        
        validated_claims = validation.get('validated_claims', [])
        if validated_claims:
            for claim_validation in validated_claims:
                status = claim_validation.get('status', 'unknown')
                emoji = '✅' if status == 'verified' else '⚠️' if status == 'partially_verified' else '❌'
                report += f"- {emoji} **{status.upper()}**: {claim_validation.get('claim', '')}\n"
        else:
            report += "_Validation in progress..._\n"
        
        report += f"""
---

## 💡 Recommendations

"""
        
        for i, rec in enumerate(synthesis.get('recommendations', []), 1):
            report += f"{i}. {rec}\n"
        
        report += f"""
---

## 📚 Sources ({len(results)})

"""
        
        for i, result in enumerate(results[:20], 1):
            report += f"""
### [{i}] {result.title}
- **URL:** {result.url}
- **Source:** {result.source.upper()}
- **Credibility:** {result.credibility_score:.2f}/1.0
- **Snippet:** {result.snippet[:200]}...

"""
        
        report += f"""
---

## 🔐 Data Privacy

"""
        
        if redacted_types:
            report += f"**Redacted Information:** {', '.join(redacted_types).upper()}\n\n"
        else:
            report += "✅ No sensitive data detected.\n\n"
        
        report += f"""
---

## 📈 Research Metadata

- **Sources Searched:** Tavily + SerperAPI + JINA_API
- **Results Analyzed:** {len(results)}
- **Average Credibility:** {sum(r.credibility_score for r in results) / len(results):.2f}/1.0
- **Search Duration:** {metadata.get('duration', 'N/A')}
- **Model Used:** {self.model}

---

*Report generated by NINJA DeepResearch System*
"""
        
        logger.info(f"✅ Generated Markdown report ({len(report)} characters)")
        return report
    
    # ────────────────────────────────────────────────────────────────
    # MAIN RESEARCH METHOD
    # ────────────────────────────────────────────────────────────────
    
    def research(
        self,
        query: str,
        recency_days: int = 7,
        export_pptx: bool = False
    ) -> ResearchReport:
        """
        Execute complete DeepResearch pipeline
        
        Returns ResearchReport with:
        - executive_summary
        - key_findings
        - detailed_analysis
        - sources (with credibility scores)
        - validation results
        - markdown_report
        - powerpoint_path (if export_pptx=True)
        """
        start_time = datetime.now()
        logger.info(f"🚀 Starting DeepResearch for: {query}")
        
        try:
            # Stage 1: Query Expansion
            expanded_queries = self.expand_query(query)
            
            # Stage 2: Multi-Search
            search_results = self.multi_search(expanded_queries, recency_days)
            
            if not search_results:
                raise ValueError("No search results found")
            
            # Stage 3: Noise Filtering
            filtered_results = self.filter_noise(search_results, query)
            
            # Stage 4: Credibility Scoring
            scored_results = self.score_credibility(filtered_results, recency_days)
            
            # Stage 5: Synthesis
            synthesis = self.synthesize_findings(scored_results, query)
            
            # Stage 6: Fact Validation
            validation = self.validate_facts(synthesis, scored_results)
            
            # Stage 7: Sensitive Data Redaction
            synthesis, redacted_types = self.redact_sensitive_data(synthesis)
            
            # Calculate metadata
            duration = (datetime.now() - start_time).total_seconds()
            metadata = {
                'duration': f"{duration:.2f}s",
                'sources_count': len(scored_results),
                'model': self.model,
                'timestamp': datetime.now().isoformat()
            }
            
            # Stage 8: Markdown Report
            markdown_report = self.generate_markdown_report(
                query, synthesis, scored_results, validation, redacted_types, metadata
            )
            
            # Prepare sources for export
            sources_export = [
                {
                    'title': r.title,
                    'url': r.url,
                    'snippet': r.snippet,
                    'source': r.source,
                    'credibility_score': r.credibility_score,
                    'published_date': r.published_date
                }
                for r in scored_results[:20]
            ]
            
            # Stage 9: PowerPoint Export (if requested)
            pptx_path = None
            if export_pptx:
                pptx_path = self._export_to_powerpoint(query, synthesis, scored_results, markdown_report)
            
            # Create final report
            report = ResearchReport(
                query=query,
                executive_summary=synthesis.get('executive_summary', ''),
                key_findings=synthesis.get('key_findings', []),
                detailed_analysis=synthesis.get('detailed_analysis', ''),
                sources=sources_export,
                credibility_assessment={
                    'average_score': sum(r.credibility_score for r in scored_results) / len(scored_results) if scored_results else 0,
                    'high_credibility_count': sum(1 for r in scored_results if r.credibility_score >= 0.7),
                    'validation_results': validation
                },
                recommendations=synthesis.get('recommendations', []),
                metadata=metadata,
                markdown_report=markdown_report,
                powerpoint_path=pptx_path
            )
            
            logger.info(f"✅ DeepResearch completed in {duration:.2f}s")
            return report
            
        except Exception as e:
            logger.error(f"❌ DeepResearch failed: {e}")
            raise
    
    # ────────────────────────────────────────────────────────────────
    # HELPER: LLM CALLS
    # ────────────────────────────────────────────────────────────────
    
    def _call_llm(self, prompt: str, temperature: float = 0.7, max_tokens: int = 2000) -> str:
        """Call appropriate LLM based on model selection"""
        
        try:
            model_lower = self.model.lower()
            
            # Azure OpenAI models (GPT-5, O3, GPT-4o series)
            if self.azure_client:
                response = self.azure_client.chat(
                    messages=[{"role": "user", "content": prompt}],
                    model=self.model,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return response['content']
            
            # ChatGPT / OpenAI models (gpt-4o, gpt-5, o3)
            elif any(x in model_lower for x in ["gpt", "o3"]) and self.openai_client:
                # Map model names to actual OpenAI model identifiers
                openai_model_map = {
                    "gpt-4o": "gpt-4o",
                    "gpt-5": "gpt-4o",  # Fallback to gpt-4o if gpt-5 not available
                    "o3": "o3-mini",    # Use o3-mini if o3 is requested
                }
                
                actual_model = openai_model_map.get(self.model, self.model)
                
                response = self.openai_client.chat.completions.create(
                    model=actual_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return response.choices[0].message.content
            
            # Typhoon models (typhoon-v2.1-12b-instruct, typhoon-v2.5-30b-a3b-instruct)
            elif "typhoon" in model_lower and self.typhoon_client:
                # Use the correct Typhoon model name
                if "2.1" in model_lower or "12b" in model_lower:
                    typhoon_model = "typhoon-v2.1-12b-instruct"
                elif "30b" in model_lower:
                    typhoon_model = "typhoon-v2.5-30b-a3b-instruct"
                else:
                    # Default to 30B
                    typhoon_model = "typhoon-v2.5-30b-a3b-instruct"
                
                response = self.typhoon_client.chat.completions.create(
                    model=typhoon_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return response.choices[0].message.content
            
            # Gemini models (gemini-flash-latest, gemini-2.5-pro)
            elif "gemini" in model_lower and self.gemini_model:
                # Configure generation settings for Gemini
                generation_config = genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                )
                
                response = self.gemini_model.generate_content(
                    prompt,
                    generation_config=generation_config
                )
                return response.text
            
            else:
                raise ValueError(f"No LLM client available for model: {self.model}")
        
        except Exception as e:
            logger.error(f"❌ LLM call failed for model {self.model}: {e}")
            raise
    
    # ────────────────────────────────────────────────────────────────
    # HELPER: POWERPOINT EXPORT
    # ────────────────────────────────────────────────────────────────
    
    def _export_to_powerpoint(
        self,
        query: str,
        synthesis: Dict[str, Any],
        results: List[SearchResult],
        markdown_report: str
    ) -> Optional[str]:
        """Export research to PowerPoint (placeholder - integrate with existing slide generator)"""
        logger.info("📊 Exporting to PowerPoint...")
        
        try:
            # This should integrate with unified_presentation_final.py
            # For now, save as JSON for slide generator
            export_dir = "exports"
            os.makedirs(export_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            json_path = f"{export_dir}/research_{timestamp}.json"
            
            export_data = {
                'query': query,
                'synthesis': synthesis,
                'sources': [
                    {'title': r.title, 'url': r.url, 'snippet': r.snippet}
                    for r in results[:10]
                ],
                'markdown': markdown_report
            }
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ Exported to: {json_path}")
            return json_path
            
        except Exception as e:
            logger.error(f"❌ PowerPoint export failed: {e}")
            return None


# ════════════════════════════════════════════════════════════════════
# CONVENIENCE FUNCTION
# ════════════════════════════════════════════════════════════════════

def deep_research(
    query: str,
    model: str = "typhoon-v2.5-instruct",
    recency_days: int = 7,
    export_pptx: bool = False,
    **api_keys
) -> ResearchReport:
    """
    Convenience function for quick research
    
    Example:
        result = deep_research(
            query="Latest AI developments",
            model="gpt-4-turbo",
            recency_days=7,
            tavily_api_key=os.getenv("TAVILY_API_KEY"),
            serper_api_key=os.getenv("SERPER_API_KEY"),
            jina_api_key=os.getenv("JINA_API_KEY"),
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
    """
    engine = ComprehensiveResearch(model=model, **api_keys)
    return engine.research(query, recency_days, export_pptx)


if __name__ == "__main__":
    # Test the engine
    from dotenv import load_dotenv
    load_dotenv()
    
    result = deep_research(
        query="What are the latest developments in Large Language Models?",
        model="typhoon-v2.5-instruct",
        recency_days=7,
        tavily_api_key=os.getenv("TAVILY_API_KEY"),
        serper_api_key=os.getenv("SERPER_API_KEY"),
        jina_api_key=os.getenv("JINA_API_KEY"),
        typhoon_api_key=os.getenv("TYPHOON_API_KEY")
    )
    
    print("\n" + "="*80)
    print("RESEARCH REPORT")
    print("="*80)
    print(result.markdown_report)
