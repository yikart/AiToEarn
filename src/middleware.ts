import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log(request.url);

  return NextResponse.next();
}

export const config = {
  matcher: "/demo/:path*", // 处理所有路由
};
