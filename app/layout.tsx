import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import { Toaster } from "@/components/ui/toaster";
import { PrivacyShield } from "@/components/dashboard/privacy-shield";

const inter = Inter({ subsets: ["latin"] });

// 1. VIEWPORT CONFIG (Critical for PWA "Bunker Mode" experience)
export const viewport: Viewport = {
  themeColor: "#000000", // Matches your bg-black
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming, feels native
  viewportFit: "cover", // Ensures full screen on notched iPhones
};

export const metadata: Metadata = {
  // 2. UPDATED MISSION METADATA
  title: "Modul. Studio | The Privacy-First Media OS",
  description: "Bunker Mode enabled. 100% local processing for video, audio, and documents using WASM and Edge AI.",
  
  // 3. PWA CONFIGURATION
  // Next.js 15 app/manifest.ts generates this route automatically:
  manifest: "/manifest.webmanifest", 
  
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", 
    title: "Modul.",
    startupImage: [
       // Optional: You can add specific startup images here later
    ] 
  },

  // 4. ICONS & BRANDING
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
    title: "Modul. Studio | The Privacy-First Media OS",
    description: "Convert, edit, and redact media without your data ever leaving your browser.",
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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-slate-200 antialiased selection:bg-orange-500/30`}>
        {/* Main Application Content */}
        {children}
        
        {/* Real-time Network Monitor (Module A: Privacy Shield) */}
        <PrivacyShield />
        
        {/* Notifications */}
        <Toaster />
      </body>
    </html>
  );
}