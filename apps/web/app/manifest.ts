import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Geklix",
    short_name: "Geklix",
    description: "Operações de campo com foco em produtividade.",
    start_url: "/dashboard",
    id: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#22c55e",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
    related_applications: [
      {
        platform: "play",
        url: "https://play.google.com/store/apps/details?id=com.geklix.app",
        id: "com.geklix.app",
      },
    ],
  };
}
