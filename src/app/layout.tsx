import type { Metadata, Viewport } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";

import { PWARegister } from "@/components/pwa-register";
import { site } from "@/lib/site";

/**
 * Body text: Geist — clean, legible, humanist sans.
 * Headings: Fraunces — a high-contrast serif with soft + optical-size axes
 *   that lend the editorial, romantic feel a wedding invite deserves.
 *
 * Both load as CSS variables so per-component overrides stay possible; the
 * variable names match what `globals.css` consumes.
 */
const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans-stack",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-stack",
  display: "swap",
  axes: ["SOFT", "opsz"],
});

/**
 * `metadataBase` resolves every relative URL in the metadata graph against
 * this origin. Defaults to localhost so a fresh clone still builds.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: "Gestión de nuestra boda: invitación, confirmaciones e información.",
  applicationName: site.name,
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  // The back-office is private; the guest surface opts back in per-route.
  robots: { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Cool light to match the back-office (the installed app's start_url). The
  // public guest routes override this back to warm in (public)/layout.tsx.
  themeColor: "#F7F9FC",
};

/**
 * Root layout stays chrome-free — no header, no footer. The `(public)`,
 * `(host-public)` and `(host)` route groups own their own shells so each
 * surface presents a coherent UI without leaking across.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${sans.variable} ${display.variable}`}
    >
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
