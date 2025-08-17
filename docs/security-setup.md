# Database Security Setup Guide

## Current Status
✅ **No security issues found** - Your database has no public tables yet, so the RLS warning is expected.

## When You Add Tables, Follow These Patterns:

### 1. Always Enable RLS on New Tables
```sql
-- Example: Creating a secure chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRITICAL: Always enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
```

### 2. Create Proper RLS Policies
```sql
-- Users can only see their own messages
CREATE POLICY "Users can view own messages" 
ON public.chat_messages 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert their own messages
CREATE POLICY "Users can insert own messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
```

### 3. For User Profiles (Common Pattern)
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Public read, own user write
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

## Auth Configuration Note
- Your OTP expiry is longer than recommended (24h vs 1h)
- This is fine for development but consider shortening for production

## Next Steps
When you're ready to add data storage (chat history, user preferences, etc.), use the migration tool and these patterns will keep your data secure.