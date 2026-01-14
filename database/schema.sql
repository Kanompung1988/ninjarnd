-- ═══════════════════════════════════════════════════════════
-- NINJA Research System - PostgreSQL Database Schema
-- Azure PostgreSQL Compatible
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════
-- USERS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    avatar_url TEXT,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_google_id ON users(google_id);

-- ═══════════════════════════════════════════════════════════
-- CHAT SESSIONS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- CHAT MESSAGES TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- ═══════════════════════════════════════════════════════════
-- RESEARCH CONTEXTS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE research_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(500) NOT NULL,
    summary TEXT,
    sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_research_contexts_session_id ON research_contexts(session_id);
CREATE INDEX idx_research_contexts_user_id ON research_contexts(user_id);

-- ═══════════════════════════════════════════════════════════
-- PRESENTATIONS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE presentations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    topic VARCHAR(500) NOT NULL,
    slide_count INTEGER DEFAULT 0,
    style VARCHAR(100) DEFAULT 'professional',
    aspect_ratio VARCHAR(10) DEFAULT '16:9',
    slides JSONB DEFAULT '[]'::jsonb,
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_presentations_user_id ON presentations(user_id);
CREATE INDEX idx_presentations_session_id ON presentations(session_id);
CREATE INDEX idx_presentations_created_at ON presentations(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- RESEARCH BLOGS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE research_blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    topic VARCHAR(500),
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_research_blogs_user_id ON research_blogs(user_id);
CREATE INDEX idx_research_blogs_session_id ON research_blogs(session_id);
CREATE INDEX idx_research_blogs_created_at ON research_blogs(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- USER SETTINGS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(50) DEFAULT 'dark',
    enable_hybrid_search BOOLEAN DEFAULT true,
    enable_ai_images BOOLEAN DEFAULT true,
    debug_mode BOOLEAN DEFAULT false,
    deep_research_enabled BOOLEAN DEFAULT false,
    realtime_research_enabled BOOLEAN DEFAULT false,
    agent_mode_enabled BOOLEAN DEFAULT false,
    selected_model VARCHAR(100) DEFAULT 'typhoon-v2.5-30b-a3b-instruct',
    selected_search_engine VARCHAR(100) DEFAULT 'hybrid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb
);

-- ═══════════════════════════════════════════════════════════
-- AUDIT LOG TABLE (for admin monitoring)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presentations_updated_at BEFORE UPDATE ON presentations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_blogs_updated_at BEFORE UPDATE ON research_blogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_whitelist_updated_at BEFORE UPDATE ON email_whitelist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- SUBSCRIPTION PLANS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL CHECK (name IN ('Go', 'Plus', 'Pro')),
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    features JSONB DEFAULT '[]'::jsonb,
    limits JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_plans_name ON subscription_plans(name);

-- ═══════════════════════════════════════════════════════════
-- USER SUBSCRIPTIONS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id)
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- ═══════════════════════════════════════════════════════════
-- USAGE TRACKING TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL CHECK (resource_type IN ('message', 'token', 'research', 'presentation', 'image')),
    resource_count INTEGER DEFAULT 1,
    model VARCHAR(100),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_resource_type ON usage_tracking(resource_type);
CREATE INDEX idx_usage_tracking_created_at ON usage_tracking(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- EMAIL WHITELIST TABLE (for admin-controlled access)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE email_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id),
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_whitelist_email ON email_whitelist(email);
CREATE INDEX idx_email_whitelist_is_active ON email_whitelist(is_active);

-- ═══════════════════════════════════════════════════════════
-- INITIAL DATA
-- ═══════════════════════════════════════════════════════════

-- Create subscription plans matching the UI
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, limits) VALUES
('Go', 'Go Plan', 'Do more with smarter AI', 4.00, 48.00, 
 '["Go deep on harder questions", "Chat longer and upload more content", "Make realistic images for your projects", "Store more context for smarter replies", "Get help with planning and tasks", "Explore projects, tasks, and custom GPTs"]'::jsonb,
 '{"messages_per_month": 1000, "tokens_per_message": 4000, "storage_mb": 100, "sessions": 50}'::jsonb),
 
('Plus', 'Plus Plan', 'More access to advanced intelligence', 0.00, 0.00,
 '["Solve complex problems", "Have long chats over multiple sessions", "Create more images, faster", "Remember goals and past conversations", "Plan travel and tasks with agent mode", "Organize projects and customize GPTs", "Produce and share videos on Sora", "Write code and build apps with Codex"]'::jsonb,
 '{"messages_per_month": 5000, "tokens_per_message": 8000, "storage_mb": 500, "sessions": 200, "deep_research": true, "ai_images": true}'::jsonb),
 
('Pro', 'Pro Plan', 'Maximize your productivity', 200.00, 2400.00,
 '["Master advanced tasks and topics", "Tackle big projects with unlimited messages", "Create high-quality images at any scale", "Keep full context with maximum memory", "Run research and plan tasks with agents", "Scale your projects and automate workflows", "Expand your limits with Sora video creation", "Deploy code faster with Codex", "Get early access to experimental features"]'::jsonb,
 '{"messages_per_month": -1, "tokens_per_message": -1, "storage_mb": -1, "sessions": -1, "deep_research": true, "ai_images": true, "realtime_research": true, "agent_mode": true, "unlimited": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create initial admin user (thanaponmeliodas@gmail.com)
INSERT INTO users (email, name, role, is_active)
VALUES ('thanaponmeliodas@gmail.com', 'Admin', 'admin', true)
ON CONFLICT (email) DO UPDATE SET role = 'admin', is_active = true;

-- Assign Pro plan to admin
INSERT INTO user_subscriptions (user_id, plan_id, status, billing_cycle, expires_at)
SELECT u.id, p.id, 'active', 'lifetime', NULL
FROM users u, subscription_plans p
WHERE u.email = 'thanaponmeliodas@gmail.com' AND p.name = 'Pro'
ON CONFLICT (user_id) DO UPDATE SET 
    plan_id = (SELECT id FROM subscription_plans WHERE name = 'Pro'),
    status = 'active',
    billing_cycle = 'lifetime';

-- Add admin to email whitelist
INSERT INTO email_whitelist (email, plan_id, notes, is_active)
SELECT 'thanaponmeliodas@gmail.com', id, 'System Administrator', true
FROM subscription_plans WHERE name = 'Pro'
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- ═══════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════

-- User activity summary
CREATE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    COUNT(DISTINCT cs.id) as session_count,
    COUNT(DISTINCT p.id) as presentation_count,
    COUNT(DISTINCT rb.id) as research_blog_count,
    MAX(u.last_login_at) as last_login,
    u.created_at
FROM users u
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
LEFT JOIN presentations p ON u.id = p.user_id
LEFT JOIN research_blogs rb ON u.id = rb.user_id
GROUP BY u.id, u.email, u.name, u.role, u.last_login_at, u.created_at;

-- Recent activity view
CREATE VIEW recent_activity AS
SELECT 
    'message' as activity_type,
    cm.id,
    cm.session_id as related_id,
    u.email as user_email,
    cm.content as description,
    cm.created_at
FROM chat_messages cm
JOIN chat_sessions cs ON cm.session_id = cs.id
JOIN users u ON cs.user_id = u.id
UNION ALL
SELECT 
    'presentation' as activity_type,
    p.id,
    p.id as related_id,
    u.email as user_email,
    p.title as description,
    p.created_at
FROM presentations p
JOIN users u ON p.user_id = u.id
UNION ALL
SELECT 
    'research' as activity_type,
    rb.id,
    rb.id as related_id,
    u.email as user_email,
    rb.title as description,
    rb.created_at
FROM research_blogs rb
JOIN users u ON rb.user_id = u.id
ORDER BY created_at DESC;

-- User subscription details view
CREATE VIEW user_subscription_details AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.role,
    p.name as plan_name,
    p.display_name as plan_display_name,
    p.price_monthly,
    p.limits,
    us.status as subscription_status,
    us.billing_cycle,
    us.started_at,
    us.expires_at,
    us.auto_renew
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN subscription_plans p ON us.plan_id = p.id;

-- Usage summary view
CREATE VIEW usage_summary AS
SELECT 
    u.id as user_id,
    u.email,
    DATE_TRUNC('month', ut.created_at) as month,
    ut.resource_type,
    COUNT(*) as usage_count,
    SUM(ut.resource_count) as total_resources
FROM users u
LEFT JOIN usage_tracking ut ON u.id = ut.user_id
GROUP BY u.id, u.email, DATE_TRUNC('month', ut.created_at), ut.resource_type;

