"""
JINA Adapter
============
Adapter for JINA Search API
"""
import os
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv
from .base_engine import BaseSearchEngine, SearchResult

# Load environment variables
load_dotenv()


class JINAEngine(BaseSearchEngine):
    """JINA Search adapter"""
    
    def __init__(self, api_key: str = None):
        super().__init__(api_key or os.getenv("JINA_API_KEY"))
        self.endpoint = "https://s.jina.ai"
    
    def search(self, query: str, num_results: int = 10, **kwargs) -> List[SearchResult]:
        """
        Search using JINA
        
        Args:
            query: Search query
            num_results: Number of results
            **kwargs: Additional parameters
        """
        if not self.api_key:
            raise ValueError("JINA_API_KEY not configured")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
        }
        
        # JINA uses URL format: https://s.jina.ai/{query}
        url = f"{self.endpoint}/{query}"
        
        try:
            print(f"🔍 JINA Search: {query}")
            response = requests.get(url, headers=headers, timeout=30)  # Increased from 10 to 30 seconds
            response.raise_for_status()
            data = response.json()
            
            results = []
            jina_results = data.get("data", [])
            
            for idx, item in enumerate(jina_results[:num_results], 1):
                result = SearchResult(
                    title=item.get("title", ""),
                    url=item.get("url", ""),
                    snippet=item.get("content", "")[:300],  # Limit snippet length
                    position=idx,
                    source="jina",
                    metadata={
                        "description": item.get("description", ""),
                    }
                )
                results.append(result)
            
            print(f"✅ JINA: {len(results)} results")
            return results
            
        except Exception as e:
            print(f"❌ JINA error: {e}")
            return []
    
    def get_engine_name(self) -> str:
        return "jina"
