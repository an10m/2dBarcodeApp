import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignalCode | 2D barcode operations",
  description: "A focused workspace for generating, scanning, and governing GS1 2D codes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
