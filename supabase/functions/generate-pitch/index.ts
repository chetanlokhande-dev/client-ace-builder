const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PitchInput {
  title?: string;
  description?: string;
  details?: string;
  links?: string;
  industry?: string;
}

const SYSTEM_PROMPT = `You are a senior pitch strategist and copywriter who has written winning proposals for top consultancies and creative studios. Your job is to transform a freelancer/creator's raw, often messy portfolio notes into a polished, industry-grade pitch deck tailored to a specific client industry.

Follow this internal process before producing output:
1. READ the user's title, description, project details and links carefully.
2. ASSESS coherence: do the inputs describe the same person/offer, or are some fields off-topic / noise? Silently ignore irrelevant fragments and lean on the strongest signals.
3. IMPROVE the prose: fix grammar, vocabulary, sentence structure and tone. Remove filler, clichés and hype words. Keep the user's authentic voice.
4. INFER skills that are genuinely relevant to BOTH (a) what the user actually described and (b) the target industry. Do not invent skills the user has no signal for. 5–8 skills max, specific tools/disciplines (e.g. "Conversion copywriting", "Shopify Hydrogen"), not generic words like "Communication".
5. WRITE a 6-slide pitch with a confident, executive-grade closing that proposes a concrete next step.

Output rules:
- Return ONLY a function call to "return_pitch". No prose outside the tool call.
- Each text field: tight, specific, no emojis, no markdown headings, no bullet symbols inside strings.
- "intro": 2–3 sentences, addresses the industry's real pain.
- "about": 2–3 sentences, credibility + positioning.
- "projects": 3–5 sentences summarizing relevant work and outcomes (use numbers if implied; otherwise stay specific but honest). If links were provided, weave them in naturally at the end.
- "value": 2–3 sentences, why THIS person for THIS industry — outcomes, not adjectives.
- "closing": 2–3 sentences. Confident, warm, ends with a clear next step (e.g. a 20-minute call, a paid discovery sprint). Sign off with the user's name/title if inferable.
- "title": short headline for the deck, max ~70 chars.
`;

const PITCH_TOOL = {
  type: "function" as const,
  function: {
    name: "return_pitch",
    description: "Return the finalized, polished pitch deck.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        industry: { type: "string" },
        intro: { type: "string" },
        about: { type: "string" },
        projects: { type: "string" },
        skills: {
          type: "array",
          items: { type: "string" },
          minItems: 4,
          maxItems: 8,
        },
        value: { type: "string" },
        closing: { type: "string" },
      },
      required: ["title", "industry", "intro", "about", "projects", "skills", "value", "closing"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const input = (await req.json()) as PitchInput;
    const industry = (input.industry || "").trim() || "General";

    const userMsg = `CLIENT INDUSTRY: ${industry}

PORTFOLIO TITLE: ${input.title || "(not provided)"}

SHORT DESCRIPTION:
${input.description || "(not provided)"}

PROJECT DETAILS:
${input.details || "(not provided)"}

LINKS:
${input.links || "(none)"}

Produce the polished pitch now.`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        tools: [PITCH_TOOL],
        tool_choice: { type: "function", function: { name: "return_pitch" } },
      }),
    });

    if (resp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (resp.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      console.error("No tool call in response", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Model did not return a structured pitch" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pitch = JSON.parse(call.function.arguments);
    pitch.industry = pitch.industry || industry;

    return new Response(JSON.stringify({ pitch }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pitch error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});