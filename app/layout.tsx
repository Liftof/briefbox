import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "Palette — Brand visuals in 60 seconds",
  description: "Import your brand from your website. Describe what you want. Professional visuals, 100% on-brand — no designer, no agency, no waiting.",
  keywords: ["brand visuals", "AI design", "marketing visuals", "social media graphics", "brand identity", "visual content", "AI graphics generator"],
  authors: [{ name: "Palette" }],
  creator: "Palette",
  publisher: "Palette",
  metadataBase: new URL("https://thepalette.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo-icon.webp",
    apple: "/logo-icon.webp",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "fr_FR",
    url: "https://thepalette.app",
    siteName: "Palette",
    title: "Palette — Brand visuals in 60 seconds",
    description: "Import your brand from your website. Describe what you want. Professional visuals, 100% on-brand — no designer, no agency.",
    images: [
      {
        url: "/og-image.png",
        width: 2146,
        height: 1260,
        alt: "Palette - Brand visuals in 60 seconds",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Palette — Brand visuals in 60 seconds",
    description: "Import your brand from your website. Describe what you want. Professional visuals, 100% on-brand — no designer, no agency.",
    images: ["/og-image.png"],
    creator: "@usepalette",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signUpFallbackRedirectUrl="/playground"
      signInFallbackRedirectUrl="/playground"
    >
      <html lang="fr">
        <body className={`${lexend.variable} font-sans antialiased`}>
          <Script
            src="https://datafa.st/js/script.js"
            data-website-id="dfid_vm5cEXUj8yn95kKYS6Ttx"
            data-domain="thepalette.app"
            strategy="afterInteractive"
          />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
