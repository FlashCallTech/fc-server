import React, { Suspense } from "react";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "@smastrom/react-rating/style.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Metadata } from "next";
import MovePageToTop from "@/components/shared/MovePageToTop";

// Dynamic imports
const GoogleTagManager = React.lazy(() =>
	import("@next/third-parties/google").then((module) => ({
		default: module.GoogleTagManager,
	}))
);
const GoogleAnalytics = React.lazy(
	() => import("@/components/analytics/GoogleAnalytics")
);

export const metadata: Metadata = {
	title: "Flashcall.me",
	description: "Book your first consultation",
	icons: {
		icon: "/icons/logoDarkCircle.png",
	},
	openGraph: {
		type: "website",
		url: "https://flashcall.me",
		title: "FlashCall",
		description: "Book your first consultation",
		images: [
			{
				url: "https://flashcall.me/icons/metadataBg.png",
				width: 800,
				height: 600,
				alt: "FlashCall Logo",
			},
		],
		siteName: "Flashcall.me",
		locale: "en_US",
	},

	metadataBase: new URL("https://flashcall.me"),
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<Suspense fallback={null}>
				<GoogleAnalytics />
				<GoogleTagManager gtmId={`${process.env.NEXT_PUBLIC_MEASUREMENT_ID}`} />
			</Suspense>

			<TooltipProvider>
				<body className="overflow-y-scroll no-scrollbar">
					<Toaster />
					<MovePageToTop />
					{children}
				</body>
			</TooltipProvider>
		</html>
	);
}
