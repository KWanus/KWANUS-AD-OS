import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://himalaya.co";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/s/", // Published sites are public
        disallow: [
          "/api/",
          "/settings",
          "/billing",
          "/onboarding",
          "/setup",
          "/my-system",
          "/clients",
          "/leads",
          "/campaigns",
          "/emails",
          "/analyses",
          "/copilot",
          "/skills",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
