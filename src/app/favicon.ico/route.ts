import { NextResponse } from "next/server";

// Some browsers and crawlers request this conventional path even when icon.png
// metadata is present. Reuse the controlled site icon instead of returning 404.
export function GET(request: Request) {
  return NextResponse.redirect(new URL("/icon.png", request.url), 308);
}

