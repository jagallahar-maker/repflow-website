import OpenGraphImage from "./opengraph-image";

// The same image as the Open Graph preview (X / Twitter cards).
export const alt = "Repflow logo: a lime R on black";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return OpenGraphImage();
}
