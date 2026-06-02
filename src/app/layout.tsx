import type { Metadata, Viewport } from "next";
import "./globals.css";
import MainLayout from "@/components/layouts/MainLayout";

export const metadata: Metadata = {
  title: "FinControl - Gestión Financiera Inteligente",
  description: "Una aplicación PWA moderna para monitorear, gestionar y optimizar tus finanzas personales con un diseño premium y capacidades offline-first.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinControl",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#006c49",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        {/* Load all fonts for the Visual Customizer (Notion/Obsidian style) */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Nunito:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&display=swap" 
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="h-full antialiased selection:bg-[var(--primary)]/30">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
