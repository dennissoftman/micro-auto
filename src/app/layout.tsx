import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "µAuto - Smart Mechanic Management",
  description:
    "Simple, offline-first client and maintenance management for small auto shops.",
  manifest: "/manifest.json", // We'll add this later for PWA
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans min-h-screen flex flex-col md:flex-row antialiased">
        <Providers>
          <Sidebar />
          {/* Main Content Area */}
          <main className="flex-1 p-6 md:p-10 animate-enter max-w-6xl mx-auto w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
