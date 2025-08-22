import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Header from "@/components/Header"; // Import Header

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Boost Your Business",
  description: "Sales and inventory management for small businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <Header /> {/* Add Header here */}
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
