import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import Script from "next/script";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "Palette — Vos visuels de marque en 60 secondes",
  description: "Votre marque est importée depuis votre site web. Décrivez ce que vous voulez. Des visuels pros, cohérents, 100% à votre image — sans graphiste, sans agence.",
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
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
        </body>
      </html>
    </ClerkProvider>
  );
}
