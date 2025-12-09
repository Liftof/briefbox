import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "Palette — Visuels pro générés par IA, à votre image",
  description: "L'IA analyse votre marque et génère des visuels beaux, cohérents, 100% on-brand. Pour vos réseaux, vos pubs, automatiquement.",
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
    <ClerkProvider>
      <html lang="fr">
        <body className={`${lexend.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
