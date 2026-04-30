const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AssistantInput {
  mode: "improvise" | "simplify" | "from-link" | "from-skills";
  currentPitch?: unknown;
  industry?: string;
  skills?: string;
  sourcePitch?: unknown;
}

const PITCH_TOOL = {
  type: "function" as const,
  function: {
    name: "return_pitch",
    description: "Return the rewritten pitch deck.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        industry: { type: "string" },
        intro: { type: "string" },
        about: { type: "string" },
        projects: { type: "string" },
        skills: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 8 },
        value: { type: "string" },
        closing: { type: "string" },
      },
      required: ["title", "industry", "intro", "about", "projects", "skills", "value", "closing"],
      additionalProperties: false,
    },
  },
};

const systemFor = (mode: string) => {
  const base = `You are a senior pitch strategist. Return ONLY a tool call to return_pitch with the rewritten 6-slide pitch. Keep it concrete, numbers-friendly, no emojis or markdown. Closing must propose a clear next step.`;
  switch (mode) {
    case "improvise": return base + " IMPROVISE: elevate vocabulary, sentence rhythm, and persuasive force without inventing facts.";
    case "simplify": return base + " SIMPLIFY: shorten sentences, plain English, ~grade-8 reading level, keep substance.";
    case "from-link": return base + " The user pasted an existing pitch (sourcePitch). Generate a fresh, more engaging pitch that builds on it without copying.";
    case "from-skills": return base + " The user provided their existing skills. Rebuild the pitch around those skills and the target industry.";
    default: return base;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const input = (await req.json()) as AssistantInput;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const userMsg = JSON.stringify({
      mode: input.mode,
      industry: input.industry || "General",
      currentPitch: input.currentPitch ?? null,
      sourcePitch: input.sourcePitch ?? null,
      skills: input.skills || null,
    });

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemFor(input.mode) },
          { role: "user", content: userMsg },
        ],
        tools: [PITCH_TOOL],
        tool_choice: { type: "function", function: { name: "return_pitch" } },
      }),
    });

    if (resp.status === 429)
      return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402)
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments)
      return new Response(JSON.stringify({ error: "No structured pitch returned" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const pitch = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify({ pitch }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("pitch-assistant error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
