-- Fix: RLS policies call has_role(); authenticated must be allowed to execute it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
