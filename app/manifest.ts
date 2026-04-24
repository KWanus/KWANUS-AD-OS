import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Himalaya — AI Marketing OS",
    short_name: "Himalaya",
    description: "Build a complete business in 60 seconds. Website, ads, emails, scripts, funnels — built with AI. No skills required.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a08",
    theme_color: "#f5a623",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
