import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/chat", "/dashboard", "/explorer"];
const PUBLIC_ROUTES = ["/login"];

export default function middleware(request: NextRequest) {
  return NextResponse.next();
}
