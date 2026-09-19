import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/orders", "/production", "/studio"],
    },
    sitemap: "https://sari-studio.vercel.app/sitemap.xml",
  };
}
