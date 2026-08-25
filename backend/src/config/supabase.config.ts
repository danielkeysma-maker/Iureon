import { createClient } from '@supabase/supabase-js';
import { config } from './env.config';

/**
 * TWO CLIENTS, AND THE SEPARATION IS A SECURITY BOUNDARY, NOT TIDINESS.
 *
 * `signInWithPassword` and `refreshSession` MUTATE the client they run on: the
 * instance stops sending the service key and starts sending that user's access
 * token, so every later `.from()` call on it runs as that user, under RLS.
 *
 * Caught by a test that registered two firms in one process. The first
 * succeeded; the second failed with "new row violates row-level security policy
 * for table firms", because registering signs the new administrator in and the
 * shared client had quietly become them. On a warm serverless instance serving
 * several requests, that is worse than an error: the tenant of whoever signed
 * in last would follow into somebody else's request.
 *
 * So sign-in gets its own instance and never touches the database, and the
 * service client never signs anyone in.
 */

const configured = Boolean(config.supabase.url && config.supabase.serviceKey);

/**
 * Database and admin operations. Bypasses RLS by design — every query filters
 * by firm in code — and must never be used to sign a user in.
 */
export const supabase = configured
  ? createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

/**
 * Credential checks only: sign in, refresh, and verifying a bearer token.
 *
 * Isolated so the session it acquires cannot reach any table, and disposable in
 * spirit: nothing here should ever call `.from()`.
 */
export const supabaseAuth = configured
  ? createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;
