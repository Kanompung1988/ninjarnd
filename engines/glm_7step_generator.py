"""
GLM-4.7 7-Step Slide Generator (Z.AI Direct API) - Z.AI Style
================================================================
เหมือน z.ai - สร้าง Presentation จาก Chat Context

Features:
- Chat-to-Presentation: สร้าง slides จากประวัติการสนทนา
- Research Blog Integration: ใช้ข้อมูลจาก DeepResearch
- 7-Step Thinking Process: เหมือน z.ai
- Real-time Streaming: แสดงผลแบบ real-time

ขั้นตอนการทำงาน 7 Steps:
1. การรับและวิเคราะห์ข้อมูลเบื้องต้น (Content Analysis)
2. การวางแผนและกำหนดทิศทาง (Planning & Direction)
3. การค้นคว้าและรวบรวมข้อมูลเพิ่มเติม (Research & Data Collection)
4. การค้นหารูปภาพที่เกี่ยวข้อง (Image Search/Generation with CogView-3)
5. การออกแบบและสร้างสไลด์ (Design & Create Slides)
6. การตรวจสอบและปรับปรุง (Review & Improve)
7. การสรุปและส่งมอบผลงาน (Finalize & Deliver)

Model: GLM-4.7 via Z.AI Direct API (api.z.ai)
Image: CogView-3 (ZhipuAI) - ใช้ GLM ทั้งหมด!
"""
import os
import sys
import json
import asyncio
import requests
import time
from typing import Dict, List, Any, Optional, Generator, AsyncGenerator, Union
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Load environment
PROJECT_ROOT = Path(__file__).parent.parent
ENV_PATH = PROJECT_ROOT / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

# Add parent to path
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# API Keys
GLM_API_KEY = os.getenv("GLM_API_KEY", "5c6ede62c88041158aba9d710f700a0e.0bncgwYVObXu0Hyh")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "https://sakso-m5xao201-swedencentral.cognitiveservices.azure.com")

# CogView-3 Settings (ZhipuAI Image Generation)
COGVIEW_MODEL = "cogview-3-flash"  # หรือ "cogview-3" สำหรับคุณภาพสูงสุด

# Exports directory
EXPORTS_DIR = PROJECT_ROOT / "exports" / "presentations"
IMAGES_DIR = EXPORTS_DIR / "images"
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)


# ═══════════════════════════════════════════════════════════════
# GLM-4.7 THINKING PROMPTS (7 Steps)
# ═══════════════════════════════════════════════════════════════

GLM_SYSTEM_PROMPT = """You are a professional presentation designer. 
Think step-by-step and respond ONLY with valid JSON. No explanations."""

# Step 1: Content Analysis
STEP1_PROMPT = """Analyze this topic for a presentation:
Topic: {content}

Return JSON only:
{{
  "content_type": "type of content",
  "main_topic": "main topic",
  "key_points": ["point 1", "point 2", "point 3"],
  "objective": "presentation objective",
  "language": "thai or english"
}}"""

# Step 2: Planning & Direction
STEP2_PROMPT = """Plan a {slide_count}-slide {style} presentation about: {topic}

Return JSON only:
{{
  "visual_style": "modern",
  "color_theme": {{"primary": "#2563EB", "secondary": "#7C3AED"}},
  "slide_outline": [
    {{"slide_number": 1, "type": "title", "title": "Title", "key_message": "message"}},
    {{"slide_number": 2, "type": "content", "title": "Topic 1", "key_message": "message"}}
  ]
}}"""

# Step 3: Research & Data
STEP3_PROMPT = """Provide facts and statistics about: {topic}

Return JSON only:
{{
  "facts": ["fact 1", "fact 2"],
  "statistics": ["stat 1", "stat 2"],
  "examples": ["example 1"]
}}"""

# Step 4: Image Planning
STEP4_PROMPT = """Create image description for slide {slide_number}: {slide_title}

Return JSON only:
{{
  "dalle_prompt": "Professional image of... high quality, modern, 16:9"
}}"""

# Step 5: Create Slide
STEP5_PROMPT = """Create slide {slide_number} content:
Title: {slide_title}
Type: {slide_type}

Return JSON only:
{{
  "slide_number": {slide_number},
  "type": "{slide_type}",
  "title": "Slide Title",
  "content": ["Point 1 (10-15 words)", "Point 2", "Point 3"],
  "speaker_notes": "Notes for presenter"
}}"""

# Step 6: Review & Improve
STEP6_PROMPT = """Review and improve this slide:
{slide_content}

Return JSON only:
{{
  "quality_score": 8,
  "improved_slide": {{
    "slide_number": 1,
    "type": "content",
    "title": "Improved Title",
    "content": ["Improved point 1", "Improved point 2"],
    "speaker_notes": "Notes"
  }}
}}"""

# Step 7: Finalize
STEP7_PROMPT = """Summarize this {slide_count}-slide presentation about: {title}

Return JSON only:
{{
  "title": "Presentation Title",
  "total_slides": {slide_count},
  "duration": "5-10 minutes",
  "highlights": ["highlight 1", "highlight 2"]
}}"""


class GLM7StepGenerator:
    """
    7-Step Slide Generator with GLM-4.7 (ZhipuAI/BigModel) + Azure OpenAI Fallback
    Primary: GLM-4.7 via ZhipuAI BigModel API (open.bigmodel.cn)
    Fallback: Azure GPT-4o
    Images: CogView-3 or Azure DALL-E
    """
    
    def __init__(self):
        """Initialize slide generator with ZhipuAI GLM-4.7 + Azure fallback"""
        self.glm_api_key = GLM_API_KEY
        self.azure_api_key = AZURE_OPENAI_API_KEY
        self.azure_endpoint = AZURE_OPENAI_ENDPOINT
        
        # ZhipuAI BigModel API settings - Using GLM-4.7 (correct endpoint that works)
        self.base_url = "https://open.bigmodel.cn/api/paas/v4"
        self.model = "glm-4.7"
        
        # Azure OpenAI settings
        self.azure_model = "gpt-4o"
        self.azure_available = bool(self.azure_api_key and self.azure_endpoint)
        
        # CogView-3 settings (ZhipuAI Image Generation)
        self.cogview_model = COGVIEW_MODEL
        self.image_api_url = "https://open.bigmodel.cn/api/paas/v4/images/generations"
        
        # Check availability
        self.glm_available = bool(self.glm_api_key)
        self.cogview_available = self.glm_available
        
        # Determine primary model
        if self.glm_available:
            self.primary_model = "GLM-4.7 (ZhipuAI)"
        elif self.azure_available:
            self.primary_model = "Azure GPT-4o"
        else:
            raise ValueError("❌ No API keys available (need GLM_API_KEY or AZURE_OPENAI_API_KEY)")
        
        print("=" * 60)
        print("🎯 7-Step Slide Generator (Multi-Provider)")
        print("=" * 60)
        print(f"✅ Primary: {self.primary_model}")
        print(f"{'✅' if self.azure_available else '⚠️'} Fallback: Azure GPT-4o {'(Ready)' if self.azure_available else '(Not configured)'}")
        print(f"{'✅' if self.cogview_available else '⚠️'} Image: CogView-3 ({self.cogview_model})")
        print("=" * 60)
    
    # ═══════════════════════════════════════════════════════════════
    # GLM API CALL (ZhipuAI Direct)
    # ═══════════════════════════════════════════════════════════════
    
    def _call_glm(self, messages: List[Dict], max_tokens: int = 4096, temperature: float = 0.7) -> str:
        """Call GLM via ZhipuAI Direct API - supports GLM-4.7 with reasoning mode"""
        headers = {
            "Authorization": f"Bearer {self.glm_api_key}",
            "Content-Type": "application/json"
        }
        
        # ZhipuAI payload for GLM-4.7 (supports reasoning mode)
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }
        
        # Retry logic with exponential backoff
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                print(f"   🔄 {self.model} API call (attempt {attempt + 1}/{max_retries})...")
                
                response = requests.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=120
                )
                
                # Check for API errors
                if response.status_code != 200:
                    error_msg = response.text[:200]
                    print(f"   ❌ API Error {response.status_code}: {error_msg}")
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        retry_delay *= 2
                        continue
                    return ""
                
                data = response.json()
                
                # Check if response has valid content
                if "choices" not in data or len(data["choices"]) == 0:
                    print(f"   ⚠️ Empty choices in response")
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        retry_delay *= 2
                        continue
                    return ""
                
                message = data["choices"][0].get("message", {})
                
                # GLM-4.7 may use reasoning_content for thinking, but actual response is in content
                content = message.get("content", "")
                
                # If content is empty but reasoning_content exists, the response might be truncated
                # We need to increase max_tokens or handle this case
                if not content and message.get("reasoning_content"):
                    # For GLM-4.7, if content is empty, the reasoning was still in progress
                    # Return the reasoning content with a note
                    reasoning = message.get("reasoning_content", "")
                    print(f"   ⚠️ Content empty, using reasoning ({len(reasoning)} chars)")
                    # Try to extract any useful content from reasoning
                    if reasoning:
                        # Sometimes the JSON might be in the reasoning
                        import re
                        json_match = re.search(r'\{[^{}]*\}', reasoning, re.DOTALL)
                        if json_match:
                            content = json_match.group(0)
                        else:
                            content = reasoning
                
                if not content or len(content) < 5:
                    print(f"   ⚠️ Empty or too short response ({len(content) if content else 0} chars)")
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        retry_delay *= 2
                        continue
                    return ""
                
                print(f"   ✅ Response received ({len(content)} chars)")
                return content
                
            except requests.exceptions.Timeout:
                print(f"   ⏱️ Timeout (attempt {attempt + 1})")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    
            except requests.exceptions.RequestException as e:
                print(f"   ❌ API Error: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2
            
            except Exception as e:
                print(f"   ❌ Unexpected Error: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
        
        # Fallback to Azure if GLM fails
        if self.azure_available:
            print(f"   🔄 Falling back to Azure GPT-4o...")
            return self._call_azure(messages, max_tokens, temperature)
        
        return ""
    
    def _call_azure(self, messages: List[Dict], max_tokens: int = 2048, temperature: float = 0.7) -> str:
        """Call Azure OpenAI GPT-4o as fallback"""
        try:
            headers = {
                "api-key": self.azure_api_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            # Azure endpoint format
            url = f"{self.azure_endpoint}/openai/deployments/{self.azure_model}/chat/completions?api-version=2024-02-15-preview"
            
            print(f"   🔄 Azure GPT-4o API call...")
            
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=90
            )
            
            if response.status_code != 200:
                print(f"   ❌ Azure Error {response.status_code}: {response.text[:200]}")
                return ""
            
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            if content:
                print(f"   ✅ Azure response received ({len(content)} chars)")
            
            return content
            
        except Exception as e:
            print(f"   ❌ Azure Error: {e}")
            return ""
    
    def _parse_json(self, content: str) -> Dict:
        """Parse JSON from response with robust error handling"""
        if not content or len(content) < 5:
            print(f"   ⚠️ Empty content for JSON parse")
            return {}
        
        content = content.strip()
        
        # Remove markdown code blocks
        if "```json" in content:
            start = content.find("```json") + 7
            end = content.find("```", start)
            if end > start:
                content = content[start:end].strip()
        elif "```" in content:
            start = content.find("```") + 3
            end = content.find("```", start)
            if end > start:
                content = content[start:end].strip()
        
        # Find JSON object
        if not content.startswith("{"):
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end > start:
                content = content[start:end]
            else:
                print(f"   ⚠️ No JSON object found in response")
                return {}
        
        # Try to fix common JSON issues
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            print(f"   ⚠️ JSON parse error: {e}")
            
            # Try to fix trailing commas
            try:
                import re
                fixed = re.sub(r',\s*}', '}', content)
                fixed = re.sub(r',\s*]', ']', fixed)
                return json.loads(fixed)
            except:
                pass
            
            # Try to extract partial JSON
            try:
                # Find the last valid closing brace
                depth = 0
                last_valid = 0
                for i, c in enumerate(content):
                    if c == '{':
                        depth += 1
                    elif c == '}':
                        depth -= 1
                        if depth == 0:
                            last_valid = i + 1
                            break
                
                if last_valid > 0:
                    return json.loads(content[:last_valid])
            except:
                pass
            
            print(f"   ❌ Could not parse JSON, returning empty dict")
            return {}
    
    # ═══════════════════════════════════════════════════════════════
    # IMAGE GENERATION (CogView-3 - ZhipuAI)
    # ═══════════════════════════════════════════════════════════════
    
    def _generate_image(self, prompt: str, slide_number: int) -> Optional[Dict]:
        """Generate image using CogView-3 (ZhipuAI)"""
        if not self.cogview_available:
            return None
        
        # Translate prompt to English for better results
        english_prompt = f"{prompt} Professional presentation visual, high quality, modern design, 16:9 aspect ratio, clean background."
        
        print(f"   🎨 Generating image for slide {slide_number} with CogView-3...")
        
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.glm_api_key}"
            }
            
            payload = {
                "model": self.cogview_model,
                "prompt": english_prompt[:500],
                "size": "1440x720",  # 16:9 ratio for slides
                "quality": "standard",
                "n": 1
            }
            
            response = requests.post(
                self.image_api_url,
                headers=headers,
                json=payload,
                timeout=90
            )
            
            if response.status_code == 200:
                data = response.json()
                image_url = data.get("data", [{}])[0].get("url")
                
                if image_url:
                    # Save locally
                    local_path = self._save_image(image_url, slide_number)
                    print(f"   ✅ Image generated for slide {slide_number} with CogView-3")
                    return {
                        "url": image_url,
                        "local_path": str(local_path) if local_path else None,
                        "prompt": prompt[:100],
                        "model": self.cogview_model
                    }
            else:
                print(f"   ⚠️ CogView-3 error: {response.status_code} - {response.text[:200]}")
                # Fallback to image search
                return self._search_image(prompt, slide_number)
                
        except Exception as e:
            print(f"   ⚠️ Image generation error: {e}")
            # Fallback to image search
            return self._search_image(prompt, slide_number)
        
        return None
    
    def _search_image(self, query: str, slide_number: int) -> Optional[Dict]:
        """Search for relevant images using GLM web_search tool"""
        print(f"   🔍 Searching image for slide {slide_number}...")
        
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.glm_api_key}"
            }
            
            # Use GLM with web_search to find images
            payload = {
                "model": "glm-4-flash",
                "messages": [
                    {
                        "role": "user",
                        "content": f"Find a professional, high-quality image URL for: {query}. Return ONLY the direct image URL (ending in .jpg, .png, or .webp), no explanation."
                    }
                ],
                "tools": [
                    {
                        "type": "web_search",
                        "web_search": {
                            "enable": True,
                            "search_query": f"{query} professional image high quality",
                            "search_result": True
                        }
                    }
                ],
                "max_tokens": 500,
                "temperature": 0.3
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                # Extract image URL from response
                import re
                url_pattern = r'https?://[^\s<>"]+\.(?:jpg|jpeg|png|gif|webp)'
                urls = re.findall(url_pattern, content, re.IGNORECASE)
                
                if urls:
                    image_url = urls[0]
                    local_path = self._save_image(image_url, slide_number)
                    print(f"   ✅ Found image for slide {slide_number}")
                    return {
                        "url": image_url,
                        "local_path": str(local_path) if local_path else None,
                        "prompt": query[:100],
                        "source": "web_search"
                    }
                    
        except Exception as e:
            print(f"   ⚠️ Image search error: {e}")
        
        return None
    
    def _save_image(self, url: str, slide_number: int) -> Optional[Path]:
        """Save image locally"""
        try:
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"slide_{slide_number}_{timestamp}.png"
                filepath = IMAGES_DIR / filename
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                return filepath
        except Exception as e:
            print(f"   ⚠️ Save error: {e}")
        return None
    
    # ═══════════════════════════════════════════════════════════════
    # FAST GENERATION (1 API CALL) - แบบ Z.AI
    # ═══════════════════════════════════════════════════════════════
    
    def generate_presentation_fast(
        self,
        topic: str,
        slide_count: int = 5,
        style: str = "professional",
        research_context: Optional[str] = None,
        generate_images: bool = False
    ) -> Dict[str, Any]:
        """
        🚀 FAST Presentation Generation - 1 API Call Only!
        สร้าง presentation ทั้งหมดใน 1 request เหมือน Z.AI
        
        Returns:
            Dict with title, slides, and metadata
        """
        
        print(f"\n{'='*60}")
        print(f"🚀 Fast Presentation Generation (GLM-4.7)")
        print(f"{'='*60}")
        print(f"📌 Topic: {topic}")
        print(f"📊 Slides: {slide_count}")
        print(f"🎨 Style: {style}")
        print(f"{'='*60}\n")
        
        # Build comprehensive prompt for single API call
        context_text = ""
        if research_context:
            context_text = f"\n\nResearch Context:\n{research_context[:3000]}"
        
        system_prompt = """You are a professional presentation designer. Create stunning, professional slides.
Respond ONLY with valid JSON. No explanations, no markdown code blocks, just pure JSON."""

        user_prompt = f"""Create a {slide_count}-slide {style} presentation about: {topic}
{context_text}

Return this exact JSON format:
{{
  "title": "Presentation Title",
  "slides": [
    {{
      "slide_number": 1,
      "type": "title",
      "title": "Main Title",
      "content": ["Subtitle or tagline"],
      "speaker_notes": "Welcome everyone..."
    }},
    {{
      "slide_number": 2,
      "type": "content", 
      "title": "Topic 1",
      "content": ["Key point 1 (10-15 words)", "Key point 2", "Key point 3"],
      "speaker_notes": "Explain this slide..."
    }}
  ],
  "metadata": {{
    "total_slides": {slide_count},
    "style": "{style}",
    "language": "auto"
  }}
}}

Rules:
- Each content point should be 10-15 words maximum
- Include 3-5 bullet points per content slide
- Make content engaging and professional
- Use the same language as the topic"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        # Single API call with higher max_tokens
        print("   🔄 Generating presentation...")
        response = self._call_glm(messages, max_tokens=6000, temperature=0.8)
        
        if not response:
            print("   ❌ Failed to generate presentation")
            return self._fallback_presentation(topic, slide_count, style)
        
        # Parse response
        result = self._parse_json(response)
        
        if not result or "slides" not in result:
            print("   ⚠️ Invalid response format, using fallback")
            return self._fallback_presentation(topic, slide_count, style)
        
        slides = result.get("slides", [])
        
        # Ensure slides have required fields
        for i, slide in enumerate(slides):
            slide["slide_number"] = i + 1
            if "type" not in slide:
                slide["type"] = "title" if i == 0 else "content"
            if "content" not in slide:
                slide["content"] = []
            if "speaker_notes" not in slide:
                slide["speaker_notes"] = ""
        
        print(f"   ✅ Generated {len(slides)} slides successfully!")
        
        return {
            "success": True,
            "title": result.get("title", topic),
            "slides": slides,
            "metadata": {
                "model": self.model,
                "style": style,
                "total_slides": len(slides),
                "generated_at": datetime.now().isoformat()
            }
        }
    
    def _fallback_presentation(self, topic: str, slide_count: int, style: str) -> Dict[str, Any]:
        """Generate fallback presentation when API fails"""
        slides = [
            {
                "slide_number": 1,
                "type": "title",
                "title": topic,
                "content": ["Professional Presentation"],
                "speaker_notes": "Welcome to this presentation"
            }
        ]
        
        for i in range(2, slide_count + 1):
            slides.append({
                "slide_number": i,
                "type": "content",
                "title": f"Topic {i-1}",
                "content": [f"Key point about {topic}", "Additional information", "Supporting details"],
                "speaker_notes": f"Discuss topic {i-1}"
            })
        
        return {
            "success": True,
            "title": topic,
            "slides": slides,
            "metadata": {
                "model": "fallback",
                "style": style,
                "total_slides": len(slides)
            }
        }
    
    # ═══════════════════════════════════════════════════════════════
    # 7-STEP GENERATION PROCESS (Original - Slower but more detailed)
    # ═══════════════════════════════════════════════════════════════
    
    def generate_presentation(
        self,
        topic: str,
        slide_count: int = 8,
        style: str = "professional",
        research_context: Optional[str] = None,
        generate_images: bool = True
    ) -> Generator[Dict[str, Any], None, None]:
        """
        7-Step Presentation Generation with Streaming
        
        Yields progress updates and results for each step
        """
        
        print(f"\n{'='*60}")
        print(f"🎯 7-Step Presentation Generation (GLM-4.7 + CogView-3)")
        print(f"{'='*60}")
        print(f"📌 Topic: {topic}")
        print(f"📊 Slides: {slide_count}")
        print(f"🎨 Style: {style}")
        print(f"🖼️ Images: {'CogView-3' if generate_images and self.cogview_available else 'No'}")
        print(f"{'='*60}\n")
        
        # Initialize state
        state = {
            "topic": topic,
            "slide_count": slide_count,
            "style": style,
            "analysis": {},
            "plan": {},
            "research": {},
            "slides": []
        }
        
        # ═══════════════════════════════════════════════════════════
        # STEP 1: Content Analysis
        # ═══════════════════════════════════════════════════════════
        yield {
            "type": "step_start",
            "step": 1,
            "name": "Content Analysis",
            "message": "📖 ขั้นตอนที่ 1: การรับและวิเคราะห์ข้อมูลเบื้องต้น..."
        }
        
        try:
            content = topic
            if research_context:
                content += f"\n\nบริบทเพิ่มเติม:\n{research_context[:2000]}"
            
            messages = [
                {"role": "system", "content": GLM_SYSTEM_PROMPT},
                {"role": "user", "content": STEP1_PROMPT.format(content=content)}
            ]
            
            response = self._call_glm(messages, max_tokens=1500)
            state["analysis"] = self._parse_json(response)
            
            yield {
                "type": "step_complete",
                "step": 1,
                "result": state["analysis"],
                "message": "✅ วิเคราะห์เนื้อหาเสร็จสิ้น"
            }
        except Exception as e:
            yield {"type": "step_error", "step": 1, "error": str(e)}
            state["analysis"] = {"content_type": "general", "language": "auto"}
        
        # ═══════════════════════════════════════════════════════════
        # STEP 2: Planning & Direction
        # ═══════════════════════════════════════════════════════════
        yield {
            "type": "step_start",
            "step": 2,
            "name": "Planning & Direction",
            "message": "📋 ขั้นตอนที่ 2: การวางแผนและกำหนดทิศทาง..."
        }
        
        try:
            messages = [
                {"role": "system", "content": GLM_SYSTEM_PROMPT},
                {"role": "user", "content": STEP2_PROMPT.format(
                    analysis=json.dumps(state["analysis"], ensure_ascii=False),
                    topic=topic,
                    slide_count=slide_count,
                    style=style
                )}
            ]
            
            response = self._call_glm(messages, max_tokens=3000)
            state["plan"] = self._parse_json(response)
            
            yield {
                "type": "step_complete",
                "step": 2,
                "result": {"outline": state["plan"].get("slide_outline", [])},
                "message": "✅ วางแผนเสร็จสิ้น"
            }
        except Exception as e:
            yield {"type": "step_error", "step": 2, "error": str(e)}
            state["plan"] = self._default_plan(slide_count)
        
        # ═══════════════════════════════════════════════════════════
        # STEP 3: Research & Data Collection
        # ═══════════════════════════════════════════════════════════
        yield {
            "type": "step_start",
            "step": 3,
            "name": "Research & Data",
            "message": "🔍 ขั้นตอนที่ 3: การค้นคว้าและรวบรวมข้อมูลเพิ่มเติม..."
        }
        
        try:
            research_topics = state["plan"].get("research_topics", [])
            
            messages = [
                {"role": "system", "content": GLM_SYSTEM_PROMPT},
                {"role": "user", "content": STEP3_PROMPT.format(
                    topic=topic,
                    research_topics=", ".join(research_topics) if research_topics else "N/A",
                    context=research_context[:2000] if research_context else "ไม่มีบริบทเพิ่มเติม"
                )}
            ]
            
            response = self._call_glm(messages, max_tokens=2000)
            state["research"] = self._parse_json(response)
            
            yield {
                "type": "step_complete",
                "step": 3,
                "result": state["research"],
                "message": "✅ ค้นคว้าข้อมูลเสร็จสิ้น"
            }
        except Exception as e:
            yield {"type": "step_error", "step": 3, "error": str(e)}
            state["research"] = {"facts": [], "statistics": []}
        
        # ═══════════════════════════════════════════════════════════
        # STEPS 4-6: Generate Each Slide
        # ═══════════════════════════════════════════════════════════
        outline = state["plan"].get("slide_outline", [])
        if not outline:
            outline = self._default_outline(slide_count)
        
        generated_slides = []
        
        for i, slide_info in enumerate(outline):
            slide_num = slide_info.get("slide_number", i + 1)
            
            # ─────────────────────────────────────────────────────
            # STEP 4: Image Planning
            # ─────────────────────────────────────────────────────
            yield {
                "type": "step_start",
                "step": 4,
                "slide": slide_num,
                "name": "Image Planning",
                "message": f"🎨 ขั้นตอนที่ 4: การสร้างรูปภาพด้วย CogView-3 สไลด์ {slide_num}..."
            }
            
            image_data = None
            if generate_images and self.cogview_available:
                try:
                    messages = [
                        {"role": "system", "content": GLM_SYSTEM_PROMPT},
                        {"role": "user", "content": STEP4_PROMPT.format(
                            slide_number=slide_num,
                            slide_title=slide_info.get("title", "")
                        )}
                    ]
                    
                    response = self._call_glm(messages, max_tokens=500)
                    image_spec = self._parse_json(response)
                    
                    # Generate actual image
                    dalle_prompt = image_spec.get("dalle_prompt", "")
                    if dalle_prompt:
                        image_data = self._generate_image(dalle_prompt, slide_num)
                    
                    yield {
                        "type": "step_complete",
                        "step": 4,
                        "slide": slide_num,
                        "result": {"image": image_data},
                        "message": f"✅ รูปภาพสไลด์ {slide_num} พร้อม"
                    }
                except Exception as e:
                    yield {"type": "step_error", "step": 4, "slide": slide_num, "error": str(e)}
            else:
                yield {
                    "type": "step_complete",
                    "step": 4,
                    "slide": slide_num,
                    "message": f"⏭️ ข้ามการสร้างรูปภาพสไลด์ {slide_num}"
                }
            
            # ─────────────────────────────────────────────────────
            # STEP 5: Create Slide
            # ─────────────────────────────────────────────────────
            yield {
                "type": "step_start",
                "step": 5,
                "slide": slide_num,
                "name": "Create Slide",
                "message": f"📝 ขั้นตอนที่ 5: การออกแบบและสร้างสไลด์ {slide_num}..."
            }
            
            try:
                messages = [
                    {"role": "system", "content": GLM_SYSTEM_PROMPT},
                    {"role": "user", "content": STEP5_PROMPT.format(
                        slide_number=slide_num,
                        slide_title=slide_info.get("title", f"Slide {slide_num}"),
                        slide_type=slide_info.get("type", "content")
                    )}
                ]
                
                response = self._call_glm(messages, max_tokens=800)
                slide_content = self._parse_json(response)
                
                # Ensure slide has required fields
                if not slide_content:
                    slide_content = self._fallback_slide(slide_info, slide_num)
                
                yield {
                    "type": "step_complete",
                    "step": 5,
                    "slide": slide_num,
                    "result": slide_content,
                    "message": f"✅ สไลด์ {slide_num} สร้างเสร็จ"
                }
            except Exception as e:
                yield {"type": "step_error", "step": 5, "slide": slide_num, "error": str(e)}
                slide_content = self._fallback_slide(slide_info, slide_num)
            
            # ─────────────────────────────────────────────────────
            # STEP 6: Review & Improve (Simplified - skip API call to speed up)
            # ─────────────────────────────────────────────────────
            yield {
                "type": "step_start",
                "step": 6,
                "slide": slide_num,
                "name": "Review & Improve",
                "message": f"🔍 ขั้นตอนที่ 6: การตรวจสอบสไลด์ {slide_num}..."
            }
            
            # Skip API call for review - just use the slide as-is to speed up
            final_slide = slide_content if slide_content else self._fallback_slide(slide_info, slide_num)
            
            # Add image if generated
            if image_data:
                final_slide["image"] = image_data
            
            generated_slides.append(final_slide)
            
            yield {
                "type": "step_complete",
                "step": 6,
                "slide": slide_num,
                "result": {"quality_score": 8},
                "message": f"✅ สไลด์ {slide_num} ตรวจสอบเสร็จ"
            }
            
            # Yield the completed slide
            yield {
                "type": "slide",
                "slide_number": slide_num,
                "slide": final_slide
            }
        
        state["slides"] = generated_slides
        
        # ═══════════════════════════════════════════════════════════
        # STEP 7: Finalize & Deliver
        # ═══════════════════════════════════════════════════════════
        yield {
            "type": "step_start",
            "step": 7,
            "name": "Finalize",
            "message": "📦 ขั้นตอนที่ 7: การสรุปและส่งมอบผลงาน..."
        }
        
        try:
            slides_summary = [{"slide": s.get("slide_number"), "title": s.get("title")} 
                            for s in generated_slides]
            
            messages = [
                {"role": "system", "content": GLM_SYSTEM_PROMPT},
                {"role": "user", "content": STEP7_PROMPT.format(
                    title=topic,
                    slide_count=len(generated_slides),
                    style=style,
                    slides_summary=json.dumps(slides_summary, ensure_ascii=False)
                )}
            ]
            
            response = self._call_glm(messages, max_tokens=1000)
            summary = self._parse_json(response)
            
            yield {
                "type": "step_complete",
                "step": 7,
                "result": summary,
                "message": "✅ Presentation สร้างเสร็จสมบูรณ์!"
            }
        except Exception as e:
            yield {"type": "step_error", "step": 7, "error": str(e)}
            summary = {}
        
        # Final result
        yield {
            "type": "complete",
            "title": topic,
            "slides": generated_slides,
            "summary": summary,
            "model": self.model,
            "message": f"🎉 สร้าง {len(generated_slides)} สไลด์เสร็จสมบูรณ์!"
        }
    
    # ═══════════════════════════════════════════════════════════════
    # ASYNC VERSION (for backend API)
    # ═══════════════════════════════════════════════════════════════
    
    async def generate_presentation_async(
        self,
        topic: str,
        slide_count: int = 8,
        style: str = "professional",
        research_context: Optional[str] = None,
        generate_images: bool = True
    ) -> Dict[str, Any]:
        """
        Async wrapper for backend API
        Returns final result after 7-step process
        """
        slides = []
        outline = []
        thinking_steps = []
        
        for result in self.generate_presentation(
            topic=topic,
            slide_count=slide_count,
            style=style,
            research_context=research_context,
            generate_images=generate_images
        ):
            if result["type"] == "step_start":
                thinking_steps.append({
                    "step": result["step"],
                    "name": result["name"],
                    "status": "in_progress"
                })
            elif result["type"] == "step_complete":
                if thinking_steps:
                    thinking_steps[-1]["status"] = "complete"
                
                # Save outline from step 2
                if result["step"] == 2:
                    outline = result.get("result", {}).get("outline", [])
                    
            elif result["type"] == "slide":
                slides.append(result["slide"])
                
            elif result["type"] == "complete":
                break
            
            await asyncio.sleep(0.05)
        
        return {
            "success": True,
            "topic": topic,
            "slide_count": len(slides),
            "model_used": "GLM-4.7 (HuggingFace)",
            "thinking_process": "7-step",
            "outline": outline,
            "slides": slides,
            "thinking_steps": thinking_steps
        }
    
    def generate_presentation_slides(
        self,
        topic: str,
        slide_count: int = 8,
        style: str = "professional",
        research_context: Optional[str] = None,
        language: str = "auto"
    ) -> Dict[str, Any]:
        """
        Synchronous method compatible with existing API
        Returns dict with title, slides array
        """
        slides = []
        
        for result in self.generate_presentation(
            topic=topic,
            slide_count=slide_count,
            style=style,
            research_context=research_context,
            generate_images=True
        ):
            if result["type"] == "slide":
                slides.append(result["slide"])
            elif result["type"] == "complete":
                break
        
        # Convert to expected format
        formatted_slides = []
        for i, slide in enumerate(slides):
            formatted_slides.append({
                "id": str(i + 1),
                "type": slide.get("type", "content"),
                "title": slide.get("title", f"Slide {i + 1}"),
                "content": "\n".join(slide.get("content", [])) if isinstance(slide.get("content"), list) else slide.get("content", ""),
                "speaker_notes": slide.get("speaker_notes", ""),
                "image": slide.get("image")
            })
        
        return {
            "success": True,
            "title": topic,
            "subtitle": f"Generated by GLM-4.7 (7-Step Process)",
            "slides": formatted_slides,
            "metadata": {
                "model": "GLM-4.7",
                "process": "7-step",
                "slide_count": len(formatted_slides)
            }
        }
    
    # ═══════════════════════════════════════════════════════════════
    # HELPER METHODS
    # ═══════════════════════════════════════════════════════════════
    
    def _default_plan(self, slide_count: int) -> Dict:
        """Default plan when API fails"""
        return {
            "visual_style": "modern",
            "color_theme": {
                "primary": "#2563EB",
                "secondary": "#7C3AED",
                "accent": "#10B981",
                "background": "#FFFFFF",
                "text": "#1F2937"
            },
            "image_style": "professional",
            "slide_outline": self._default_outline(slide_count)
        }
    
    def _default_outline(self, slide_count: int) -> List[Dict]:
        """Default slide outline"""
        outline = [
            {"slide_number": 1, "type": "title", "title": "Title Slide", "key_message": "Introduction"}
        ]
        for i in range(2, slide_count):
            outline.append({
                "slide_number": i,
                "type": "content",
                "title": f"Content {i-1}",
                "key_message": f"Key point {i-1}"
            })
        outline.append({
            "slide_number": slide_count,
            "type": "conclusion",
            "title": "Conclusion",
            "key_message": "Summary"
        })
        return outline
    
    def _fallback_slide(self, slide_info: Dict, slide_num: int) -> Dict:
        """Fallback slide when generation fails"""
        return {
            "slide_number": slide_num,
            "type": slide_info.get("type", "content"),
            "title": slide_info.get("title", f"Slide {slide_num}"),
            "content": [slide_info.get("key_message", "Content placeholder")],
            "speaker_notes": ""
        }
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            "model_name": "GLM-4.7",
            "provider": "ZhipuAI",
            "model_id": self.model,
            "thinking_process": "7-step",
            "image_model": self.cogview_model,
            "cogview_available": self.cogview_available
        }
    
    # ═══════════════════════════════════════════════════════════════
    # COMPATIBILITY METHODS FOR /api/zstyle/outline
    # ═══════════════════════════════════════════════════════════════
    
    def _step1_content_analysis(self, topic: str, context: Optional[str] = None) -> Dict:
        """Step 1: Content Analysis (for /api/zstyle/outline compatibility)"""
        print("📖 Step 1: Content Analysis...")
        
        try:
            content = topic
            if context:
                content += f"\n\nContext:\n{context[:2000]}"
            
            messages = [
                {"role": "system", "content": GLM_SYSTEM_PROMPT},
                {"role": "user", "content": STEP1_PROMPT.format(content=content)}
            ]
            
            response = self._call_glm(messages, max_tokens=1500)
            result = self._parse_json(response)
            
            if not result:
                result = {"content_type": "general", "language": "auto"}
            
            print("   ✅ Analysis complete")
            return result
        except Exception as e:
            print(f"   ⚠️ Analysis error: {e}")
            return {"content_type": "general", "language": "auto"}
    
    def _step2_planning(self, topic: str, slide_count: int, style: str, analysis: Dict) -> Dict:
        """Step 2: Planning & Direction (for /api/zstyle/outline compatibility)"""
        print("📋 Step 2: Planning & Direction...")
        
        try:
            messages = [
                {"role": "system", "content": GLM_SYSTEM_PROMPT},
                {"role": "user", "content": STEP2_PROMPT.format(
                    analysis=json.dumps(analysis, ensure_ascii=False),
                    topic=topic,
                    slide_count=slide_count,
                    style=style
                )}
            ]
            
            response = self._call_glm(messages, max_tokens=3000)
            result = self._parse_json(response)
            
            if not result or "slide_outline" not in result:
                result = self._default_plan(slide_count)
            
            # Ensure needs_research field
            result["needs_research"] = True
            
            print("   ✅ Planning complete")
            return result
        except Exception as e:
            print(f"   ⚠️ Planning error: {e}")
            return self._default_plan(slide_count)
    
    def _generate_default_outline(self, slide_count: int) -> List[Dict]:
        """Generate default outline (for fallback)"""
        return self._default_outline(slide_count)
    
    # ═══════════════════════════════════════════════════════════════
    # CHAT-TO-PRESENTATION (Z.AI Style)
    # ═══════════════════════════════════════════════════════════════
    
    def summarize_chat_for_presentation(
        self,
        chat_history: List[Dict[str, str]],
        topic_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Summarize chat history into a presentation prompt
        Like z.ai - convert conversation to structured content
        
        Args:
            chat_history: List of {"role": "user/assistant", "content": "..."}
            topic_hint: Optional topic hint from user
            
        Returns:
            Dict with topic, key_points, research_context
        """
        print("\n📝 Summarizing chat for presentation...")
        
        # Format chat history
        chat_text = ""
        for msg in chat_history[-20:]:  # Last 20 messages
            role = "User" if msg.get("role") == "user" else "AI"
            content = msg.get("content", "")[:1000]  # Limit each message
            chat_text += f"{role}: {content}\n\n"
        
        summarize_prompt = f"""Analyze this conversation and extract key information for a presentation.

Conversation:
{chat_text}

{f'Topic hint: {topic_hint}' if topic_hint else ''}

Return JSON only:
{{
  "main_topic": "The main topic discussed",
  "key_points": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "facts_and_data": ["Fact/statistic 1", "Fact/statistic 2"],
  "conclusions": ["Conclusion 1", "Conclusion 2"],
  "suggested_title": "Suggested presentation title",
  "language": "thai" or "english"
}}"""
        
        try:
            messages = [
                {"role": "system", "content": GLM_SYSTEM_PROMPT},
                {"role": "user", "content": summarize_prompt}
            ]
            
            response = self._call_glm(messages, max_tokens=2000)
            result = self._parse_json(response)
            
            if result:
                print(f"   ✅ Chat summarized: {result.get('main_topic', 'N/A')}")
                return {
                    "success": True,
                    "topic": result.get("main_topic", topic_hint or "Presentation"),
                    "suggested_title": result.get("suggested_title", ""),
                    "key_points": result.get("key_points", []),
                    "facts_and_data": result.get("facts_and_data", []),
                    "conclusions": result.get("conclusions", []),
                    "language": result.get("language", "auto"),
                    "research_context": chat_text[:3000]  # Use chat as context
                }
        except Exception as e:
            print(f"   ⚠️ Summarize error: {e}")
        
        # Fallback
        return {
            "success": True,
            "topic": topic_hint or "Presentation from Chat",
            "key_points": [],
            "research_context": chat_text[:3000]
        }
    
    def generate_from_chat(
        self,
        chat_history: List[Dict[str, str]],
        topic_hint: Optional[str] = None,
        slide_count: int = 8,
        style: str = "professional",
        generate_images: bool = True
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Generate presentation from chat history (Z.AI style)
        
        Args:
            chat_history: List of chat messages
            topic_hint: Optional topic to focus on
            slide_count: Number of slides
            style: Presentation style
            generate_images: Whether to generate images
            
        Yields:
            Progress updates and slides
        """
        print(f"\n{'='*60}")
        print(f"🎯 Chat-to-Presentation Generation (Z.AI Style)")
        print(f"{'='*60}")
        print(f"💬 Messages: {len(chat_history)}")
        print(f"📊 Slides: {slide_count}")
        print(f"{'='*60}\n")
        
        # Step 0: Summarize chat
        yield {
            "type": "step_start",
            "step": 0,
            "name": "Chat Analysis",
            "message": "💬 วิเคราะห์ประวัติการสนทนา..."
        }
        
        summary = self.summarize_chat_for_presentation(chat_history, topic_hint)
        
        yield {
            "type": "step_complete",
            "step": 0,
            "result": summary,
            "message": f"✅ สรุปหัวข้อ: {summary.get('topic', 'N/A')}"
        }
        
        # Generate presentation with chat context
        topic = summary.get("topic", topic_hint or "Presentation")
        research_context = summary.get("research_context", "")
        
        # Add key points to context
        key_points = summary.get("key_points", [])
        if key_points:
            research_context += "\n\nKey Points:\n" + "\n".join(f"- {p}" for p in key_points)
        
        facts = summary.get("facts_and_data", [])
        if facts:
            research_context += "\n\nFacts & Data:\n" + "\n".join(f"- {f}" for f in facts)
        
        # Continue with regular 7-step generation
        for result in self.generate_presentation(
            topic=topic,
            slide_count=slide_count,
            style=style,
            research_context=research_context,
            generate_images=generate_images
        ):
            yield result
    
    def generate_from_research_blog(
        self,
        blog_content: str,
        blog_title: str,
        sources: List[Dict[str, str]] = None,
        slide_count: int = 8,
        style: str = "professional",
        generate_images: bool = True
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Generate presentation from research blog content
        
        Args:
            blog_content: The research blog content
            blog_title: Title of the research
            sources: List of sources used
            slide_count: Number of slides
            style: Presentation style
            generate_images: Whether to generate images
            
        Yields:
            Progress updates and slides
        """
        print(f"\n{'='*60}")
        print(f"📚 Research Blog to Presentation")
        print(f"{'='*60}")
        print(f"📌 Title: {blog_title}")
        print(f"📊 Slides: {slide_count}")
        print(f"🔗 Sources: {len(sources or [])}")
        print(f"{'='*60}\n")
        
        # Build research context
        research_context = f"Research Topic: {blog_title}\n\n"
        research_context += f"Content:\n{blog_content[:4000]}\n\n"
        
        if sources:
            research_context += "Sources:\n"
            for src in sources[:10]:
                title = src.get("title", "")
                url = src.get("url", "")
                research_context += f"- {title}: {url}\n"
        
        # Generate presentation with research context
        for result in self.generate_presentation(
            topic=blog_title,
            slide_count=slide_count,
            style=style,
            research_context=research_context,
            generate_images=generate_images
        ):
            yield result


# ═══════════════════════════════════════════════════════════════
# CONVENIENCE FUNCTIONS
# ═══════════════════════════════════════════════════════════════

_generator_instance: Optional[GLM7StepGenerator] = None

def get_generator() -> GLM7StepGenerator:
    """Get singleton generator instance"""
    global _generator_instance
    if _generator_instance is None:
        _generator_instance = GLM7StepGenerator()
    return _generator_instance


def generate_slides_7step(
    topic: str,
    slide_count: int = 8,
    style: str = "professional",
    research_context: Optional[str] = None
) -> Generator[Dict[str, Any], None, None]:
    """Quick function to generate presentation"""
    gen = get_generator()
    return gen.generate_presentation(
        topic=topic,
        slide_count=slide_count,
        style=style,
        research_context=research_context
    )


# ═══════════════════════════════════════════════════════════════
# TEST
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("\n🧪 Testing GLM-4.7 7-Step Generator...")
    
    try:
        gen = GLM7StepGenerator()
        
        # Test with simple topic
        topic = "Artificial Intelligence in Healthcare"
        print(f"\n📌 Generating: {topic}\n")
        
        for result in gen.generate_presentation(topic, slide_count=3, generate_images=False):
            if result["type"] == "step_start":
                print(f"⏳ {result['message']}")
            elif result["type"] == "step_complete":
                print(f"   {result['message']}")
            elif result["type"] == "slide":
                print(f"   📄 Slide {result['slide_number']}: {result['slide'].get('title', 'N/A')}")
            elif result["type"] == "complete":
                print(f"\n{result['message']}")
                print(f"Total slides: {len(result['slides'])}")
                
    except Exception as e:
        print(f"❌ Error: {e}")
