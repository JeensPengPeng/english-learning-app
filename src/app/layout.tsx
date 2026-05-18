import type { Metadata, Viewport } from "next";
import SWRegistration from "@/components/SWRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "课后英语复习",
  description: "课后单词录入、发音、跟读复习",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "英语复习",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="英语复习" />
      </head>
      <body className="min-h-screen flex flex-col bg-emerald-50 text-gray-900 antialiased select-none">
        <SWRegistration />
        {children}
      </body>
    </html>
  );
}
