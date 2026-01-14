"""
Hybrid Search Engine (SerperAPI + JINA)
========================================
Combines SerperAPI for web search with JINA for content extraction
"""
import os
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv
from .base_engine import BaseSearchEngine, SearchResult

# Load environment variables
load_dotenv()


class HybridEngine(BaseSearchEngine):
    """Hybrid search using SerperAPI + JINA"""
    
    def __init__(self, api_key: str = None):
        # Use SERPER_API_KEY for SerperAPI
        super().__init__(api_key or os.getenv("SERPER_API_KEY"))
        self.serper_endpoint = "https://google.serper.dev/search"
        self.jina_api_key = os.getenv("JINA_API_KEY")
        self.jina_reader_endpoint = "https://r.jina.ai"
    
    def search(self, query: str, num_results: int = 10, **kwargs) -> List[SearchResult]:
        """
        Hybrid search: SerperAPI for discovery + JINA for content enrichment
        
        Args:
            query: Search query
            num_results: Number of results
            **kwargs: Additional parameters (date_range, tbs for time-based search)
        """
        if not self.api_key:
            raise ValueError("SERPER_API_KEY not configured")
        
        # Step 1: Get search results from SerperAPI
        headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "q": query,
            "num": num_results,
        }
        
        # Add date range if specified (e.g., "d" for day, "w" for week, "m" for month, "y" for year)
        if "date_range" in kwargs:
            payload["tbs"] = f"qdr:{kwargs['date_range']}"
        
        # Add specific date range (e.g., "date:2024-01-01..2024-12-31")
        if "date_start" in kwargs and "date_end" in kwargs:
            payload["tbs"] = f"cdr:1,cd_min:{kwargs['date_start']},cd_max:{kwargs['date_end']}"
        
        try:
            print(f"🔍 Hybrid Search (SerperAPI): {query}")
            response = requests.post(
                self.serper_endpoint,
                headers=headers,
                json=payload,
                timeout=15
            )
            response.raise_for_status()
            data = response.json()
            
            results = []
            organic_results = data.get("organic", [])
            
            for idx, item in enumerate(organic_results[:num_results], 1):
                # Get enhanced content from JINA if available
                snippet = item.get("snippet", "")
                url = item.get("link", "")
                
                # Optional: Enhance with JINA Reader (if JINA key available)
                enhanced_snippet = snippet
                if self.jina_api_key and kwargs.get("enhance_content", False):
                    try:
                        enhanced_snippet = self._enhance_with_jina(url)
                    except Exception as e:
                        print(f"⚠️  JINA enhancement failed for {url}: {e}")
                
                result = SearchResult(
                    title=item.get("title", ""),
                    url=url,
                    snippet=enhanced_snippet,
                    position=idx,
                    source="hybrid",
                    metadata={
                        "date": item.get("date", ""),
                        "position_on_page": item.get("position", 0),
                        "serper_score": item.get("score", 0),
                    }
                )
                results.append(result)
            
            print(f"✅ Hybrid: {len(results)} results (SerperAPI + JINA)")
            return results
            
        except Exception as e:
            print(f"❌ Hybrid search error: {e}")
            return []
    
    def _enhance_with_jina(self, url: str) -> str:
        """
        Use JINA Reader to extract clean content from URL
        """
        if not self.jina_api_key:
            return ""
        
        headers = {
            "Authorization": f"Bearer {self.jina_api_key}",
            "Accept": "application/json",
        }
        
        jina_url = f"{self.jina_reader_endpoint}/{url}"
        
        try:
            response = requests.get(jina_url, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Extract content preview (first 500 chars)
            content = data.get("data", {}).get("content", "")
            return content[:500] if content else ""
            
        except Exception as e:
            print(f"⚠️  JINA Reader error: {e}")
            return ""
    
    def get_engine_name(self) -> str:
        return "hybrid"
