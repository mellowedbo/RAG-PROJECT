import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
  title: "NEXUS — Financial Intelligence Platform",
  description:
    "A multi-agent retrieval-augmented generation platform for enterprise financial document analysis. From 10-K filings to earnings calls — agentic workflows that reason, retrieve, and synthesize at scale.",
  keywords: [
    "RAG",
    "Agentic AI",
    "Financial Intelligence",
    "Document Analysis",
    "Vector Search",
    "Earnings Analysis",
    "Risk Assessment",
    "10-K Filings",
    "Compliance",
    "NEXUS",
  ],
  authors: [{ name: "NEXUS Platform" }],
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
