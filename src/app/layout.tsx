import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "gear.show — show off your rig",
  description: "Create a shareable showcase of your gear. No signup, no BS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-900 text-ink-100">{children}</body>
    </html>
  );
}