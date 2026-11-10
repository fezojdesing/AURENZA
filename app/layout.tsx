import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./auth-provider";

export const metadata: Metadata = {
  title: "AURENZA — Organiza. Planea. Logra.",
  description: "Tu espacio personal y académico para organizar ideas, actividades y objetivos.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><AuthProvider>{children}</AuthProvider></body></html>;
}
