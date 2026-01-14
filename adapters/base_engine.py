"""
Base Search Engine Interface
=============================
Abstract base class for all search engine adapters
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class SearchResult:
    """Unified search result format"""
    title: str
    url: str
    snippet: str
    position: int
    source: str  # 'bing', 'serpapi', 'tavily', 'jina'
    metadata: Optional[Dict[str, Any]] = None


class BaseSearchEngine(ABC):
    """Abstract base class for search engines"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    @abstractmethod
    def search(self, query: str, num_results: int = 10, **kwargs) -> List[SearchResult]:
        """
        Perform search and return unified results
        
        Args:
            query: Search query string
            num_results: Number of results to return
            **kwargs: Additional engine-specific parameters
            
        Returns:
            List of SearchResult objects
        """
        pass
    
    @abstractmethod
    def get_engine_name(self) -> str:
        """Return the name of the search engine"""
        pass
    
    def format_results(self, results: List[SearchResult]) -> Dict[str, Any]:
        """Format results in unified JSON structure"""
        return {
            "engine": self.get_engine_name(),
            "total_results": len(results),
            "results": [
                {
                    "position": r.position,
                    "title": r.title,
                    "url": r.url,
                    "snippet": r.snippet,
                    "source": r.source,
                    "metadata": r.metadata or {}
                }
                for r in results
            ]
        }
