import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlackMamba Insights",
  description: "Animated SoundCloud analytics for Iyari Gomez / BlackMamba Records"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
