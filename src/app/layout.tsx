import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://grimmfirepump.cl"),
  title: "GRIMM PUMP | Sistemas contra incendio para Sudamérica",
  description: "Paquetes de bombeo contra incendio configurados para proyectos industriales y comerciales en Sudamérica.",
  icons: {
    icon: [{ url: "/assets/brand/grimm-pump-logo.png", type: "image/png" }],
    shortcut: ["/assets/brand/grimm-pump-logo.png"],
    apple: [{ url: "/assets/brand/grimm-pump-logo.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-419"><body>{children}</body></html>;
}
