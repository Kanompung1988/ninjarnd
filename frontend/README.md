# 🥷 NINJA Research System - Frontend

A modern, beautiful web application for AI-powered deep research and presentation generation with Google OAuth authentication.

## 🌟 Features

- **🔐 Secure Authentication**: Google OAuth integration with NextAuth.js
- **💬 Intelligent Chat**: Multi-model AI chat (Typhoon, GPT-4, Gemini)
- **🔍 Deep Research**: Comprehensive research with Tavily + SERPAPI hybrid search
- **📊 Auto-Presentations**: Generate PowerPoint & HTML presentations with AI images
- **🎨 Beautiful UI**: Modern, responsive design similar to Streamlit
- **🌓 Dark Mode**: Smooth theme switching
- **💾 Session Management**: Persistent chat history with Zustand
- **⚡ Real-time Updates**: Instant UI updates and streaming responses

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/    # NextAuth configuration
│   │   │   ├── chat/                  # Chat API endpoint
│   │   │   ├── research/              # Research API endpoint
│   │   │   └── slides/                # Slides generation API
│   │   ├── auth/
│   │   │   └── signin/                # Sign-in page
│   │   ├── dashboard/                 # Main dashboard
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing page
│   │   ├── providers.tsx              # Context providers
│   │   └── globals.css                # Global styles
│   ├── components/
│   │   ├── ChatInterface.tsx          # Main chat UI
│   │   ├── Header.tsx                 # Top header bar
│   │   ├── ResearchPanel.tsx          # Research side panel
│   │   └── Sidebar.tsx                # Chat sessions sidebar
│   ├── store/
│   │   └── chatStore.ts               # Zustand state management
│   ├── types/
│   │   ├── index.ts                   # TypeScript definitions
│   │   └── next-auth.d.ts             # NextAuth types
│   └── lib/                           # Utility functions
├── public/                            # Static assets
├── .env.local.example                 # Environment variables template
├── next.config.js                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind CSS config
├── tsconfig.json                      # TypeScript config
└── package.json                       # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Python backend running (from parent directory)
- Google OAuth credentials

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
BACKEND_API_SECRET=your-backend-secret

# AI API Keys (server-side only)
TAVILY_API_KEY=your-tavily-key
SERP_API_KEY=your-serpapi-key
TYPHOON_API_KEY=your-typhoon-key
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Start Python Backend

In the parent directory:

```bash
# Activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
python -m uvicorn presentation_api:app --reload --port 8000
```

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js (Google OAuth)
- **State Management**: Zustand
- **UI Components**: Headless UI, Lucide React
- **Animations**: Framer Motion
- **API Client**: Axios
- **Date Utils**: date-fns
- **Markdown**: react-markdown

## 📱 Features Comparison with Streamlit

| Feature | Streamlit | Frontend |
|---------|-----------|----------|
| Google Login | ❌ | ✅ |
| Chat Interface | ✅ | ✅ |
| Deep Research | ✅ | ✅ |
| Slide Generation | ✅ | ✅ |
| Session Management | ✅ | ✅ (Enhanced) |
| Dark Mode | ✅ | ✅ (Smooth) |
| Mobile Responsive | ⚠️ | ✅ |
| Custom Themes | ❌ | ✅ |
| File Downloads | ✅ | ✅ |

## 🔒 Security Features

- **Server-side API keys**: API keys never exposed to client
- **Secure authentication**: JWT-based session management
- **Protected routes**: Automatic redirect for unauthenticated users
- **CORS configuration**: Restricted API access
- **Input validation**: Server-side validation for all inputs

## 🎯 Usage

### 1. Sign In

Click "Continue with Google" on the sign-in page.

### 2. Chat with NINJA

- Type your message in the chat input
- NINJA uses Typhoon AI for intelligent responses
- Messages are automatically saved

### 3. Deep Research

- Click the "Research" button in the header
- Enter your research topic
- Configure parameters:
  - **Days Back**: How far to search (1-90 days)
  - **Effort**: Quick, Standard, Comprehensive, Exhaustive
  - **Scope**: Focused, Balanced, Comprehensive, All-inclusive
  - **Model**: Typhoon, GPT-4 Turbo, or Gemini Pro
  - **Search Engine**: Tavily, SERPAPI, or Hybrid
- View results in the research panel

### 4. Generate Presentations

- After research, click "Generate Slides"
- Configure presentation settings:
  - Enable AI-generated images
  - Choose image style
  - Set maximum images
  - Select theme
- Download PPTX or HTML format

## 🛠️ Development

### Build for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## 🐛 Troubleshooting

### "Cannot find module" errors

Run `npm install` again. TypeScript errors during development are normal until packages are installed.

### Authentication not working

1. Verify Google OAuth credentials in `.env.local`
2. Check redirect URI matches Google Console
3. Ensure `NEXTAUTH_SECRET` is set (generate with `openssl rand -base64 32`)

### Backend connection failed

1. Ensure Python backend is running on port 8000
2. Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
3. Verify CORS settings in backend allow `http://localhost:3000`

## 📦 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
# Build image
docker build -t ninja-frontend .

# Run container
docker run -p 3000:3000 ninja-frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 🙏 Acknowledgments

- Powered by Typhoon AI, OpenAI, and Google Gemini
- Built with Next.js and Tailwind CSS
- Icons by Lucide React

---

**Made with ❤️ by the NINJA Team**
