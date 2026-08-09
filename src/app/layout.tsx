import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://grimmfirepump.cl"),
  title: { default: "GRIMM PUMP | Sistemas contra incendio para proyectos en Chile", template: "%s | GRIMM PUMP" },
  description: "Información de sistemas de bombeo contra incendio para proyectos en Chile.",
  icons: { icon: [{ url: "/assets/brand/grimm-pump-logo.png", type: "image/png" }], shortcut: ["/assets/brand/grimm-pump-logo.png"], apple: [{ url: "/assets/brand/grimm-pump-logo.png", type: "image/png" }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID;
  return <html lang="es-CL"><head>{process.env.NEXT_PUBLIC_GSC_VERIFICATION ? <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_VERIFICATION} /> : null}{process.env.NEXT_PUBLIC_BING_VERIFICATION ? <meta name="msvalidate.01" content={process.env.NEXT_PUBLIC_BING_VERIFICATION} /> : null}</head><body>{children}{gaId ? <><Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive"/><Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}</Script></> : null}</body></html>;
}
