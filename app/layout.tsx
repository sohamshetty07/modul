import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

// 1. VIEWPORT CONFIG (Critical for PWA "App-like" feel)
// This prevents zooming on inputs and sets the browser theme color
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  // 2. BASIC METADATA
  title: "Modul. Studio | Privacy-First Media Tools",
  description: "The privacy-first media studio. Convert, remove backgrounds, and transcribe audio, run entirely on your device.",
  
  // 3. PWA CONFIGURATION
  manifest: "/manifest.json", // Links to the file we created
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // Makes the app extend behind the notch
    title: "Modul.", // The name below the icon on iOS Home Screen
  },

  // 4. ICONS (Preserved your detailed setup)
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
    other: [
        {
            rel: 'mask-icon',
            url: '/safari-pinned-tab.svg',
            color: '#ff6600',
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

  // 5. OPENGRAPH / SOCIAL
  openGraph: {
    title: "Modul. Studio | Privacy-First Media Tools",
    description: "The privacy-first media studio. Convert, remove backgrounds, and transcribe audio, run entirely on your device.",
    url: "https://modul-eight.vercel.app", 
    siteName: "Modul. Studio",
    locale: 'en-GB', 
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Added 'dark' class to html and basic background styles to body 
    // to prevent white flashes during page loads on mobile.
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-slate-200 antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}