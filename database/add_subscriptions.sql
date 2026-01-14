-- Add Subscription System to NINJA Database
-- Run this to add subscription tables to existing database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════
-- SUBSCRIPTION PLANS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS subscription_plans (
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

CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON subscription_plans(name);

-- ═══════════════════════════════════════════════════════════
-- USER SUBSCRIPTIONS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_subscriptions (
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

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- ═══════════════════════════════════════════════════════════
-- USAGE TRACKING TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL CHECK (resource_type IN ('message', 'token', 'research', 'presentation', 'image')),
    resource_count INTEGER DEFAULT 1,
    model VARCHAR(100),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_resource ON usage_tracking(resource_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created ON usage_tracking(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- EMAIL WHITELIST TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS email_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    plan_name VARCHAR(50) REFERENCES subscription_plans(name),
    added_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_whitelist_email ON email_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_email_whitelist_active ON email_whitelist(is_active);

-- ═══════════════════════════════════════════════════════════
-- INSERT INITIAL SUBSCRIPTION PLANS
-- ═══════════════════════════════════════════════════════════
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, limits)
VALUES 
    (
        'Go',
        'Go Plan',
        'Perfect for individuals getting started',
        4.00,
        40.00,
        '[
            "Basic AI Models",
            "Standard Research",
            "Email Support",
            "1000 Messages/month"
        ]'::jsonb,
        '{
            "messages_per_month": 1000,
            "research_queries_per_month": 50,
            "presentations_per_month": 5,
            "storage_mb": 500,
            "max_file_size_mb": 10,
            "unlimited": false
        }'::jsonb
    ),
    (
        'Plus',
        'Plus Plan (Limited Time)',
        'Most popular - Best value for professionals',
        0.00,
        0.00,
        '[
            "All Advanced Models",
            "Deep Research",
            "Priority Support",
            "5000 Messages/month",
            "Presentation Generator",
            "Blog Generator"
        ]'::jsonb,
        '{
            "messages_per_month": 5000,
            "research_queries_per_month": 200,
            "presentations_per_month": 20,
            "blogs_per_month": 20,
            "storage_mb": 2000,
            "max_file_size_mb": 50,
            "unlimited": false
        }'::jsonb
    ),
    (
        'Pro',
        'Pro Plan',
        'For power users and teams',
        200.00,
        2000.00,
        '[
            "All Premium Models",
            "Unlimited Everything",
            "24/7 Priority Support",
            "Advanced Analytics",
            "API Access",
            "Custom Integrations",
            "Dedicated Support"
        ]'::jsonb,
        '{
            "unlimited": true,
            "messages_per_month": 999999,
            "research_queries_per_month": 999999,
            "presentations_per_month": 999999,
            "blogs_per_month": 999999,
            "storage_mb": 999999,
            "max_file_size_mb": 999999
        }'::jsonb
    )
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- CREATE/UPDATE ADMIN USER
-- ═══════════════════════════════════════════════════════════
-- Insert admin user if doesn't exist
INSERT INTO users (email, name, role, created_at, last_login_at)
VALUES (
    'thanaponmeliodas@gmail.com',
    'Admin',
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE 
SET role = 'admin',
    updated_at = CURRENT_TIMESTAMP;

-- Add admin to whitelist with Pro plan
INSERT INTO email_whitelist (email, plan_name, is_active, notes)
VALUES (
    'thanaponmeliodas@gmail.com',
    'Pro',
    true,
    'Initial admin user - Auto-created'
)
ON CONFLICT (email) DO UPDATE
SET plan_name = 'Pro',
    is_active = true,
    updated_at = CURRENT_TIMESTAMP;

-- Assign Pro plan to admin
INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    billing_cycle,
    started_at,
    auto_renew
)
SELECT 
    u.id,
    p.id,
    'active',
    'lifetime',
    CURRENT_TIMESTAMP,
    true
FROM users u
CROSS JOIN subscription_plans p
WHERE u.email = 'thanaponmeliodas@gmail.com'
  AND p.name = 'Pro'
ON CONFLICT (user_id) DO UPDATE
SET plan_id = (SELECT id FROM subscription_plans WHERE name = 'Pro'),
    status = 'active',
    billing_cycle = 'lifetime',
    updated_at = CURRENT_TIMESTAMP;

-- ═══════════════════════════════════════════════════════════
-- CREATE VIEWS
-- ═══════════════════════════════════════════════════════════

-- User subscription details view
CREATE OR REPLACE VIEW user_subscription_details AS
SELECT 
    u.id as user_id,
    u.email,
    u.name as user_name,
    u.role,
    sp.name as plan_name,
    sp.display_name as plan_display_name,
    sp.price_monthly,
    sp.limits,
    us.status as subscription_status,
    us.billing_cycle,
    us.started_at,
    us.expires_at,
    us.auto_renew
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id;

-- Usage summary view
CREATE OR REPLACE VIEW usage_summary AS
SELECT 
    user_id,
    resource_type,
    COUNT(*) as total_count,
    SUM(resource_count) as total_resources,
    MAX(created_at) as last_used,
    DATE_TRUNC('month', created_at) as usage_month
FROM usage_tracking
GROUP BY user_id, resource_type, DATE_TRUNC('month', created_at);

-- Subscription stats view
CREATE OR REPLACE VIEW subscription_stats AS
SELECT 
    sp.name as plan_name,
    sp.display_name,
    COUNT(us.id) as active_subscribers,
    SUM(CASE WHEN us.status = 'active' THEN 1 ELSE 0 END) as active_count,
    SUM(CASE WHEN us.status = 'trial' THEN 1 ELSE 0 END) as trial_count,
    SUM(CASE WHEN us.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
FROM subscription_plans sp
LEFT JOIN user_subscriptions us ON sp.id = us.plan_id
GROUP BY sp.id, sp.name, sp.display_name;

-- Success message
SELECT 'Subscription system successfully added!' as status;
