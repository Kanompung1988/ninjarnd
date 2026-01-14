"""
Z.AI Style Slide Generator - Fast & Simple
==========================================
เหมือน Z.AI - สร้าง Presentation ทั้งหมดในครั้งเดียว
ใช้ GLM-4.7 เพียง 1 API call เพื่อสร้าง slides ทั้งหมด

Features:
- Single API Call: สร้าง slides ทั้งหมดในครั้งเดียว
- Fast Generation: ไม่ต้องรอหลาย steps
- Professional Output: ได้ผลลัพธ์สวยงาม
"""
import os
import sys
import json
import requests
import time
from typing import Dict, List, Any, Optional
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
MODEL = "glm-4.7"

# Exports directory
EXPORTS_DIR = PROJECT_ROOT / "exports" / "presentations"
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

# ═══════════════════════════════════════════════════════════════
# SINGLE PROMPT - สร้าง slides ทั้งหมดในครั้งเดียว
# ═══════════════════════════════════════════════════════════════

SLIDE_GENERATION_PROMPT = """คุณคือผู้เชี่ยวชาญในการสร้าง Presentation สไตล์มืออาชีพ

สร้าง {slide_count} slides สำหรับหัวข้อ: {topic}
สไตล์: {style}

กรุณาตอบเป็น JSON เท่านั้น ในรูปแบบนี้:
{{
  "title": "ชื่อ Presentation",
  "slides": [
    {{
      "slide_number": 1,
      "type": "title",
      "title": "หัวข้อหลัก",
      "subtitle": "หัวข้อรอง (ถ้ามี)",
      "content": []
    }},
    {{
      "slide_number": 2,
      "type": "content",
      "title": "หัวข้อสไลด์",
      "content": ["จุดสำคัญ 1", "จุดสำคัญ 2", "จุดสำคัญ 3"],
      "speaker_notes": "หมายเหตุสำหรับผู้นำเสนอ"
    }}
  ]
}}

ข้อกำหนด:
- สไลด์แรกต้องเป็น title slide
- แต่ละ content slide มี 3-5 bullet points
- เนื้อหากระชับ ชัดเจน อ่านง่าย
- ใช้ภาษาไทยหรืออังกฤษตามหัวข้อ
- ตอบเป็น JSON เท่านั้น ไม่ต้องอธิบายเพิ่มเติม"""


class ZAISlideGenerator:
    """
    Z.AI Style - สร้าง Slides ในครั้งเดียว
    Fast, Simple, Professional
    """
    
    def __init__(self):
        """Initialize with GLM-4.7"""
        self.api_key = GLM_API_KEY
        self.base_url = BASE_URL
        self.model = MODEL
        
        if not self.api_key:
            raise ValueError("❌ GLM_API_KEY not found in environment")
        
        print("=" * 50)
        print("🚀 Z.AI Slide Generator (Fast Mode)")
        print("=" * 50)
        print(f"✅ Model: {self.model}")
        print(f"✅ API: ZhipuAI")
        print("=" * 50)
    
    def generate(
        self,
        topic: str,
        slide_count: int = 5,
        style: str = "professional"
    ) -> Dict[str, Any]:
        """
        สร้าง Presentation ทั้งหมดในครั้งเดียว
        
        Args:
            topic: หัวข้อ presentation
            slide_count: จำนวน slides ที่ต้องการ
            style: สไตล์ (professional, modern, minimal)
            
        Returns:
            Dict with title, slides, metadata
        """
        print(f"\n🎨 กำลังสร้าง {slide_count} slides สำหรับ: {topic}")
        
        # Build prompt
        prompt = SLIDE_GENERATION_PROMPT.format(
            topic=topic,
            slide_count=slide_count,
            style=style
        )
        
        # Single API call
        response = self._call_api(prompt)
        
        if not response:
            print("⚠️ API failed, using fallback")
            return self._fallback_presentation(topic, slide_count)
        
        # Parse JSON response
        result = self._parse_response(response)
        
        if not result or not result.get("slides"):
            print("⚠️ Parse failed, using fallback")
            return self._fallback_presentation(topic, slide_count)
        
        # Add metadata
        result["metadata"] = {
            "model": self.model,
            "generated_at": datetime.now().isoformat(),
            "topic": topic,
            "style": style,
            "slide_count": len(result.get("slides", []))
        }
        
        print(f"✅ สร้างเสร็จ! {len(result.get('slides', []))} slides")
        return result
    
    def _call_api(self, prompt: str, max_tokens: int = 4096) -> str:
        """Single API call to GLM-4.7"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "คุณคือผู้เชี่ยวชาญสร้าง Presentation ตอบเป็น JSON เท่านั้น"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": max_tokens,
            "stream": False
        }
        
        try:
            print(f"   🔄 เรียก {self.model}...")
            start_time = time.time()
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=120
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code != 200:
                print(f"   ❌ API Error: {response.status_code}")
                return ""
            
            data = response.json()
            
            if "choices" not in data or len(data["choices"]) == 0:
                print("   ❌ Empty response")
                return ""
            
            message = data["choices"][0].get("message", {})
            content = message.get("content", "")
            
            # Handle reasoning_content for GLM-4.7
            if not content and message.get("reasoning_content"):
                reasoning = message.get("reasoning_content", "")
                # Try to extract JSON from reasoning
                import re
                json_match = re.search(r'\{[\s\S]*\}', reasoning)
                if json_match:
                    content = json_match.group(0)
            
            print(f"   ✅ ได้รับ {len(content)} chars ({elapsed:.1f}s)")
            return content
            
        except requests.exceptions.Timeout:
            print("   ⏱️ Timeout")
            return ""
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return ""
    
    def _parse_response(self, content: str) -> Dict:
        """Parse JSON from response"""
        if not content:
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
        import re
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            content = json_match.group(0)
        
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            print(f"   ⚠️ JSON parse error: {e}")
            return {}
    
    def _fallback_presentation(self, topic: str, slide_count: int) -> Dict:
        """Fallback presentation if API fails"""
        slides = [
            {
                "slide_number": 1,
                "type": "title",
                "title": topic,
                "subtitle": "Presentation",
                "content": []
            }
        ]
        
        for i in range(2, slide_count + 1):
            slides.append({
                "slide_number": i,
                "type": "content",
                "title": f"Section {i-1}",
                "content": [
                    f"Key point {j}" for j in range(1, 4)
                ],
                "speaker_notes": ""
            })
        
        return {
            "title": topic,
            "slides": slides,
            "metadata": {
                "model": "fallback",
                "generated_at": datetime.now().isoformat()
            }
        }


def generate_presentation_fast(
    topic: str,
    slide_count: int = 5,
    style: str = "professional",
    **kwargs
) -> Dict[str, Any]:
    """
    Quick function to generate presentation
    
    Usage:
        result = generate_presentation_fast("AI in Healthcare", slide_count=5)
    """
    generator = ZAISlideGenerator()
    return generator.generate(topic, slide_count, style)


# For testing
if __name__ == "__main__":
    result = generate_presentation_fast(
        topic="Machine Learning Basics",
        slide_count=3,
        style="professional"
    )
    
    print("\n" + "=" * 50)
    print("📊 RESULT")
    print("=" * 50)
    print(f"Title: {result.get('title')}")
    print(f"Slides: {len(result.get('slides', []))}")
    for slide in result.get("slides", []):
        print(f"  {slide.get('slide_number')}. {slide.get('title')}")
