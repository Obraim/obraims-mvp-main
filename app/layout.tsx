import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://obraims-mvp.vercel.app";

export const viewport: Viewport = {
  themeColor: "#ffffff"
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Obraims | AI-powered loan origination",
  description:
    "Obraims helps lenders collect applications, documents, and AI-generated credit memos in one secure workflow.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Obraims | AI-powered loan origination",
    description:
      "Obraims helps lenders collect applications, documents, and AI-generated credit memos in one secure workflow.",
    type: "website",
    images: [
      {
        url: "/brand/obraims-logo-full-white-bg.png",
        width: 1200,
        height: 630,
        alt: "Obraims"
      }
    ]
  }
};

/**
 * Root layout: renders global CSS and metadata only.
 * The [locale]/layout.tsx child renders <html lang={locale}> and <body>
 * so that the correct lang attribute is set per locale.
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children as JSX.Element;
}
