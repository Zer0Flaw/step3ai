CREATE OR REPLACE FUNCTION increment_conversion_count(p_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_usage (user_id, conversion_count, plan)
  VALUES (p_user_id, 1, 'free')
  ON CONFLICT (user_id)
  DO UPDATE SET
    conversion_count = user_usage.conversion_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
