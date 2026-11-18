import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import Footer from "@/app/components/Footer";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Icons: app/favicon.ico (16/32/48), app/icon.png (192), app/apple-icon.png
// (180); app/manifest.ts; link previews: app/opengraph-image.tsx and
// twitter-image.tsx. All from the app's lime R on black.
export const metadata: Metadata = {
  metadataBase: new URL("https://repflowcoach.com"),
  title: "Repflow",
  description: "Repflow Coaching",
  applicationName: "Repflow",
  openGraph: { type: "website", siteName: "Repflow" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
