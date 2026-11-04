import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "./lib/config";

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/booking/:path*", "/trips/:path*", "/admin/:path*"],
};
