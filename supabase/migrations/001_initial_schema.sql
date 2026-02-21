-- Lovable Voice Helper - Initial Database Schema
-- This migration creates all necessary tables, functions, and policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- User profiles (extended from auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    preferred_language TEXT DEFAULT 'hi',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    daily_limit INT NOT NULL,
    price_cents INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (id, name, daily_limit, price_cents) VALUES
    ('free', 'Free', 5, 0),
    ('pro', 'Pro', 100, 999),
    ('unlimited', 'Unlimited', -1, 2499)
ON CONFLICT (id) DO NOTHING;

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id) DEFAULT 'free',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily usage tracking (for prompt limits)
CREATE TABLE IF NOT EXISTS public.daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    prompt_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Usage logs (detailed tracking for analytics)
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_language TEXT NOT NULL,
    objective TEXT,
    additional_context TEXT,
    audio_duration_seconds INT,
    original_text_length INT,
    elaborated_text_length INT,
    tokens_used INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON public.daily_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
    );

    -- Create default subscription
    INSERT INTO public.subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, 'free', 'active');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment daily usage
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.daily_usage (user_id, date, prompt_count, updated_at)
    VALUES (p_user_id, CURRENT_DATE, 1, NOW())
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        prompt_count = daily_usage.prompt_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limit
CREATE OR REPLACE FUNCTION public.check_usage_limit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_plan_limit INT;
    v_current_count INT;
BEGIN
    -- Get user's plan limit
    SELECT COALESCE(sp.daily_limit, 5) INTO v_plan_limit
    FROM public.subscriptions s
    JOIN public.subscription_plans sp ON s.plan_id = sp.id
    WHERE s.user_id = p_user_id
      AND s.status = 'active'
    ORDER BY sp.daily_limit DESC
    LIMIT 1;

    -- Default to free tier if no subscription found
    IF v_plan_limit IS NULL THEN
        v_plan_limit := 5;
    END IF;

    -- Unlimited plan (-1 means no limit)
    IF v_plan_limit = -1 THEN
        RETURN jsonb_build_object('allowed', true, 'remaining', -1);
    END IF;

    -- Get current usage count
    SELECT COALESCE(prompt_count, 0) INTO v_current_count
    FROM public.daily_usage
    WHERE user_id = p_user_id
      AND date = CURRENT_DATE;

    -- If no record exists, usage is 0
    IF v_current_count IS NULL THEN
        v_current_count := 0;
    END IF;

    -- Check if limit exceeded
    IF v_current_count >= v_plan_limit THEN
        RETURN jsonb_build_object('allowed', false, 'remaining', 0);
    END IF;

    RETURN jsonb_build_object('allowed', true, 'remaining', v_plan_limit - v_current_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_daily_usage_updated_at
    BEFORE UPDATE ON public.daily_usage
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Daily usage policies
CREATE POLICY "Users can view own usage"
    ON public.daily_usage FOR SELECT
    USING (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view own logs"
    ON public.usage_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can insert usage logs"
    ON public.usage_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Subscription plans policy (anyone can read plans)
CREATE POLICY "Anyone can view subscription plans"
    ON public.subscription_plans FOR SELECT
    USING (true);

-- ============================================
-- GRANTS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to tables
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.daily_usage TO authenticated;
GRANT SELECT, INSERT ON public.usage_logs TO authenticated;
GRANT SELECT ON public.subscription_plans TO anon, authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.increment_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_usage_limit(UUID) TO authenticated;
