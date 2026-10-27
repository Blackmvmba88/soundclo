import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlackMamba Music Platform",
  description:
    "Catálogo musical de Iyari Gomez · BlackMamba RECORDS, con el reproductor oficial de SoundCloud",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
