"""
NINJA Research Engines
======================
AI-powered research and presentation engines

Modules:
- glm_7step_generator: Primary 7-step slide generator (GLM-4.7)
- comprehensive_research_engine: Unified research pipeline
- ai_slide_generator: PPTX export with images
- zai_slide_generator: Fast single-API generation
- code_slide_generator: HTML/CSS slides
- presentation_engine: Legacy support
"""
__version__ = "2.0.0"

# Main exports
from .glm_7step_generator import GLM7StepGenerator
from .comprehensive_research_engine import ComprehensiveResearch

__all__ = [
    "GLM7StepGenerator",
    "ComprehensiveResearch",
]
