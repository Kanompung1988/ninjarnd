"""
Tavily Adapter
==============
Adapter for Tavily AI Search (AI-optimized search engine)
"""
import os
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv
from .base_engine import BaseSearchEngine, SearchResult

# Load environment variables
load_dotenv()


class TavilyEngine(BaseSearchEngine):
    """Tavily AI Search adapter"""
    
    def __init__(self, api_key: str = None):
        super().__init__(api_key or os.getenv("TAVILY_API_KEY"))
        self.endpoint = "https://api.tavily.com/search"
    
    def search(self, query: str, num_results: int = 10, **kwargs) -> List[SearchResult]:
        """
        Search using Tavily AI
        
        Args:
            query: Search query
            num_results: Number of results
            **kwargs: Additional parameters (search_depth, include_domains, etc.)
        """
        if not self.api_key:
            raise ValueError("TAVILY_API_KEY not configured")
        
        payload = {
            "api_key": self.api_key,
            "query": query,
            "max_results": num_results,
        }
        
        # Add optional parameters
        if "search_depth" in kwargs:
            payload["search_depth"] = kwargs["search_depth"]  # "basic" or "advanced"
        if "include_domains" in kwargs:
            payload["include_domains"] = kwargs["include_domains"]
        if "exclude_domains" in kwargs:
            payload["exclude_domains"] = kwargs["exclude_domains"]
        
        try:
            print(f"🔍 Tavily Search: {query}")
            response = requests.post(self.endpoint, json=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            results = []
            tavily_results = data.get("results", [])
            
            for idx, item in enumerate(tavily_results[:num_results], 1):
                result = SearchResult(
                    title=item.get("title", ""),
                    url=item.get("url", ""),
                    snippet=item.get("content", ""),
                    position=idx,
                    source="tavily",
                    metadata={
                        "score": item.get("score", 0.0),
                        "raw_content": item.get("raw_content", ""),
                    }
                )
                results.append(result)
            
            print(f"✅ Tavily: {len(results)} results")
            return results
            
        except Exception as e:
            print(f"❌ Tavily error: {e}")
            return []
    
    def get_engine_name(self) -> str:
        return "tavily"
