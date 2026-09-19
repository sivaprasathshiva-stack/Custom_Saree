import type { MetadataRoute } from "next";

const BASE_URL = "https://sari-studio.vercel.app";

// Public, indexable routes only — account/orders/production/studio are
// excluded (see robots.ts) since they're either private-by-nature or,
// for /studio, an application rather than indexable content.
const PUBLIC_ROUTES = [
  "",
  "/about",
  "/b2b",
  "/collections",
  "/consultation",
  "/contact",
  "/craft",
  "/craft/weavers",
  "/designers",
  "/how-it-works",
  "/journal",
  "/materials",
  "/materials/weaves",
  "/materials/zari",
  "/passport",
  "/privacy",
  "/quality",
  "/sample-program",
  "/shipping",
  "/sustainability",
  "/terms",
  "/textile-room",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}
