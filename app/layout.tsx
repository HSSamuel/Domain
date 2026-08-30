import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BackToTop from "./components/BackToTop"; 
import { ToastProvider } from "./components/ToastProvider";
import PwaInstallButton from "./components/PwaInstallButton";

const inter = Inter({ subsets: ["latin"] });

// 1. Added Viewport for PWA theme colors and mobile scaling
export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 2. Updated Metadata to link the manifest and iOS app settings
export const metadata: Metadata = {
  title: "DomainAssess",
  description: "Interactive learning domain sorter for public sector training",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DomainAssess",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body 
        className={`${inter.className} min-h-screen flex flex-col bg-slate-50`} 
        suppressHydrationWarning
      >
        <ToastProvider>
          {children}
          <PwaInstallButton />
          <BackToTop />
        </ToastProvider>
      </body>
    </html>
  );
}