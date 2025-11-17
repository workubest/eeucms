import { supabase, isSupabaseAvailable } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://wuewukvvnvnkvzyvksxq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1ZXd1a3Z2bnZua3Z6eXZrc3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0NTUsImV4cCI6MjA2MjAyMzQ1NX0.P9K3aCvl6MlGIqv0hBjAzwFwAuK4lUX4ZUqpQcG8ZDU";

export interface HealthCheckResult {
  isHealthy: boolean;
  message: string;
  details?: any;
}

/**
 * Checks if the Supabase backend is accessible
 * Sends proper Authorization header with anon key
 */
export async function checkBackendHealth(): Promise<HealthCheckResult> {
  // If Supabase is not available, return unhealthy
  if (!isSupabaseAvailable) {
    return {
      isHealthy: false,
      message: 'Supabase not configured or invalid URL'
    };
  }

  try {
    // Test 1: Check Supabase connection with a simple query
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (error) {
      // If we get a 401, it means the function is deployed but auth failed
      if (error.message.includes('JWT')) {
        return {
          isHealthy: false,
          message: 'Authentication failed. Please verify your Supabase configuration.',
          details: error
        };
      }

      // Other errors might mean tables don't exist yet (expected for new projects)
      return {
        isHealthy: true,
        message: 'Backend online (tables need setup)',
        details: error
      };
    }

    return {
      isHealthy: true,
      message: 'Backend fully operational'
    };
  } catch (error: any) {
    return {
      isHealthy: false,
      message: 'Cannot connect to backend',
      details: error
    };
  }
}

/**
 * Run diagnostics on the Supabase configuration
 */
export async function runDiagnostics() {
  const results = {
    projectId: '',
    anonKeyPresent: false,
    anonKeyValid: false,
    networkConnectivity: false,
    authenticationWorking: false,
    tablesExist: false,
    supabaseAvailable: isSupabaseAvailable,
    errors: [] as string[]
  };

  // If Supabase is not available, skip most checks
  if (!isSupabaseAvailable) {
    results.errors.push('Supabase client not initialized - invalid or missing configuration');
    return results;
  }

  // Check project ID
  const projectMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
  results.projectId = projectMatch ? projectMatch[1] : 'Invalid URL format';

  // Check anon key
  results.anonKeyPresent = !!SUPABASE_ANON_KEY;

  // Validate JWT format
  if (SUPABASE_ANON_KEY) {
    const parts = SUPABASE_ANON_KEY.split('.');
    results.anonKeyValid = parts.length === 3;
    if (!results.anonKeyValid) {
      results.errors.push('Anon key is not a valid JWT format');
    }
  }

  // Test network connectivity
  try {
    const response = await fetch(SUPABASE_URL, { method: 'HEAD' });
    results.networkConnectivity = true;
  } catch (error) {
    results.errors.push('Cannot reach Supabase URL - network issue');
  }

  // Test authentication
  try {
    const { error } = await supabase.auth.getSession();
    results.authenticationWorking = !error;
    if (error) {
      results.errors.push(`Auth error: ${error.message}`);
    }
  } catch (error: any) {
    results.errors.push(`Auth exception: ${error.message}`);
  }

  // Test tables existence
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    results.tablesExist = !error || !error.message.includes('does not exist');
  } catch (error) {
    // Tables might not exist yet, that's ok
  }

  return results;
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };

