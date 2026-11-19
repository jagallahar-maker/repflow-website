import { ImageResponse } from "next/og";
import { MARK_ASPECT, MARK_PATHS, MARK_VIEWBOX } from "@/components/brand/RepflowMark";

// The link preview for every page (texts, social): black, the lime R,
// "Repflow" and the tagline. Built once at build time.
export const alt = "Repflow logo: a lime R on black";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const markHeight = 300;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          gap: 72,
        }}
      >
        <svg
          width={Math.round(markHeight * MARK_ASPECT)}
          height={markHeight}
          viewBox={MARK_VIEWBOX}
          fill="#9EFD06"
        >
          {MARK_PATHS.map((d) => (
            <path key={d.slice(0, 12)} d={d} />
          ))}
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, color: "#ffffff", letterSpacing: -5, lineHeight: 1 }}>
            Repflow
          </div>
          <div style={{ fontSize: 40, color: "#a1a1aa", marginTop: 24 }}>
            The training app for everybody.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
