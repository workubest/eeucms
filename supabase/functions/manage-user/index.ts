import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: string;
  region?: string;
  serviceCenter?: string;
  active: boolean;
}

interface UpdateUserRequest {
  userId: string;
  name: string;
  role: string;
  region?: string;
  serviceCenter?: string;
  active: boolean;
}

interface DeleteUserRequest {
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the user and check if they're an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { action, data } = await req.json();

    console.log('Action:', action, 'by user:', user.email);

    if (action === 'create') {
      const userData = data as CreateUserRequest;
      console.log('Creating user:', userData.email);

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.name,
          name: userData.name
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        // Handle specific error cases - check for email_exists error code
        if (authError.code === 'email_exists' || authError.message?.includes('already been registered')) {
          return new Response(
            JSON.stringify({ error: 'A user with this email already exists' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        throw authError;
      }
      if (!authData.user) throw new Error('Failed to create user');

      console.log('Auth user created:', authData.user.id);

      // Wait a bit for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          name: userData.name,
          full_name: userData.name,
          region: userData.region || null,
          service_center: userData.serviceCenter || null,
          active: userData.active
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      console.log('Profile updated');

      // Update role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: userData.role })
        .eq('user_id', authData.user.id);

      if (roleError) {
        console.error('Role error:', roleError);
        throw roleError;
      }

      console.log('Role updated');

      return new Response(
        JSON.stringify({ success: true, userId: authData.user.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'update') {
      const userData = data as UpdateUserRequest;
      console.log('Updating user:', userData.userId);

      // Update profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          name: userData.name,
          full_name: userData.name,
          region: userData.region || null,
          service_center: userData.serviceCenter || null,
          active: userData.active
        })
        .eq('id', userData.userId);

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      // Update role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: userData.role })
        .eq('user_id', userData.userId);

      if (roleError) {
        console.error('Role error:', roleError);
        throw roleError;
      }

      console.log('User updated successfully');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'delete') {
      const { userId } = data as DeleteUserRequest;
      console.log('Deleting user:', userId);

      // Delete auth user (this will cascade to profiles and roles via foreign keys)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      console.log('User deleted successfully');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
