import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURENZA — Organiza. Planea. Logra.",
  description: "Tu espacio personal y académico para organizar ideas, actividades y objetivos.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
