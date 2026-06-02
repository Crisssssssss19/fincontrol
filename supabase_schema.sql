-- ==========================================
-- SCRIPT DE CREACIÓN DE TABLAS PARA FINCONTROL PWA
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase.
-- NOTA DE MIGRACIÓN: Si la tabla public.users ya existe, ejecuta:
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(12, 2) DEFAULT NULL;
-- ==========================================

-- 1. Creación de la Tabla de Usuarios (users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  phone TEXT,
  country TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  monthly_budget NUMERIC(12, 2) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Creación de la Tabla de Ingresos (incomes)
CREATE TABLE IF NOT EXISTS public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Creación de la Tabla de Gastos (expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Creación de la Tabla de Facturas recurrentes (invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Creación de la Tabla de Notificaciones (notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info' | 'success' | 'warning' | 'error'
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de Acceso Completo (Para facilitar pruebas de desarrollo)
-- Nota: En producción puedes limitarlo usando auth.uid() = user_id
CREATE POLICY "Allow public operations on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public operations on incomes" ON public.incomes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public operations on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public operations on invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public operations on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- ACTUALIZACIÓN DE SEGURIDAD (EJECUTAR EN EL SQL EDITOR DE SUPABASE)
-- ==========================================

-- 1. Agregar columnas de seguridad a la tabla de usuarios
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_code TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS failed_verification_attempts INTEGER DEFAULT 0;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS recovery_code TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS recovery_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS failed_recovery_attempts INTEGER DEFAULT 0;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_code TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS failed_two_factor_attempts INTEGER DEFAULT 0;

-- 2. Creación de la Tabla de Auditoría de Seguridad (security_audits)
CREATE TABLE IF NOT EXISTS public.security_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para auditoría
ALTER TABLE public.security_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public operations on security_audits" ON public.security_audits FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- ACTUALIZACIÓN ADICIONAL - MEJORAS FINANCIERAS Y TEMAS
-- (Ejecutar en el SQL Editor de tu Dashboard de Supabase)
-- ==========================================

-- 1. Agregar columnas de presupuestos y apariencia a la tabla de usuarios
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS visual_settings JSONB DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS category_budgets JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS budget_reset_day INTEGER DEFAULT 1;

-- 2. Agregar columnas de ciclo de vida de facturas a la tabla invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS issue_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS due_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT NULL;

-- 3. Creación de la Tabla de Objetivos de Ahorro (savings_goals)
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  target_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para metas de ahorro
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public operations on savings_goals" ON public.savings_goals FOR ALL USING (true) WITH CHECK (true);


