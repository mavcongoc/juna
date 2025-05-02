-- Migration SQL for enabling RLS and defining policies
-- File: lib/migrations/apply_rls_policies.sql

-- 1. Helper function to get the role of the current user
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
LANGUAGE sql
SECURITY DEFINER
-- Set a secure search_path: IMPORTANT to prevent search path hijacking
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO service_role; -- Allow service role to use it too

-- ============================================================================
-- RLS Policies for User Data Tables
-- ============================================================================

-- Table: user_profiles (Verify/Update existing policies if needed)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;
-- Drop existing policies if necessary before creating new ones
DROP POLICY IF EXISTS "Allow individual user access" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow admin read access" ON public.user_profiles;
-- Policies
CREATE POLICY "Allow individual user access" ON public.user_profiles
  FOR ALL -- Users can SELECT, INSERT, UPDATE, DELETE their own profile
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow admin read access" ON public.user_profiles
  FOR SELECT -- Admins can read any profile
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- Table: journal_entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user access" ON public.journal_entries;
DROP POLICY IF EXISTS "Allow admin read access" ON public.journal_entries;
-- Policies
CREATE POLICY "Allow individual user access" ON public.journal_entries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow admin read access" ON public.journal_entries
  FOR SELECT
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- Table: clinical_profiles (Assuming a user_id column exists)
ALTER TABLE public.clinical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_profiles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user access" ON public.clinical_profiles;
DROP POLICY IF EXISTS "Allow admin read access" ON public.clinical_profiles;
-- Policies
CREATE POLICY "Allow individual user access" ON public.clinical_profiles
  FOR ALL
  USING (auth.uid() = user_id) -- Adjust column name if different
  WITH CHECK (auth.uid() = user_id); -- Adjust column name if different
CREATE POLICY "Allow admin read access" ON public.clinical_profiles
  FOR SELECT
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- Table: mental_health_domains (Assuming linked to clinical_profiles or user_id)
-- Example: Assuming it links via clinical_profile_id which links to user_id
ALTER TABLE public.mental_health_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_health_domains FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow related user access" ON public.mental_health_domains;
DROP POLICY IF EXISTS "Allow admin read access" ON public.mental_health_domains;
-- Policies (adjust based on actual schema)
CREATE POLICY "Allow related user access" ON public.mental_health_domains
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.clinical_profiles WHERE id = clinical_profile_id))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.clinical_profiles WHERE id = clinical_profile_id));
CREATE POLICY "Allow admin read access" ON public.mental_health_domains
  FOR SELECT
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- Table: profile_tags (Similar logic to mental_health_domains)
ALTER TABLE public.profile_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_tags FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow related user access" ON public.profile_tags;
DROP POLICY IF EXISTS "Allow admin read access" ON public.profile_tags;
-- Policies (adjust based on actual schema)
CREATE POLICY "Allow related user access" ON public.profile_tags
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.clinical_profiles WHERE id = clinical_profile_id))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.clinical_profiles WHERE id = clinical_profile_id));
CREATE POLICY "Allow admin read access" ON public.profile_tags
  FOR SELECT
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- Table: growth_milestones (Similar logic)
ALTER TABLE public.growth_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_milestones FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow related user access" ON public.growth_milestones;
DROP POLICY IF EXISTS "Allow admin read access" ON public.growth_milestones;
-- Policies (adjust based on actual schema)
CREATE POLICY "Allow related user access" ON public.growth_milestones
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.clinical_profiles WHERE id = clinical_profile_id))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.clinical_profiles WHERE id = clinical_profile_id));
CREATE POLICY "Allow admin read access" ON public.growth_milestones
  FOR SELECT
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- Table: linked_evidence (Similar logic)
ALTER TABLE public.linked_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linked_evidence FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow related user access" ON public.linked_evidence;
DROP POLICY IF EXISTS "Allow admin read access" ON public.linked_evidence;
-- Policies (adjust based on actual schema)
CREATE POLICY "Allow related user access" ON public.linked_evidence
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.clinical_profiles WHERE id = clinical_profile_id))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.clinical_profiles WHERE id = clinical_profile_id));
CREATE POLICY "Allow admin read access" ON public.linked_evidence
  FOR SELECT
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- Table: entry_tags (Assuming links to journal_entries which links to user_id)
ALTER TABLE public.entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_tags FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow related user access" ON public.entry_tags;
DROP POLICY IF EXISTS "Allow admin read access" ON public.entry_tags;
-- Policies (adjust based on actual schema)
CREATE POLICY "Allow related user access" ON public.entry_tags
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.journal_entries WHERE id = entry_id))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.journal_entries WHERE id = entry_id));
CREATE POLICY "Allow admin read access" ON public.entry_tags
  FOR SELECT
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- Table: entry_categories (Similar logic to entry_tags)
ALTER TABLE public.entry_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_categories FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow related user access" ON public.entry_categories;
DROP POLICY IF EXISTS "Allow admin read access" ON public.entry_categories;
-- Policies (adjust based on actual schema)
CREATE POLICY "Allow related user access" ON public.entry_categories
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.journal_entries WHERE id = entry_id))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.journal_entries WHERE id = entry_id));
CREATE POLICY "Allow admin read access" ON public.entry_categories
  FOR SELECT
  USING (public.get_my_role() IN ('admin', 'super_admin'));


-- ============================================================================
-- RLS Policies for Admin/Config Tables
-- ============================================================================

-- Table: prompts
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin access" ON public.prompts;
-- Policies
CREATE POLICY "Allow admin access" ON public.prompts
  FOR ALL -- Admins/Super Admins have full control
  USING (public.get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'super_admin'));

-- Table: prompt_versions
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin access" ON public.prompt_versions;
-- Policies
CREATE POLICY "Allow admin access" ON public.prompt_versions
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'super_admin'));

-- Table: prompt_usage
ALTER TABLE public.prompt_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_usage FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin access" ON public.prompt_usage;
-- Policies
CREATE POLICY "Allow admin access" ON public.prompt_usage
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'super_admin'));

-- Table: prompt_test_results
ALTER TABLE public.prompt_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_test_results FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin access" ON public.prompt_test_results;
-- Policies
CREATE POLICY "Allow admin access" ON public.prompt_test_results
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'super_admin'));

-- Table: admin_users (If it still exists and is needed)
-- Check if table exists before altering (optional but safer)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_users') THEN
    ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.admin_users FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow admin access" ON public.admin_users;
    -- Policies (Restrict to super_admin maybe, as user_roles is primary now?)
    CREATE POLICY "Allow admin access" ON public.admin_users
      FOR ALL
      USING (public.get_my_role() IN ('admin', 'super_admin')) -- Or maybe just 'super_admin'?
      WITH CHECK (public.get_my_role() IN ('admin', 'super_admin'));
  END IF;
END $$;

-- ============================================================================
-- RLS Policies for user_roles Table (Refined)
-- ============================================================================
-- Drop placeholder policies from initial migration
DROP POLICY IF EXISTS "Allow admin read access" ON public.user_roles;
DROP POLICY IF EXISTS "Allow super_admin full access" ON public.user_roles;

-- Policies for user_roles:
-- 1. Users cannot access this table directly via RLS. Access is via get_my_role().
-- 2. Admins can read all roles.
CREATE POLICY "Allow admin read access" ON public.user_roles
  FOR SELECT
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- 3. Super Admins can manage roles (SELECT, INSERT, UPDATE, DELETE).
CREATE POLICY "Allow super_admin full access" ON public.user_roles
  FOR ALL
  USING (public.get_my_role() = 'super_admin')
  WITH CHECK (public.get_my_role() = 'super_admin');