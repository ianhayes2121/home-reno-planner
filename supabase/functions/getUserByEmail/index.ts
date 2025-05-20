
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// This function will fetch or invite a user by email
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { 
        auth: { persistSession: false } 
      }
    );
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify the JWT to ensure the requester is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse the request to get the email and invitation details
    const requestData = await req.json().catch(() => ({ email: null }));
    const { email, inviteToProjectId } = requestData;
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if inviteToProjectId is provided when trying to invite a user
    if (!inviteToProjectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID is required for invitations' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify that the requesting user is a project admin/owner
    const { data: projectRole, error: projectRoleError } = await supabaseAdmin
      .from('project_users')
      .select('role')
      .eq('project_id', inviteToProjectId)
      .eq('user_id', user.id)
      .single();

    if (projectRoleError || !projectRole || !['owner', 'admin'].includes(projectRole.role)) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to invite users to this project' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`Looking up user with email: ${normalizedEmail}`);

    // Use admin.listUsers to find a user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: normalizedEmail,
      },
    });

    if (userError) {
      console.error('Error querying users:', userError);
      return new Response(
        JSON.stringify({ error: 'Database query failed', details: userError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Find the first non-deleted user
    const foundUser = userData && userData.users.length > 0 ? 
      userData.users.find(user => !user.banned_until && !user.deleted_at) : null;
      
    let targetUserId;
    let isNewUser = false;

    if (foundUser) {
      console.log(`Found existing user with id: ${foundUser.id}`);
      targetUserId = foundUser.id;
    } else {
      // User not found, create a new user with invitation
      console.log(`No user found with email: ${normalizedEmail}. Creating invitation...`);
      
      // Generate a secure random password (user will reset it)
      const tempPassword = crypto.randomUUID().replace(/-/g, '');
      
      // Create the user with the admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          invited_by: user.id,
          invited_to_project: inviteToProjectId
        }
      });
      
      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user', details: createError.message }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Create a profile record for the new user
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: normalizedEmail,
          first_name: '',
          last_name: ''
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Continue anyway as this isn't critical
      }
      
      targetUserId = newUser.user.id;
      isNewUser = true;
      
      // Send the password reset email so the user can set their own password
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail,
        options: {
          redirectTo: `${Deno.env.get("SITE_URL") || 'https://home-reno-planner.lovable.app'}/settings`
        }
      });
      
      if (resetError) {
        console.error('Error sending password reset:', resetError);
        return new Response(
          JSON.stringify({ error: 'Created user but failed to send password reset email', details: resetError.message }),
          { status: 500, headers: corsHeaders }
        );
      }
      
      console.log(`Created new user with id: ${newUser.user.id} and sent password reset email`);
    }
    
    // Check if the user is already a member of this project
    const { data: existingMember, error: memberError } = await supabaseAdmin
      .from('project_users')
      .select('id')
      .eq('project_id', inviteToProjectId)
      .eq('user_id', targetUserId)
      .single();

    if (!memberError && existingMember) {
      return new Response(
        JSON.stringify({ error: 'This user is already a member of the project' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Add the user to the project_users table (using admin privileges to bypass RLS)
    const { error: addError } = await supabaseAdmin
      .from('project_users')
      .insert({
        project_id: inviteToProjectId,
        user_id: targetUserId,
        role: 'member',
        is_pending: isNewUser
      });

    if (addError) {
      console.error('Error adding user to project:', addError);
      return new Response(
        JSON.stringify({ error: 'Failed to add user to project', details: addError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Get the user's profile to return
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', targetUserId)
      .single();

    // Return the success response with user details
    return new Response(
      JSON.stringify({ 
        id: targetUserId, 
        isNewUser,
        email: normalizedEmail,
        profile: profile || { email: normalizedEmail },
        role: 'member',
        isPending: isNewUser
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in getUserByEmail function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
