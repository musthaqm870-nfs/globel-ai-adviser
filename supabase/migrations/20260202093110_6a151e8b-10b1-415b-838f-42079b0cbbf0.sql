-- Create API usage table for rate limiting
CREATE TABLE public.api_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_api_usage_user_endpoint_window ON public.api_usage (user_id, endpoint, window_start);

-- Enable RLS
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view their own usage"
ON public.api_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage records
CREATE POLICY "Users can insert their own usage"
ON public.api_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage records
CREATE POLICY "Users can update their own usage"
ON public.api_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests integer,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamp with time zone;
  v_current_count integer;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Get current request count in the window
  SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
  FROM api_usage
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;
  
  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Insert new usage record
  INSERT INTO api_usage (user_id, endpoint, request_count, window_start)
  VALUES (p_user_id, p_endpoint, 1, now());
  
  RETURN true;
END;
$$;