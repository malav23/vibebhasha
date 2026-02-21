import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check usage limit
    const { data: limitCheck, error: limitError } = await supabase.rpc('check_usage_limit', {
      p_user_id: user.id,
    });

    if (limitError) {
      console.error('Usage limit check error:', limitError);
      return new Response(
        JSON.stringify({ error: 'Failed to check usage limit' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached', remaining: 0 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get audio from request
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (25MB max for Whisper)
    const maxSize = 25 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'Audio file too large (max 25MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Whisper API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile, 'recording.webm');
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('response_format', 'verbose_json');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: whisperFormData,
    });

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json().catch(() => ({}));
      console.error('Whisper API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Transcription failed', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whisperResult = await whisperResponse.json();

    // Increment usage counter
    const { error: incrementError } = await supabase.rpc('increment_usage', {
      p_user_id: user.id,
    });

    if (incrementError) {
      console.error('Failed to increment usage:', incrementError);
      // Don't fail the request, just log the error
    }

    // Return transcription result
    return new Response(
      JSON.stringify({
        text: whisperResult.text,
        language: whisperResult.language,
        duration: whisperResult.duration,
        remaining: limitCheck.remaining - 1,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
