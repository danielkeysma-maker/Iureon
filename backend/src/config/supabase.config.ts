import { createClient } from '@supabase/supabase-js';
import { config } from './env.config';

export const supabase = config.supabase.url && config.supabase.serviceKey
  ? createClient(config.supabase.url, config.supabase.serviceKey)
  : null;
