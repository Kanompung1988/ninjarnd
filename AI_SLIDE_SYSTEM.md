# 🎨 AI Slide Generation System - Complete Guide

## 📋 System Overview

NINJA Research System ใช้ **GLM-4.7 7-Step Generator** เป็นหลักในการสร้าง AI Slides แบบ Z.AI style พร้อม fallback mechanisms และ multi-source image acquisition.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                              │
│              (Topic + Style + Options)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│               GLM-4.7 7-Step Generator                       │
│                                                              │
│  Step 1: Content Analysis    ┌─────────────────────┐        │
│  Step 2: Planning            │   Rate Limiter      │        │
│  Step 3: Research ─────────► │   (5 calls/min)     │        │
│  Step 4: Image Planning      └─────────────────────┘        │
│  Step 5: Slide Creation                                     │
│  Step 6: Review                                             │
│  Step 7: Finalization                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴──────────┐
         │                      │
    ┌────▼─────┐       ┌───────▼──────┐
    │ GLM-4.7  │       │ Azure GPT-4o │
    │ Primary  │       │   Fallback   │
    └────┬─────┘       └───────┬──────┘
         │                     │
         └──────────┬──────────┘
                    │
        ┌───────────▼───────────┐
        │   Image Acquisition   │
        │                       │
        │  1. CogView-3 (AI)   │
        │  2. Serper Search    │
        │  3. DALL-E Fallback  │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │   PPTX Generation     │
        │   (python-pptx)       │
        └───────────────────────┘
```

---

## 🔑 Required API Keys

### Primary APIs
| API | Usage | Priority |
|-----|-------|----------|
| `GLM_API_KEY` | Slide generation + reasoning | 🔴 Required |
| `SERPER_API_KEY` | Image search (Google Images) | 🔴 Required |
| `AZURE_OPENAI_API_KEY` | Fallback when GLM fails | 🟡 Recommended |

### Research APIs (Optional for enhanced research)
| API | Usage | Priority |
|-----|-------|----------|
| `TAVILY_API_KEY` | Deep research | 🟢 Optional |
| `JINA_API_KEY` | Content extraction | 🟢 Optional |

---

## 🎯 7-Step Generation Process

### Step 1: Content Analysis (10s)
```python
# Analyze user topic and determine:
- Content type (technical, business, educational)
- Main topic and subtopics
- Key points to cover
- Language (Thai/English)
- Target audience
```

### Step 2: Planning & Direction (15s)
```python
# Create presentation structure:
- Visual style (modern, professional, creative)
- Color theme (primary, secondary)
- Slide outline (title, type, key message)
- Flow and transitions
```

### Step 3: Research & Data Collection (20s)
```python
# If include_research=true:
- Tavily: Academic papers, deep web
- Serper: Latest Google results  
- JINA: Content extraction

# Collect:
- Facts and statistics
- Case studies
- Expert quotes
- Current trends
```

### Step 4: Image Planning (5s per slide)
```python
# For each slide:
1. Generate DALL-E style prompt
2. Try CogView-3 (AI generation)
   - Success → Use AI image
   - Fail → Fallback to Serper Image Search
3. Download and save locally
```

### Step 5: Slide Creation (10s per slide)
```python
# For each slide:
- Title (clear, concise)
- Content points (3-5 bullets, 10-15 words each)
- Speaker notes (presenter guidance)
- Visual elements (charts, diagrams if needed)
```

### Step 6: Review & Improve (15s)
```python
# Quality check:
- Clarity score (1-10)
- Consistency check
- Improve weak points
- Optimize content length
- Fix grammar/spelling
```

### Step 7: Finalization (10s)
```python
# Final assembly:
- Generate PPTX file
- Add metadata
- Create summary
- Calculate duration
- Export to /exports/presentations/
```

---

## 🖼️ Image Acquisition Strategy

### Priority 1: CogView-3 (AI Generation) ✨
```python
Model: cogview-3
Size: 1440x720 (16:9 for slides)
Quality: Standard
API: https://open.bigmodel.cn/api/paas/v4/images/generations

Pros:
✅ Custom images matching exact requirements
✅ No copyright issues
✅ Consistent style

Cons:
❌ Slower (30-60s per image)
❌ Rate limits (5/min)
❌ May fail on complex prompts
```

### Priority 2: Serper Image Search 🔍
```python
API: https://google.serper.dev/images
Source: Google Images
Filters: High quality, professional, 16:9

Pros:
✅ Fast (<5s)
✅ Real-world images
✅ High quality

Cons:
⚠️ Copyright considerations
⚠️ May not match exactly
```

### Priority 3: Azure DALL-E (Fallback) 🎨
```python
Model: DALL-E 3
Size: 1024x1024
Quality: HD

Pros:
✅ Highest quality
✅ Reliable
✅ Creative

Cons:
❌ Expensive
❌ Square format (need cropping)
```

---

## 🛠️ Error Handling & Fallbacks

### GLM Rate Limit (429 Error)
```python
Problem: "您当前使用该API的并发数过高"

Solutions:
1. Rate Limiter: 5 calls/minute (12s interval)
2. Exponential Backoff: 5s, 15s, 45s
3. Fallback to Azure GPT-4o after 3 retries

Implementation:
- RateLimiter class controls call frequency
- Automatic Azure fallback on persistent failures
```

### CogView-3 Model Error (400/404)
```python
Problem: "模型不存在，请检查模型代码"

Solutions:
1. Use correct model name: "cogview-3"
2. Fallback to Serper Image Search
3. Fallback to Azure DALL-E if available

Implementation:
- _generate_image() → _search_image() → Azure DALL-E
```

### Empty/Invalid Responses
```python
Problem: Empty content or malformed JSON

Solutions:
1. Retry with longer timeout
2. Extract reasoning_content if content empty
3. Regex JSON extraction from text
4. Increase max_tokens
5. Switch to Azure fallback

Implementation:
- _parse_json() handles multiple formats
- Automatic retry with increased tokens
```

---

## 📊 API Endpoints

### Generate Z.AI Style Slides
```bash
POST /api/zslides/generate/stream

Request:
{
  "topic": "Machine Learning Basics",
  "num_slides": 8,
  "style": "professional",
  "include_research": true,
  "include_images": true
}

Response: (Server-Sent Events)
data: {"step": 1, "status": "analyzing", "progress": 14}
data: {"step": 2, "status": "planning", "progress": 28}
...
data: {"status": "complete", "presentation_id": "..."}
```

### Export Presentation
```bash
GET /api/presentation/export/{presentation_id}

Response:
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
Content-Disposition: attachment; filename="presentation_20260115.pptx"
```

---

## 🔧 Configuration

### Rate Limiting
```python
# engines/glm_7step_generator.py
self.rate_limiter = RateLimiter(calls_per_minute=5)

# Adjust based on your API limits:
# - Free tier: 5 calls/min
# - Plus tier: 10 calls/min
# - Pro tier: 20 calls/min
```

### Retry Settings
```python
max_retries = 3
retry_delay = 5  # seconds
backoff_multiplier = 3  # 5s → 15s → 45s
```

### Image Settings
```python
COGVIEW_MODEL = "cogview-3"
IMAGE_SIZE = "1440x720"  # 16:9 ratio
IMAGE_QUALITY = "standard"
IMAGE_FALLBACK = True  # Enable Serper fallback
```

---

## 📈 Performance Optimization

### Speed Optimization
```python
# Fast mode (no research, no images)
{
  "include_research": false,
  "include_images": false,
  "num_slides": 5
}
# Time: ~30s

# Balanced mode (research, web images)
{
  "include_research": true,
  "include_images": true,
  "image_source": "search"  # Skip AI generation
}
# Time: ~2min

# Quality mode (full research + AI images)
{
  "include_research": true,
  "include_images": true,
  "image_source": "ai"
}
# Time: ~5min
```

### Cost Optimization
```python
# Use GLM (cheaper) for most slides
# Use Azure only as fallback

# Image strategy:
1. Serper search (free/cheap)
2. CogView-3 (moderate cost)
3. DALL-E only for critical slides
```

---

## 🐛 Troubleshooting

### Problem: Rate Limit Errors
```bash
Error: API Error 429: 您当前使用该API的并发数过高

Fix:
1. Increase rate_limiter delay
2. Reduce num_slides
3. Enable Azure fallback
```

### Problem: No Images Generated
```bash
Error: CogView-3 error: 400 - 模型不存在

Fix:
1. Check COGVIEW_MODEL = "cogview-3"
2. Verify GLM_API_KEY has image access
3. Enable SERPER_API_KEY for fallback
```

### Problem: Slow Generation
```bash
Symptom: Takes >10 minutes

Fix:
1. Set include_research=false
2. Set include_images=false  
3. Reduce num_slides to 5
4. Check network connection
```

---

## 📝 Best Practices

### For Development
```python
# Use minimal settings for testing
test_request = {
    "topic": "Test Topic",
    "num_slides": 3,
    "style": "simple",
    "include_research": False,
    "include_images": False
}
```

### For Production
```python
# Enable all features with fallbacks
prod_request = {
    "topic": user_topic,
    "num_slides": 8,
    "style": "professional",
    "include_research": True,
    "include_images": True,
    "fallback_enabled": True,
    "quality": "high"
}
```

---

## 🎓 Example Usage

### Python
```python
from engines.glm_7step_generator import GLM7StepGenerator

generator = GLM7StepGenerator()

# Generate presentation
async for update in generator.generate_presentation_stream(
    topic="AI in Healthcare",
    num_slides=8,
    style="professional",
    include_research=True,
    include_images=True
):
    print(f"Step {update['step']}: {update['status']} - {update['progress']}%")

# Export
file_path = generator.export_presentation(presentation_id)
print(f"Saved to: {file_path}")
```

### cURL
```bash
curl -X POST http://localhost:8000/api/zslides/generate/stream \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Machine Learning Basics",
    "num_slides": 8,
    "style": "professional",
    "include_research": true,
    "include_images": true
  }'
```

---

## 📚 References

- **GLM-4.7 API**: https://open.bigmodel.cn/dev/api
- **CogView-3 Docs**: https://open.bigmodel.cn/dev/api#cogview-3
- **Serper API**: https://serper.dev/docs
- **Azure OpenAI**: https://learn.microsoft.com/azure/ai-services/openai/

---

## 🆘 Support

For issues or questions:
1. Check logs in `/logs/backend.log`
2. Review API responses in terminal output
3. Test individual components separately
4. Contact NINJA R&D team

---

<p align="center">
  <strong>NINJA AI Slide Generation System</strong><br>
  <em>v2.0 - January 2026</em>
</p>
