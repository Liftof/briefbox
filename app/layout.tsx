import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
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
    <ClerkProvider>
      <html lang="fr">
        <body className={`${lexend.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
