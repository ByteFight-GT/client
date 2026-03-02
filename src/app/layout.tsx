import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar/Navbar";
import { AppStateProvider } from "@/hooks/provider";
import { IPCWrapper } from "@/hooks/ipcWrapper";

export const metadata: Metadata = {
  title: "Bytefight Client 2026",
  description: "Bytefight Client 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className="flex antialiased">
        <AppStateProvider>
          <IPCWrapper>
            <Navbar />

            <div className="w-full h-screen overflow-auto">
              {children}
            </div>

            <Toaster />
          </IPCWrapper>
        </AppStateProvider>
      </body>
    </html>
  );
}
