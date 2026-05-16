import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthGate } from "@/components/auth-gate";
import { DbProvider } from "@/components/db-provider";
import { RestTimer } from "@/components/rest-timer";
import { ServiceWorkerRegistrar } from "@/components/sw-registrar";
import { SyncManager } from "@/components/sync-manager";
import { ToastContainer } from "@/components/toast-container";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Registro de entrenamiento de fuerza con sobrecarga progresiva automática",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gym Tracker",
  },
};

export const viewport: Viewport = {
  themeColor: "#070707",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <DbProvider>
          <AuthGate>{children}</AuthGate>
          <SyncManager />
          <RestTimer />
          <ToastContainer />
        </DbProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
