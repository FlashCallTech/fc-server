import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const protectedRoute = createRouteMatcher([
	"/meeting(.*)",
	"/feedback(.*)",
	"/previous",
	"/upcoming",
	"/personal-room",
	"/user-profile",
	"/profile/(.*)",
	"/payment",
	"/recharge(.*)",
]);

export default clerkMiddleware((auth, req) => {
	if (protectedRoute(req)) auth().protect();
});

export const config = {
	matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
