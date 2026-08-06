import { NextResponse, type NextRequest } from "next/server";

// The selected custom-development Webhook integration posts its validation and
// publishing payload to the configured domain root. Preserve the public GET /
// redirect while internally forwarding only root POST requests to the secured
// publishing route; request body, method and headers remain available there.
export function proxy(request: NextRequest) {
  if (request.method === "POST" && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/api/webhook/send_article", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: "/" };
