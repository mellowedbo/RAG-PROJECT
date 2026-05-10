import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEXUS — Agentic Intelligence for Finance",
  description:
    "A multi-agent retrieval-augmented generation platform for enterprise financial document analysis. From 10-K filings to earnings calls — agentic workflows that reason, retrieve, and synthesize at scale.",
  keywords: [
    "RAG",
    "Agentic AI",
    "Financial Intelligence",
    "LanceDB",
    "Vector Search",
    "Earnings Analysis",
    "Risk Assessment",
    "ML Finance",
  ],
  authors: [{ name: "NEXUS Platform" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
