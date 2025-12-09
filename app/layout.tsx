import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "Palette — Des visuels beaux, cohérents, à votre image",
  description: "Entrez votre site, récupérez votre charte, créez des visuels pro en 2 minutes. Pour vos réseaux, vos pubs, tous vos supports.",
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
