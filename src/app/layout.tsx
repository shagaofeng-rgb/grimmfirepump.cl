import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GRIMM PUMP | Sistemas contra incendio para Sudamérica",
  description: "Paquetes de bombeo contra incendio configurados para proyectos industriales y comerciales en Sudamérica.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-419"><body>{children}</body></html>;
}
