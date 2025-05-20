
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
      
    if (foundUser) {
      console.log(`Found existing user with id: ${foundUser.id}`);
      
      // Return the user ID for an existing user
      return new Response(
        JSON.stringify({ id: foundUser.id, isNewUser: false }),
        { status: 200, headers: corsHeaders }
      );
    }
    
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
        invited_to_project: inviteToProjectId || null
      }
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: createError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
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
    
    // Return the newly created user's ID
    return new Response(
      JSON.stringify({ id: newUser.user.id, isNewUser: true }),
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
