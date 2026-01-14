# 🥷 NINJA Research System

> **AI-Powered Research & Presentation Platform**  
> สร้าง Deep Research และ Presentation อัตโนมัติด้วย AI

[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org)

---

## ✨ Features

### 🔍 Deep Research Engine
- **Multi-Source Search**: Tavily + Serper + JINA hybrid search
- **Multi-Model Support**: Typhoon, GPT-4o/5, Gemini 2.5
- **9-Stage Pipeline**: Query expansion → Synthesis → Fact validation
- **Research Blog Export**: บันทึกผลวิจัยเป็น Markdown

### 🎨 Presentation Generator
- **GLM-4.7 7-Step Process**: สร้าง slides แบบ step-by-step
- **Chat-to-Presentation**: สร้าง slides จากการสนทนา
- **CogView-3 Image Generation**: สร้างรูปภาพด้วย AI
- **PowerPoint Export**: ส่งออกเป็น .pptx

### 💬 AI Chat Interface
- **Real-time Streaming**: ตอบแบบ real-time
- **Context Memory**: จดจำบทสนทนา
- **Model Switching**: สลับ AI model ได้ทันที

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                     │
│         React 18 • TypeScript • Tailwind CSS                 │
├─────────────────────────────────────────────────────────────┤
│                    Backend API (FastAPI)                     │
│                      56 API Endpoints                        │
├─────────────────────────────────────────────────────────────┤
│                       AI Engines                             │
│  ┌─────────────────┐  ┌────────────────────────────────┐    │
│  │ GLM 7-Step      │  │ Comprehensive Research Engine  │    │
│  │ Generator       │  │ (Typhoon/GPT/Gemini)           │    │
│  └─────────────────┘  └────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Search Adapters                           │
│     Tavily API  •  Serper API  •  JINA Reader API           │
├─────────────────────────────────────────────────────────────┤
│                       Database                               │
│          PostgreSQL  •  Memory DB (JSON)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ninja-research/
├── backend_api.py              # FastAPI server (56 routes)
├── GLM_core.py                 # Z.AI GLM-4.7 client
├── Azure_OpenAi_core.py        # Azure OpenAI client
│
├── engines/                    # AI Engines
│   ├── glm_7step_generator.py  # 🌟 Primary slide generator
│   ├── comprehensive_research_engine.py  # Deep research
│   ├── ai_slide_generator.py   # AI slide generation
│   ├── zai_slide_generator.py  # Z.AI style generator
│   └── code_slide_generator.py # Code presentation
│
├── adapters/                   # Search Adapters
│   ├── tavily_engine.py        # Tavily Search
│   ├── jina_engine.py          # JINA Reader
│   ├── hybrid_engine.py        # Multi-source hybrid
│   └── base_engine.py          # Base class
│
├── database/                   # Database Layer
│   ├── db_manager.py           # PostgreSQL manager
│   ├── memory_db.py            # JSON memory store
│   └── schema.sql              # DB schema
│
├── frontend/                   # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   ├── contexts/          # Theme context
│   │   ├── store/             # Zustand store
│   │   └── lib/               # Auth utilities
│   └── public/                # Static assets
│
├── exports/                    # Generated files
│   ├── presentations/         # PowerPoint files
│   └── research_*.json        # Research exports
│
└── user_data/                  # User storage
    └── {user_email}/          # Per-user data
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL (optional)

### 1. Clone & Setup

```bash
git clone https://github.com/Kanompung1988/NINJA-Kanompung.git
cd NINJA-Kanompung
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your settings
```

### 4. Run Application

```bash
# Terminal 1: Backend
./run_backend.sh
# Or: uvicorn backend_api:app --reload --port 8000

# Terminal 2: Frontend
./run_frontend.sh
# Or: cd frontend && npm run dev
```

Visit: **http://localhost:3000**

---

## ⚙️ Configuration

### Required API Keys

| Service | Environment Variable | Description |
|---------|---------------------|-------------|
| **Tavily** | `TAVILY_API_KEY` | Web search API |
| **Serper** | `SERPER_API_KEY` | Google search API |
| **JINA** | `JINA_API_KEY` | Content reader API |
| **GLM** | `GLM_API_KEY` | Z.AI GLM-4.7 model |
| **Typhoon** | `TYPHOON_API_KEY` | Typhoon LLM |
| **OpenAI** | `OPENAI_API_KEY` | GPT models |
| **Gemini** | `GEMINI_API_KEY` | Google Gemini |

### Optional Services

| Service | Environment Variable | Description |
|---------|---------------------|-------------|
| Azure OpenAI | `AZURE_OPENAI_API_KEY` | Azure-hosted OpenAI |
| Azure Storage | `AZURE_STORAGE_CONNECTION_STRING` | Blob storage |
| PostgreSQL | `DATABASE_URL` | Production database |
| Google OAuth | `GOOGLE_CLIENT_ID/SECRET` | User authentication |

---

## 🔌 API Endpoints

### Research
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/research/comprehensive` | Deep research |
| POST | `/api/research/stream` | Streaming research |
| GET | `/api/research-blogs/{user}` | Get saved research |

### Presentations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/presentation/generate` | Generate slides |
| POST | `/api/presentation/stream` | Streaming generation |
| GET | `/api/presentation/export/{id}` | Export PowerPoint |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Chat completion |
| POST | `/api/chat/stream` | Streaming chat |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List users |
| POST | `/api/admin/whitelist` | Manage whitelist |
| GET | `/api/admin/stats` | System statistics |

---

## 🐳 Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance API framework
- **Python 3.12** - Latest Python features
- **Uvicorn** - ASGI server
- **python-pptx** - PowerPoint generation
- **psycopg2** - PostgreSQL driver

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript 5.3** - Type safety
- **Tailwind CSS 3.3** - Utility-first CSS
- **NextAuth.js** - Authentication
- **Zustand** - State management
- **Framer Motion** - Animations

### AI Models
- **GLM-4.7** - Z.AI primary model
- **Typhoon 2.1/2.5** - Thai-optimized LLM
- **GPT-4o/5** - OpenAI models
- **Gemini 2.5** - Google AI
- **CogView-3** - Image generation

---

## 📊 Supported AI Models

### Chat & Research
| Model | Provider | Best For |
|-------|----------|----------|
| `typhoon-v2.1-12b-instruct` | Typhoon | Thai content |
| `typhoon-v2.5-30b-a3b-instruct` | Typhoon | High quality Thai |
| `gpt-4o` | OpenAI | General purpose |
| `gemini-2.5-flash` | Google | Fast responses |
| `gemini-2.5-pro` | Google | Complex reasoning |
| `glm-4.7` | Z.AI | Presentations |

### Image Generation
| Model | Provider | Description |
|-------|----------|-------------|
| `cogview-3-flash` | ZhipuAI | Fast generation |
| `cogview-3` | ZhipuAI | High quality |
| `dall-e-3` | Azure | Premium quality |

---

## 📝 License

This project is proprietary software developed for SCBX.

---

## 👥 Contributors

- **NINJA R&D Team** - Development & Architecture

---

<p align="center">
  <img src="assets/ninja_rnd.png" width="100" alt="NINJA R&D">
  <br>
  <strong>NINJA Research System</strong><br>
  <em>Powered by AI</em>
</p>
