import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper/index";
import Header from "@/components/Header/index";
import { BusinessProvider } from "@/context/BusinessContext"; // Import BusinessProvider

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
          <BusinessProvider>
            <Header />
            <main className="pt-16">{children}</main> {/* Add padding-top to avoid content being hidden behind the fixed header */}
          </BusinessProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
