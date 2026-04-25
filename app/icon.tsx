import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#E8513A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 22,
          fontWeight: 900,
          fontFamily: "Georgia, serif",
        }}
      >
        p
      </div>
    ),
    { ...size }
  );
}
