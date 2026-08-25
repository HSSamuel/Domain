import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BackToTop from "./components/BackToTop"; 
import { ToastProvider } from "./components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DomainAssess | Facilitator Dashboard",
  description: "Interactive learning domain sorter for public sector training",
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
          <BackToTop />
        </ToastProvider>
      </body>
    </html>
  );
}