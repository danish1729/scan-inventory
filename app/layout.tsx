import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScanStock",
  description: "Simple Inventory Management",
  manifest: "/manifest.json", // Optional for PWA later
};

// Prevents user from zooming in on inputs on mobile
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Mobile Container Wrapper */}
        <main className="min-h-screen w-full bg-slate-50">
          <div className="mx-auto min-h-screen w-full bg-white shadow-2xl overflow-hidden relative">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
