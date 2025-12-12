import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- THIS WAS MISSING
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  // 1. Browser Tab Title (Search says Modul. Studio)
  title: "Modul. Studio | Privacy-First Media Tools",
  // 2. WhatsApp/Social Media Preview (The new tagline)
  description: "The privacy-first media studio. Convert, remove backgrounds, and transcribe audio, run entirely on your device.",
  
  // 3. FAVICON/ICON CONFIGURATION
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
    other: [
        {
            rel: 'mask-icon',
            url: '/safari-pinned-tab.svg', // Assuming you made this file for Safari
            color: '#ff6600', // Modul orange/red
        },
        {
            rel: 'icon',
            type: 'image/png',
            sizes: '32x32',
            url: '/favicon-32x32.png',
        },
        {
            rel: 'icon',
            type: 'image/png',
            sizes: '192x192',
            url: '/android-chrome-192x192.png',
        },
    ]
  },

  // 4. OpenGraph/Sharing data
  openGraph: {
    title: "Modul. Studio | Privacy-First Media Tools",
    description: "The privacy-first media studio. Convert, remove backgrounds, and transcribe audio, run entirely on your device.",
    url: "https://modul-eight.vercel.app", 
    siteName: "Modul. Studio",
    locale: 'en-GB', 
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}