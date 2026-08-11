import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import NextTopLoader from "nextjs-toploader";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import DebugPanel from "@/components/shared/DebugPanel";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Creston Markets | Institutional-Grade Algorithmic Trading",
  description:
    "Access institutional-grade PAMM-powered algorithmic trading strategies. Creston Markets connects investors to professionally managed trading strategies.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Thin gold progress line at the very top of the viewport, no
            percentage text -- shown during route transitions and any
            navigation, matching the "premium site" loading feel. */}
        <NextTopLoader
          color="#D4AF37"
          height={2}
          showSpinner={false}
          shadow="0 0 10px #D4AF37,0 0 5px #D4AF37"
        />
        <ErrorBoundary>
          {children}
          <DebugPanel />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#111827",
                color: "#F9FAFB",
                border: "1px solid rgba(212,175,55,0.3)",
              },
            }}
          />
        </ErrorBoundary>
      </body>
    </html>
  );
}
