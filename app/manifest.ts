import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Himalaya — AI Marketing OS",
    short_name: "Himalaya",
    description: "The complete marketing engine: AI-powered funnel builder, ad creatives, email automations, and competitive intelligence.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a08",
    theme_color: "#06b6d4",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
