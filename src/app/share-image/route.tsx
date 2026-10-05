import { ImageResponse } from "next/og";

export const dynamic = "force-static";

// A public, build-time PNG; no remote fonts, APIs, or credentials required.
export function GET() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f3f1eb", color: "#171717", padding: "64px 72px" }}>
      <div style={{ display: "flex", fontSize: 26, letterSpacing: 5 }}>MAREK BENDA</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", fontSize: 100, fontWeight: 700, letterSpacing: -5 }}>BendaLabs</div>
        <div style={{ display: "flex", fontSize: 68, letterSpacing: -3 }}>BendaRobotics</div>
      </div>
      <div style={{ display: "flex", borderTop: "2px solid #171717", paddingTop: 28, fontSize: 28 }}>Software / AI / Hardware / Robotics</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
