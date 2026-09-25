import type { Metadata } from "next";
import { Archivo, Inter, IBM_Plex_Mono, Cormorant_Garamond } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SiteLoader } from "@/components/layout/site-loader";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { IdleLogout } from "@/components/auth/idle-logout";

const display = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Editorial serif for marketing headlines (home page first, rolled out per page).
const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "VELVOREA — Weave your idea",
  description:
    "A digital studio for creating bespoke silk sarees, from material and colour to motif, border and pallu — physically manufactured to your specification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${sans.variable} ${serif.variable} ${mono.variable} antialiased bg-ivory text-charcoal`}
      >
        <SiteLoader />
        <WebVitalsReporter />
        <IdleLogout />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
