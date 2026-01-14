"""
Code Slide Generator - HTML/CSS Slide Generation
================================================
Generate slides as HTML/CSS code (Z.AI style)
Returns slides with HTML code that can be rendered in browser
"""
import os
import json
import requests
from typing import Dict, List, Any, Optional, AsyncGenerator
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Load environment
PROJECT_ROOT = Path(__file__).parent.parent
ENV_PATH = PROJECT_ROOT / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

# API Configuration
GLM_API_KEY = os.getenv("GLM_API_KEY", "")
BASE_URL = "https://open.bigmodel.cn/api/paas/v4"


# HTML Template for slides
SLIDE_HTML_TEMPLATE = """
<div class="slide" data-slide-number="{slide_number}" style="{container_style}">
    <div class="slide-content" style="{content_style}">
        <h1 style="{title_style}">{title}</h1>
        <div class="slide-body" style="{body_style}">
            {content_html}
        </div>
    </div>
</div>
"""

# CSS Themes
THEMES = {
    "professional": {
        "background": "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        "title_color": "#ffffff",
        "text_color": "#e0e0e0",
        "accent_color": "#4fc3f7",
        "font_family": "'Segoe UI', sans-serif"
    },
    "creative": {
        "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "title_color": "#ffffff",
        "text_color": "#f0f0f0",
        "accent_color": "#ffd700",
        "font_family": "'Poppins', sans-serif"
    },
    "minimal": {
        "background": "#ffffff",
        "title_color": "#2d3436",
        "text_color": "#636e72",
        "accent_color": "#0984e3",
        "font_family": "'Helvetica Neue', sans-serif"
    },
    "dark": {
        "background": "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)",
        "title_color": "#ffffff",
        "text_color": "#b0b0b0",
        "accent_color": "#00d4ff",
        "font_family": "'Inter', sans-serif"
    }
}


class CodeSlideGenerator:
    """Generate HTML/CSS slides using GLM-4"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or GLM_API_KEY
        self.base_url = BASE_URL
        self.model = "glm-4-flash"
        
        if not self.api_key:
            raise ValueError("GLM_API_KEY not found")
        
        print("✅ Code Slide Generator initialized")
    
    def _call_api(self, prompt: str, max_tokens: int = 2000) -> str:
        """Call GLM API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a web designer. Generate HTML/CSS code for professional presentation slides."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": max_tokens
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
        except Exception as e:
            print(f"API Error: {e}")
        
        return ""
    
    def generate_slide_html(
        self,
        slide_info: Dict[str, Any],
        theme: str = "professional"
    ) -> Dict[str, Any]:
        """Generate HTML for a single slide"""
        
        theme_config = THEMES.get(theme, THEMES["professional"])
        slide_number = slide_info.get("slide_number", 1)
        title = slide_info.get("title", "")
        content = slide_info.get("content", [])
        slide_type = slide_info.get("type", "content")
        
        # Build content HTML
        if isinstance(content, list):
            content_html = "<ul style='list-style: none; padding: 0;'>"
            for item in content:
                content_html += f"<li style='margin: 15px 0; font-size: 1.4em;'>• {item}</li>"
            content_html += "</ul>"
        else:
            content_html = f"<p style='font-size: 1.4em;'>{content}</p>"
        
        # Style variations based on slide type
        if slide_type == "title":
            title_style = f"font-size: 3em; color: {theme_config['title_color']}; text-align: center; margin-bottom: 30px;"
            body_style = "text-align: center; font-size: 1.5em;"
        else:
            title_style = f"font-size: 2.2em; color: {theme_config['title_color']}; margin-bottom: 30px; border-bottom: 3px solid {theme_config['accent_color']}; padding-bottom: 15px;"
            body_style = f"color: {theme_config['text_color']};"
        
        # Build HTML
        html = SLIDE_HTML_TEMPLATE.format(
            slide_number=slide_number,
            container_style=f"background: {theme_config['background']}; min-height: 100vh; padding: 60px; font-family: {theme_config['font_family']};",
            content_style="max-width: 1200px; margin: 0 auto;",
            title_style=title_style,
            title=title,
            body_style=body_style,
            content_html=content_html
        )
        
        return {
            "slide_number": slide_number,
            "type": slide_type,
            "title": title,
            "html": html,
            "css": self._generate_css(theme_config),
            "theme": theme
        }
    
    def _generate_css(self, theme_config: Dict) -> str:
        """Generate CSS for the theme"""
        return f"""
.slide {{
    background: {theme_config['background']};
    color: {theme_config['text_color']};
    font-family: {theme_config['font_family']};
}}
.slide h1 {{
    color: {theme_config['title_color']};
}}
.slide a {{
    color: {theme_config['accent_color']};
}}
"""
    
    def generate_slides_sync(
        self,
        topic: str,
        outline: List[Dict[str, Any]],
        theme: str = "professional"
    ) -> Dict[str, Any]:
        """Generate all slides synchronously"""
        
        slides = []
        for slide_info in outline:
            slide_html = self.generate_slide_html(slide_info, theme)
            slides.append(slide_html)
        
        return {
            "success": True,
            "topic": topic,
            "theme": theme,
            "slides": slides,
            "total_slides": len(slides)
        }
    
    async def generate_slides_stream(
        self,
        topic: str,
        outline: List[Dict[str, Any]],
        theme: str = "professional"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate slides with streaming"""
        
        yield {
            "type": "start",
            "topic": topic,
            "total_slides": len(outline)
        }
        
        for i, slide_info in enumerate(outline):
            yield {
                "type": "progress",
                "slide_number": i + 1,
                "message": f"Generating slide {i + 1}..."
            }
            
            slide_html = self.generate_slide_html(slide_info, theme)
            
            yield {
                "type": "slide",
                "slide_number": i + 1,
                "slide": slide_html
            }
        
        yield {
            "type": "complete",
            "total_slides": len(outline),
            "message": "All slides generated!"
        }


# Singleton instance
_generator_instance = None


def get_code_slide_generator() -> CodeSlideGenerator:
    """Get or create CodeSlideGenerator instance"""
    global _generator_instance
    if _generator_instance is None:
        _generator_instance = CodeSlideGenerator()
    return _generator_instance


# Test
if __name__ == "__main__":
    generator = get_code_slide_generator()
    
    test_outline = [
        {"slide_number": 1, "type": "title", "title": "Introduction to AI", "content": ["Subtitle"]},
        {"slide_number": 2, "type": "content", "title": "What is AI?", "content": ["Point 1", "Point 2", "Point 3"]}
    ]
    
    result = generator.generate_slides_sync("AI Introduction", test_outline, "dark")
    print(f"Generated {result['total_slides']} slides")
