import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, temporaryPassword } = await req.json();

    if (!userId || !temporaryPassword) {
      throw new Error('userId e temporaryPassword são obrigatórios');
    }

    // Update the user's password
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { password: temporaryPassword }
    );

    if (updateError) throw updateError;

    // Mark that user needs to change password
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ requires_password_change: true })
      .eq('user_id', userId);

    if (profileError) throw profileError;

    return new Response(
      JSON.stringify({ success: true, message: 'Senha temporária definida com sucesso' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});