import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar/Navbar";
import { AppContextProvider } from "./appStateHook";

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
        <AppContextProvider>
          
          <Navbar />

          <div className="w-full h-screen overflow-auto">
            {children}
          </div>

          <Toaster />
        
        </AppContextProvider>
      </body>
    </html>
  );
}
