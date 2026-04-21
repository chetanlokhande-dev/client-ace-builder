import type { PitchData } from "@/components/pitchforge/PitchPreview";

const industryAngles: Record<string, { pain: string; outcome: string; tools: string[] }> = {
  SaaS: {
    pain: "rapid product iteration without losing brand polish",
    outcome: "ship onboarding flows, landing pages and dashboards that convert trial users into paying customers",
    tools: ["Figma", "React", "Framer Motion", "PostHog"],
  },
  "E-commerce": {
    pain: "low conversion and abandoned carts",
    outcome: "boost AOV and conversion with story-driven product pages and frictionless checkout flows",
    tools: ["Shopify", "Klaviyo", "Figma", "GA4"],
  },
  "Real Estate": {
    pain: "standing out in a crowded local market",
    outcome: "premium listings, neighborhood storytelling and lead-capture funnels that fill your pipeline",
    tools: ["Webflow", "HubSpot", "Photoshop", "Mapbox"],
  },
  Startups: {
    pain: "moving fast without a full in-house team",
    outcome: "launch-ready brand, MVP and investor-ready narrative in weeks, not quarters",
    tools: ["Notion", "Figma", "Next.js", "Supabase"],
  },
  Agencies: {
    pain: "scaling delivery without burning out the team",
    outcome: "white-label execution that lets you take on more retainers with confidence",
    tools: ["Slack", "ClickUp", "Figma", "Webflow"],
  },
};

export function generatePitch(input: {
  title: string;
  description: string;
  details: string;
  links: string;
  industry: string;
}): PitchData {
  const angle = industryAngles[input.industry] ?? industryAngles.SaaS;
  const title = input.title || "A tailored proposal";

  return {
    title: `${title} — built for ${input.industry}`,
    industry: input.industry,
    intro: `Hi! I put together this short deck specifically for ${input.industry} teams tackling ${angle.pain}. Here's how I can help you ${angle.outcome}.`,
    about: input.description ||
      "I'm an independent creator who partners with ambitious teams to design, build and ship work that actually moves the needle.",
    projects: input.details ||
      `Selected work relevant to ${input.industry}: end-to-end engagements where I owned strategy, execution and measurable outcomes.${input.links ? `\n\nReferences: ${input.links}` : ""}`,
    skills: angle.tools,
    value: `You get a senior partner who understands ${input.industry}, ships quickly, and obsesses over the details that drive ${angle.outcome.split(" ").slice(0, 6).join(" ")}…`,
    closing: `If this resonates, I'd love a 20-minute call to map out the first 30 days. — ${title.split("—")[0].trim()}`,
  };
}