
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

// This function will fetch a user by email without exposing sensitive auth table data
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

    // Parse the request to get the email
    const { email } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`Looking up user with email: ${normalizedEmail}`);

    // Query the auth.users table to find the user by email (case insensitive)
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .ilike('email', normalizedEmail);

    if (userError) {
      console.error('Error querying users:', userError);
      return new Response(
        JSON.stringify({ error: 'Database query failed' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!users || users.length === 0) {
      console.log('No user found with email:', normalizedEmail);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    const foundUser = users[0];
    console.log(`Found user with id: ${foundUser.id}`);

    // Return the user ID (without exposing other sensitive auth info)
    return new Response(
      JSON.stringify({ id: foundUser.id }),
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
