import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language names for the prompt
const LANGUAGE_NAMES: Record<string, string> = {
  hi: 'Hindi',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  kn: 'Kannada',
  gu: 'Gujarati',
  ml: 'Malayalam',
  pa: 'Punjabi',
  or: 'Odia',
  as: 'Assamese',
  sa: 'Sanskrit',
  ne: 'Nepali',
  ks: 'Kashmiri',
  es: 'Spanish',
  de: 'German',
  zh: 'Mandarin Chinese',
  id: 'Bahasa Indonesia',
};

// Objective descriptions
const OBJECTIVE_DESCRIPTIONS: Record<string, string> = {
  new_feature: 'Creating a new feature',
  bug_fix: 'Fixing a bug',
  design_improvement: 'Improving the design/UI',
  other: 'General development task',
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

    // Initialize Supabase client
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

    // Parse request body
    const { text, sourceLanguage, objective, additionalContext } = await req.json();

    if (!text || !sourceLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text, sourceLanguage' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const languageName = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage;
    const objectiveDesc = OBJECTIVE_DESCRIPTIONS[objective] || 'General development task';

    // Step 1: Translate to English
    const translateResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator specializing in translating from ${languageName} to English.

Your task:
- Translate the user's spoken text from ${languageName} to English
- Preserve the original meaning and intent precisely
- Keep technical terms, code snippets, numbers, and URLs unchanged
- Handle informal/conversational speech naturally
- Do NOT add explanations or commentary
- Return ONLY the English translation`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!translateResponse.ok) {
      const errorData = await translateResponse.json().catch(() => ({}));
      console.error('Translation API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Translation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const translateResult = await translateResponse.json();
    const translatedText = translateResult.choices[0].message.content.trim();

    // Step 2: Elaborate the prompt for Lovable
    const elaborateResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI prompt engineer specializing in Lovable.dev, a vibe-coding platform for building web applications.

Context from user:
- Objective: ${objectiveDesc}
- Additional context: ${additionalContext || 'None provided'}

Lovable.dev uses the following tech stack:
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui component library
- React Router for navigation
- Tanstack Query for data fetching
- Supabase for backend (optional)

Your task:
- Take the translated prompt and elaborate it for optimal results with Lovable
- Add relevant technical context appropriate to the objective
- Structure the request clearly with bullet points if multiple requirements exist
- Include specific implementation details that would help Lovable generate better code
- Keep the user's core intent unchanged
- Be concise but comprehensive
- For new features: specify UI components, data flow, and interactions
- For bug fixes: clarify expected vs actual behavior
- For design improvements: mention specific UI/UX considerations

Output: Return ONLY the elaborated prompt, no meta-commentary or explanations.`,
          },
          {
            role: 'user',
            content: translatedText,
          },
        ],
        temperature: 0.5,
        max_tokens: 2048,
      }),
    });

    if (!elaborateResponse.ok) {
      const errorData = await elaborateResponse.json().catch(() => ({}));
      console.error('Elaboration API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Elaboration failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const elaborateResult = await elaborateResponse.json();
    const elaboratedText = elaborateResult.choices[0].message.content.trim();

    // Log usage for analytics (non-blocking)
    supabase.from('usage_logs').insert({
      user_id: user.id,
      source_language: sourceLanguage,
      objective: objective,
      additional_context: additionalContext?.substring(0, 500),
      original_text_length: text.length,
      elaborated_text_length: elaboratedText.length,
      tokens_used: (translateResult.usage?.total_tokens || 0) + (elaborateResult.usage?.total_tokens || 0),
    }).then(() => {}).catch(console.error);

    // Return result
    return new Response(
      JSON.stringify({
        original: text,
        translated: translatedText,
        elaborated: elaboratedText,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Translate/Elaborate error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
