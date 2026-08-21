import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { designTokenHex } from "@/lib/design-tokens";
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

export const metadata: Metadata = {
  title: "Convites — Plataforma ciudadana de convites comunitarios",
  description:
    "Convites es una plataforma ciudadana de convites comunitarios en las zonas afectadas de Colombia. No somos fundación ni empresa: somos vecinos organizándonos.",
};

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
      lang="es"
      className={`${fraunces.variable} ${instrumentSans.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <GoogleAnalytics />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
