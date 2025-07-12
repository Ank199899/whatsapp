-- Advanced AI Agent System Database Schema
-- This file contains the database schema for the advanced AI agent features

-- AI Agents Table
CREATE TABLE IF NOT EXISTS ai_agents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('sales', 'support', 'marketing', 'custom')) DEFAULT 'custom',
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'inactive', 'training', 'error')) DEFAULT 'active',
    personality TEXT,
    instructions TEXT,
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 500,
    auto_reply BOOLEAN DEFAULT true,
    business_hours BOOLEAN DEFAULT false,
    languages JSONB DEFAULT '["English"]',
    custom_api_key TEXT,
    knowledge_base JSONB DEFAULT '[]',
    triggers JSONB DEFAULT '[]',
    responses JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{}',
    training JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Providers Table
CREATE TABLE IF NOT EXISTS ai_providers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('openai', 'anthropic', 'gemini', 'cohere', 'mistral', 'custom')) NOT NULL,
    status TEXT CHECK (status IN ('connected', 'disconnected', 'error', 'testing')) DEFAULT 'disconnected',
    api_key TEXT NOT NULL,
    base_url TEXT,
    models JSONB DEFAULT '[]',
    usage JSONB DEFAULT '{}',
    rate_limit JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE
);

-- AI Training Datasets Table
CREATE TABLE IF NOT EXISTS ai_training_datasets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('conversations', 'documents', 'faq', 'custom')) NOT NULL,
    source TEXT,
    size INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    accuracy REAL,
    file_path TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Training Jobs Table
CREATE TABLE IF NOT EXISTS ai_training_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    dataset_ids JSONB DEFAULT '[]',
    config JSONB DEFAULT '{}',
    status TEXT CHECK (status IN ('queued', 'running', 'completed', 'failed')) DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    data_points INTEGER DEFAULT 0,
    accuracy REAL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    logs JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Knowledge Items Table
CREATE TABLE IF NOT EXISTS ai_knowledge_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK (type IN ('faq', 'document', 'conversation', 'manual')) DEFAULT 'faq',
    category TEXT,
    tags JSONB DEFAULT '[]',
    status TEXT CHECK (status IN ('active', 'draft', 'archived')) DEFAULT 'active',
    usage JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Knowledge Categories Table
CREATE TABLE IF NOT EXISTS ai_knowledge_categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT 'bg-blue-500',
    item_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Conversations Table (for tracking AI interactions)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    agent_id TEXT REFERENCES ai_agents(id) ON DELETE SET NULL,
    conversation_id TEXT,
    message_id TEXT,
    input_message TEXT NOT NULL,
    output_message TEXT,
    provider TEXT,
    model TEXT,
    tokens_used INTEGER,
    response_time INTEGER,
    success BOOLEAN DEFAULT true,
    confidence REAL,
    sentiment TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Analytics Table (for storing analytics data)
CREATE TABLE IF NOT EXISTS ai_analytics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    agent_id TEXT REFERENCES ai_agents(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    interactions INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0,
    user_satisfaction REAL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, agent_id, date)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_providers_user_id ON ai_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_providers_status ON ai_providers(status);
CREATE INDEX IF NOT EXISTS idx_ai_training_datasets_user_id ON ai_training_datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_jobs_user_id ON ai_training_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_jobs_agent_id ON ai_training_jobs(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_items_user_id ON ai_knowledge_items(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_items_category ON ai_knowledge_items(category);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_items_status ON ai_knowledge_items(status);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_categories_user_id ON ai_knowledge_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_agent_id ON ai_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_user_id ON ai_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_agent_id ON ai_analytics(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_date ON ai_analytics(date);

-- Full-text search indexes for knowledge items
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_items_search ON ai_knowledge_items USING gin(to_tsvector('english', title || ' ' || content));

-- Insert default knowledge categories
INSERT INTO ai_knowledge_categories (id, user_id, name, description, color) VALUES
('cat_general', 'admin-user-123', 'General', 'General knowledge and information', 'bg-blue-500'),
('cat_sales', 'admin-user-123', 'Sales', 'Sales-related information and processes', 'bg-green-500'),
('cat_support', 'admin-user-123', 'Support', 'Customer support and troubleshooting', 'bg-purple-500'),
('cat_product', 'admin-user-123', 'Product', 'Product information and features', 'bg-orange-500'),
('cat_company', 'admin-user-123', 'Company', 'Company policies and information', 'bg-red-500')
ON CONFLICT (id) DO NOTHING;

-- Insert sample AI agents
INSERT INTO ai_agents (id, user_id, name, description, type, provider, model, status, personality, instructions) VALUES
('agent_sales_pro', 'admin-user-123', 'Sales Assistant Pro', 'Advanced sales agent for lead generation and conversion', 'sales', 'openai', 'gpt-4o', 'active', 
'You are a professional sales assistant with expertise in consultative selling and relationship building.', 
'Help customers understand our products and services. Focus on identifying their needs and providing tailored solutions. Always be helpful, professional, and customer-focused.'),
('agent_support_expert', 'admin-user-123', 'Support Expert', 'Customer support specialist for technical assistance', 'support', 'anthropic', 'claude-3-5-sonnet-20241022', 'active',
'You are a knowledgeable and patient customer support specialist.', 
'Provide excellent customer support by understanding issues, offering solutions, and ensuring customer satisfaction. Be empathetic and solution-oriented.'),
('agent_marketing_guru', 'admin-user-123', 'Marketing Guru', 'Marketing specialist for engagement and brand promotion', 'marketing', 'gemini', 'gemini-pro', 'active',
'You are a creative marketing specialist with expertise in digital marketing and brand engagement.', 
'Engage with customers to promote our brand and products. Create compelling content and drive engagement while maintaining brand voice and values.')
ON CONFLICT (id) DO NOTHING;

-- Insert sample knowledge items
INSERT INTO ai_knowledge_items (id, user_id, title, content, type, category, tags, status) VALUES
('kb_business_hours', 'admin-user-123', 'Business Hours', 'Our business hours are Monday to Friday, 9 AM to 6 PM EST. We are closed on weekends and major holidays.', 'faq', 'cat_general', '["hours", "schedule", "availability"]', 'active'),
('kb_pricing_info', 'admin-user-123', 'Pricing Information', 'We offer flexible pricing plans starting from $29/month for basic features up to $299/month for enterprise solutions. Contact sales for custom pricing.', 'faq', 'cat_sales', '["pricing", "plans", "cost"]', 'active'),
('kb_contact_support', 'admin-user-123', 'How to Contact Support', 'You can reach our support team via email at support@company.com, phone at 1-800-SUPPORT, or through our live chat feature available 24/7.', 'faq', 'cat_support', '["contact", "support", "help"]', 'active'),
('kb_product_features', 'admin-user-123', 'Product Features Overview', 'Our platform includes AI-powered automation, real-time analytics, multi-channel communication, and enterprise-grade security features.', 'document', 'cat_product', '["features", "capabilities", "product"]', 'active')
ON CONFLICT (id) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_training_datasets_updated_at BEFORE UPDATE ON ai_training_datasets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_knowledge_items_updated_at BEFORE UPDATE ON ai_knowledge_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
