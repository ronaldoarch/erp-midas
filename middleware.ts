import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/health", "/_next", "/favicon.ico", "/public"];

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
		return NextResponse.next();
	}
    // NextRequest.cookies não expõe keys(); use getAll() para iterar sobre os cookies
    const hasSupabaseAuthCookie = req.cookies
        .getAll()
        .some((cookie) => cookie.name.startsWith("sb-"));
	if (!hasSupabaseAuthCookie) {
		const url = new URL("/login", req.url);
		url.searchParams.set("redirect", pathname);
		return NextResponse.redirect(url);
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/(dashboard|clients|contracts|invoices|tasks|files|settings)(.*)", "/"],
};



