import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const protectedRoute = createRouteMatcher([
	"/meeting(.*)",
	"/previous",
	"/upcoming",
	"/personal-room",
	"/user-profile",
	"/profile/(.*)",
	"/creator/(.*)",
]);

export default clerkMiddleware((auth, req) => {
	if (protectedRoute(req)) auth().protect();
});

export const config = {
	matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
