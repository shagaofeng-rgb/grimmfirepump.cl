import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GRIMM PUMP LATAM",
    short_name: "GRIMM PUMP",
    start_url: "/es",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#071b2d",
    icons: [{ src: "/assets/brand/grimm-pump-logo.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
