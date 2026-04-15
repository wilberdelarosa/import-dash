
-- Table for AI tool call auditing
CREATE TABLE public.ai_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  user_email text,
  tool_name text NOT NULL,
  tool_args jsonb DEFAULT '{}'::jsonb,
  result_summary text,
  affected_table text,
  affected_id text,
  success boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.ai_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow service role inserts (edge functions use service_role_key)
CREATE POLICY "Service role can insert audit logs"
  ON public.ai_audit_log FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also allow authenticated inserts for edge functions using user JWT
CREATE POLICY "Authenticated can insert audit logs"
  ON public.ai_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for querying by tool
CREATE INDEX idx_ai_audit_log_tool ON public.ai_audit_log (tool_name);
CREATE INDEX idx_ai_audit_log_created ON public.ai_audit_log (created_at DESC);
