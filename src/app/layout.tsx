import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { designTokenHex } from "@/lib/design-tokens";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = rootMetadata();

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: designTokenHex.background,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CO"
      className={`${fraunces.variable} ${instrumentSans.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <GoogleAnalytics />
        <AuthProvider>
          {children}
          <WhatsAppFloat />
        </AuthProvider>
      </body>
    </html>
  );
}
