import { NextResponse } from "next/server";

export async function GET() {
  const association = {
    applinks: {
      apps: [],
      details: [
        {
          appID: "TEAM_ID.com.geklix.app",
          paths: ["*"],
        },
      ],
    },
    webcredentials: {
      apps: ["TEAM_ID.com.geklix.app"],
    },
  };

  return NextResponse.json(association, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
