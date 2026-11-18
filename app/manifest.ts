import type { MetadataRoute } from "next";

/** Installed to a home screen: the lime R on black (public/icon-*.png,
 *  from the app's icon; the R sits inside the maskable safe zone). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Repflow",
    short_name: "Repflow",
    description: "Repflow coach dashboard",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
