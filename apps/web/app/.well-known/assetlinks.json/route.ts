import { NextResponse } from "next/server";

export async function GET() {
  const assetlinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.geklix.app",
        sha256_cert_fingerprints: [
          process.env.ANDROID_CERT_SHA256 ?? "TODO:REPLACE_WITH_YOUR_SIGNING_CERT_SHA256",
        ],
      },
    },
  ];

  return NextResponse.json(assetlinks, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
