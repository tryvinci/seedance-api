import { ImageResponse } from "next/og";

export const alt = "SeedanceAPI — SeedDance & Seedream Models";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b1220",
          padding: 64,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#2563eb",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ color: "white", fontSize: 28, fontWeight: 600 }}>
            SeedanceAPI
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              color: "white",
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            SeedDance video &amp; Seedream image API
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 28 }}>
            Pay as you go · MCP · Agent-ready docs
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 22 }}>
          seedanceapi.us
        </div>
      </div>
    ),
    { ...size },
  );
}
