// ---------------------------------------------------------------------------
// UTM Link Builder — generates trackable URLs for each ad variation
// Users copy these into their ad platforms instead of raw URLs
// ---------------------------------------------------------------------------

export type UTMParams = {
  source: string;     // facebook, tiktok, google, instagram
  medium: string;     // cpc, social, email
  campaign: string;   // campaign name
  content?: string;   // ad variation name
  term?: string;      // keyword (for search ads)
};

export function buildUTMUrl(baseUrl: string, params: UTMParams): string {
  const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);

  url.searchParams.set("utm_source", slugify(params.source));
  url.searchParams.set("utm_medium", slugify(params.medium));
  url.searchParams.set("utm_campaign", slugify(params.campaign));
  if (params.content) url.searchParams.set("utm_content", slugify(params.content));
  if (params.term) url.searchParams.set("utm_term", slugify(params.term));

  return url.toString();
}

/** Generate UTM links for all variations in a campaign */
export function generateCampaignUTMs(input: {
  siteUrl: string;
  campaignName: string;
  variations: { name: string; platform: string | null }[];
}): { name: string; platform: string; url: string }[] {
  return input.variations.map((v) => {
    const platform = v.platform?.toLowerCase() ?? "other";
    const medium = platform.includes("google") ? "cpc"
      : platform.includes("email") ? "email"
      : "social";

    return {
      name: v.name,
      platform: v.platform ?? "Other",
      url: buildUTMUrl(input.siteUrl, {
        source: platform.split(" ")[0],
        medium,
        campaign: input.campaignName,
        content: v.name,
      }),
    };
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
