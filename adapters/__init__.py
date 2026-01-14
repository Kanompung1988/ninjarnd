"""
Search Engine Adapters
======================
Unified search interface for multiple search engines
Pattern C: FastAPI Microservice Architecture
"""
from .base_engine import BaseSearchEngine, SearchResult
from .tavily_engine import TavilyEngine
from .jina_engine import JINAEngine
from .hybrid_engine import HybridEngine

__all__ = [
    "BaseSearchEngine",
    "SearchResult",
    "TavilyEngine",
    "JINAEngine",
    "HybridEngine",
]
