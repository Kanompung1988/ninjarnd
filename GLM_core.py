"""
GLM-4.6 Core Module
===================
Z.AI GLM-4.6 adapter for NINJA Research System
- Superior coding and reasoning performance
- 200K context window
- Advanced tool use and agentic capabilities
"""
import os
import json
import requests
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from pathlib import Path

# Load .env from project root
PROJECT_ROOT = Path(__file__).parent
ENV_PATH = PROJECT_ROOT / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)


class GLMCore:
    """
    GLM-4.6 API Client for Z.AI
    
    Features:
    - 200K token context window
    - Superior reasoning and coding
    - Advanced tool use support
    - Efficient token consumption
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize GLM-4.6 client"""
        self.api_key = api_key or os.getenv("GLM_API_KEY")
        if not self.api_key:
            raise ValueError("GLM_API_KEY is required")
        
        self.base_url = "https://api.z.ai/api/paas/v4"
        self.model = "glm-4.6"
        
        print("✅ GLM-4.6 Core initialized")
        print(f"   Model: {self.model}")
        print(f"   Context: 200K tokens")
        print(f"   Max Output: 128K tokens")
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 1.0,
        max_tokens: int = 4096,
        thinking_enabled: bool = True,
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Send chat completion request to GLM-4.6
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0 - 2.0)
            max_tokens: Maximum tokens to generate
            thinking_enabled: Enable thinking mode for better reasoning
            stream: Enable streaming response
            
        Returns:
            Response dict with 'content' and metadata
        """
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "thinking": {
                "type": "enabled" if thinking_enabled else "disabled"
            },
            "stream": stream
        }
        
        # Add any additional parameters
        payload.update(kwargs)
        
        # Retry logic for connection issues
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                if stream:
                    return self._stream_chat(headers, payload)
                else:
                    print(f"🔄 Attempt {attempt + 1}/{max_retries} - Calling GLM-4.6 API...")
                    response = requests.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                        timeout=30  # Shorter timeout with retries
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    print(f"✅ GLM-4.6 API response received")
                    
                    return {
                        "content": data["choices"][0]["message"]["content"],
                        "model": data.get("model", self.model),
                        "usage": data.get("usage", {}),
                        "finish_reason": data["choices"][0].get("finish_reason"),
                        "thinking": data["choices"][0]["message"].get("thinking")
                    }
                    
            except requests.exceptions.Timeout as e:
                print(f"⏱️  Timeout on attempt {attempt + 1}/{max_retries}")
                if attempt < max_retries - 1:
                    print(f"   Retrying in {retry_delay} seconds...")
                    import time
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    print(f"❌ All retries exhausted")
                    raise Exception(f"GLM-4.6 API timeout after {max_retries} attempts")
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ GLM-4.6 API Error (attempt {attempt + 1}): {e}")
                if hasattr(e, 'response') and e.response is not None:
                    print(f"   Response: {e.response.text[:200]}")
                if attempt < max_retries - 1:
                    print(f"   Retrying in {retry_delay} seconds...")
                    import time
                    time.sleep(retry_delay)
                else:
                    raise Exception(f"GLM-4.6 API error: {str(e)}")
    
    def _stream_chat(self, headers: dict, payload: dict):
        """Handle streaming chat responses"""
        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload,
            stream=True,
            timeout=120
        )
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data_str = line_str[6:]
                    if data_str.strip() == '[DONE]':
                        break
                    try:
                        data = json.loads(data_str)
                        yield data
                    except json.JSONDecodeError:
                        continue
    
    def generate_presentation_plan(
        self,
        topic: str,
        slide_count: int = 8,
        style: str = "professional",
        research_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate strategic presentation plan using GLM-4.6 thinking mode
        
        This uses GLM-4.6's advanced reasoning to create a well-structured
        presentation outline with strategic insights.
        """
        system_prompt = f"""You are an expert presentation strategist and content designer.

Your task is to create a strategic presentation plan that is:
1. **Engaging** - Captures audience attention from start to finish
2. **Well-structured** - Logical flow with clear narrative arc
3. **Professional** - Appropriate for {style} settings
4. **Data-driven** - Uses insights and evidence effectively
5. **Visual** - Designed for visual impact with images and charts

Context Window: You have 200K tokens available, use it wisely for comprehensive planning."""

        user_prompt = f"""Create a strategic presentation plan for:

**Topic:** {topic}
**Slide Count:** {slide_count} slides
**Style:** {style}

{"**Research Context:**" + chr(10) + research_context if research_context else ""}

Generate a JSON plan with this structure:
{{
  "title": "Main presentation title",
  "strategic_approach": "Overall strategy and narrative arc",
  "target_audience": "Who this presentation is for",
  "key_messages": ["Key message 1", "Key message 2", "Key message 3"],
  "slides": [
    {{
      "slide_number": 1,
      "type": "title",
      "title": "Slide title",
      "strategic_purpose": "Why this slide matters",
      "content_brief": "What content to include",
      "visual_suggestion": "Image or chart recommendation",
      "talking_points": ["Point 1", "Point 2"]
    }}
  ]
}}

Use your 200K context window to think deeply about the best structure."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        print("🧠 GLM-4.6 Thinking: Generating strategic plan...")
        result = self.chat(
            messages=messages,
            temperature=0.7,
            max_tokens=8192,
            thinking_enabled=True
        )
        
        # Extract JSON from response
        content = result["content"]
        try:
            # Find JSON in response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                plan = json.loads(json_str)
                return {
                    "plan": plan,
                    "thinking": result.get("thinking"),
                    "usage": result.get("usage")
                }
        except json.JSONDecodeError:
            pass
        
        # If JSON extraction fails, return raw content
        return {
            "plan": {"raw_content": content},
            "thinking": result.get("thinking"),
            "usage": result.get("usage")
        }
    
    def generate_slide_content(
        self,
        slide_brief: Dict[str, Any],
        overall_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate detailed slide content based on strategic plan
        
        Uses GLM-4.6's superior writing and reasoning capabilities.
        """
        system_prompt = """You are a master presentation content writer.

Your writing is:
- Clear and concise
- Engaging and memorable
- Professionally formatted
- Optimized for visual presentation
- Data-driven when appropriate"""

        user_prompt = f"""Create detailed content for this slide:

**Slide Type:** {slide_brief.get('type', 'content')}
**Title:** {slide_brief.get('title', '')}
**Purpose:** {slide_brief.get('strategic_purpose', '')}
**Brief:** {slide_brief.get('content_brief', '')}

**Overall Context:**
- Presentation: {overall_context.get('title', '')}
- Target Audience: {overall_context.get('target_audience', '')}
- Key Messages: {', '.join(overall_context.get('key_messages', []))}

Generate content in this JSON format:
{{
  "title": "Slide title",
  "content": "Main content (use markdown formatting)",
  "bullet_points": ["Point 1", "Point 2", "Point 3"],
  "visual_elements": {{
    "image_prompt": "DALL-E prompt for slide image",
    "chart_type": "bar/pie/line if applicable",
    "chart_data": {{}} if applicable
  }},
  "speaker_notes": "What to say when presenting this slide"
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        result = self.chat(
            messages=messages,
            temperature=0.8,
            max_tokens=2048,
            thinking_enabled=True
        )
        
        # Extract JSON
        content = result["content"]
        try:
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                slide_content = json.loads(json_str)
                return slide_content
        except json.JSONDecodeError:
            pass
        
        # Fallback
        return {
            "title": slide_brief.get('title', 'Untitled'),
            "content": content,
            "bullet_points": [],
            "visual_elements": {},
            "speaker_notes": ""
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
        Generate complete presentation slides using GLM-4.6
        
        Args:
            topic: Presentation topic
            slide_count: Number of slides to generate
            style: Presentation style (professional, creative, minimalist, academic)
            research_context: Optional research context for enhanced content
            language: Output language (auto, th, en)
            
        Returns:
            Dict with title and slides array
        """
        
        # Detect language from topic
        has_thai = any('\u0E00' <= char <= '\u0E7F' for char in topic)
        lang_instruction = ""
        if language == "auto":
            if has_thai:
                lang_instruction = "Generate ALL content in Thai language (ภาษาไทย)."
            else:
                lang_instruction = "Generate ALL content in English language."
        elif language == "th":
            lang_instruction = "Generate ALL content in Thai language (ภาษาไทย)."
        else:
            lang_instruction = "Generate ALL content in English language."
        
        system_prompt = f"""You are an expert presentation designer specializing in creating impactful, professional slides using GLM-4.6's superior reasoning and content generation capabilities.

Your task: Generate a complete {slide_count}-slide presentation on the topic: "{topic}"

Style: {style}
{lang_instruction}

CRITICAL REQUIREMENTS:
1. Return ONLY a valid JSON object - NO markdown, NO code blocks, NO explanations
2. Use this EXACT structure:
{{
  "title": "Presentation Title",
  "slides": [
    {{
      "type": "title",
      "title": "Main Title",
      "subtitle": "Subtitle or tagline"
    }},
    {{
      "type": "content",
      "title": "Slide Title",
      "content": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
      "notes": "Speaker notes (optional)"
    }},
    {{
      "type": "two-column",
      "title": "Slide Title",
      "leftContent": ["Left bullet 1", "Left bullet 2"],
      "rightContent": ["Right bullet 1", "Right bullet 2"],
      "notes": "Speaker notes (optional)"
    }},
    {{
      "type": "image-text",
      "title": "Slide Title",
      "content": ["Description of visual concept"],
      "imagePrompt": "Detailed DALL-E prompt for image generation",
      "notes": "Speaker notes (optional)"
    }},
    {{
      "type": "conclusion",
      "title": "Conclusion Title",
      "content": ["Key takeaway 1", "Key takeaway 2", "Call to action"],
      "notes": "Closing remarks"
    }}
  ]
}}

SLIDE TYPES:
- title: Opening slide with title and subtitle
- content: Standard bullet points (3-5 points max)
- two-column: Split content into left/right columns
- image-text: Slide with image placeholder and description
- conclusion: Final slide with key takeaways

CONTENT GUIDELINES:
- Each bullet point: 10-15 words maximum
- Slide titles: Clear and concise (5-8 words)
- Use active voice and powerful verbs
- Focus on insights, not just facts
- Include speaker notes for context
- For image-text slides: Write detailed, specific DALL-E prompts

STRUCTURE:
1. First slide: title type (introduction)
2. Middle slides: Mix of content, two-column, and image-text
3. Last slide: conclusion type (summary + CTA)

""" + (f"RESEARCH CONTEXT:\n{research_context[:3000]}" if research_context else "") + """

Remember: Return ONLY the JSON object. Start with { and end with }. No other text."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Generate a {slide_count}-slide presentation about: {topic}"}
        ]
        
        print(f"🎨 GLM-4.6 generating {slide_count} slides for: {topic}")
        
        # Use thinking mode for complex presentations
        use_thinking = slide_count > 10 or bool(research_context)
        
        try:
            result = self.chat(
                messages=messages,
                temperature=0.7,
                max_tokens=8000,
                thinking_enabled=use_thinking
            )
        except Exception as api_error:
            print(f"⚠️  GLM-4.6 API call failed: {api_error}")
            print(f"📝 Using fallback: Generating structure locally")
            
            # Fallback: Generate structure without API
            return self._generate_fallback_presentation(topic, slide_count, style, has_thai)
        
        # Parse JSON response
        try:
            content = result["content"].strip()
            
            # Remove markdown code blocks if present
            if content.startswith("```"):
                # Find the first { and last }
                start_idx = content.find("{")
                end_idx = content.rfind("}")
                if start_idx != -1 and end_idx != -1:
                    content = content[start_idx:end_idx + 1]
            
            slides_data = json.loads(content)
            
            # Validate structure
            if "slides" not in slides_data or not isinstance(slides_data["slides"], list):
                raise ValueError("Invalid slides structure")
            
            print(f"✅ GLM-4.6 generated {len(slides_data['slides'])} slides successfully")
            
            return {
                "success": True,
                "title": slides_data.get("title", topic),
                "slides": slides_data["slides"],
                "model": self.model,
                "metadata": {
                    "slide_count": len(slides_data["slides"]),
                    "style": style,
                    "used_research": bool(research_context),
                    "language": "th" if has_thai else "en",
                    "usage": result.get("usage", {})
                }
            }
            
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON from GLM response")
            print(f"   Raw content: {result['content'][:500]}...")
            raise Exception(f"Invalid JSON response from GLM-4.6: {str(e)}")
    
    def _generate_fallback_presentation(
        self,
        topic: str,
        slide_count: int,
        style: str,
        is_thai: bool
    ) -> Dict[str, Any]:
        """Generate a basic presentation structure when API fails"""
        print(f"🔧 Generating fallback presentation structure")
        
        slides = []
        
        # Title slide
        slides.append({
            "id": "1",
            "type": "title",
            "title": topic if not is_thai else f"การนำเสนอ: {topic}",
            "subtitle": "Generated Presentation" if not is_thai else "งานนำเสนอที่สร้างโดยอัตโนมัติ"
        })
        
        # Content slides
        for i in range(2, slide_count):
            slides.append({
                "id": str(i),
                "type": "content",
                "title": f"Key Point {i-1}" if not is_thai else f"ประเด็นสำคัญที่ {i-1}",
                "content": [
                    f"Main insight about {topic}" if not is_thai else f"ข้อมูลเชิงลึกเกี่ยวกับ {topic}",
                    f"Supporting evidence and analysis" if not is_thai else "หลักฐานและการวิเคราะห์สนับสนุน",
                    f"Strategic implications" if not is_thai else "ผลกระทบเชิงกลยุทธ์",
                    f"Action items and recommendations" if not is_thai else "แนวทางปฏิบัติและข้อเสนอแนะ"
                ]
            })
        
        # Conclusion slide
        slides.append({
            "id": str(slide_count),
            "type": "conclusion",
            "title": "Conclusion" if not is_thai else "สรุป",
            "content": [
                f"Summary of key findings about {topic}" if not is_thai else f"สรุปประเด็นสำคัญเกี่ยวกับ {topic}",
                "Next steps and recommendations" if not is_thai else "ขั้นตอนต่อไปและข้อเสนอแนะ",
                "Thank you" if not is_thai else "ขอบคุณครับ/ค่ะ"
            ]
        })
        
        return {
            "success": True,
            "title": topic,
            "slides": slides,
            "model": "glm-4.6-fallback",
            "metadata": {
                "slide_count": len(slides),
                "style": style,
                "used_research": False,
                "language": "th" if is_thai else "en",
                "fallback": True
            }
        }


# Convenience functions
def glm_chat(messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
    """Quick chat with GLM-4.6"""
    client = GLMCore()
    return client.chat(messages=messages, **kwargs)


def glm_generate_text(prompt: str, **kwargs) -> str:
    """Generate text from a single prompt"""
    client = GLMCore()
    result = client.chat(
        messages=[{"role": "user", "content": prompt}],
        **kwargs
    )
    return result["content"]


# Test function
if __name__ == "__main__":
    print("🧪 Testing GLM-4.6 Core...")
    
    try:
        client = GLMCore()
        
        # Test basic chat
        print("\n1️⃣ Testing basic chat...")
        result = client.chat(
            messages=[
                {"role": "user", "content": "Write a short tagline for an AI presentation tool."}
            ],
            temperature=0.9,
            max_tokens=100
        )
        print(f"✅ Response: {result['content']}")
        print(f"📊 Usage: {result.get('usage', {})}")
        
        # Test presentation planning
        print("\n2️⃣ Testing presentation planning...")
        plan = client.generate_presentation_plan(
            topic="The Future of AI",
            slide_count=5,
            style="professional"
        )
        print(f"✅ Plan generated: {len(plan.get('plan', {}).get('slides', []))} slides")
        
        print("\n✅ All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
