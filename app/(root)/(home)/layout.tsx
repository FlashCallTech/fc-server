import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import { Metadata } from "next";
import React, { ReactNode } from "react";

export const metadata: Metadata = {
	title: "FlashCall",
	description: "Application Connecting People",
	icons: {
		icon: "/icons/logoDarkCircle.png",
	},

	openGraph: {
		type: "article",
		url: "https://flashcall.vercel.app",
		title: "FlashCall",
		description: "Application Connecting People",
		images: "/icons/logoDarkCircle.png",
		siteName: "Flashcall.me",
		locale: "en_US",
	},

	twitter: {
		card: "summary_large_image",
		site: "https://flashcall.vercel.app",
		title: "FlashCall",
		description: "Application Connecting People",
		images: "/icons/logoDarkCircle.png",
		creator: "@johndoe",
	},
	metadataBase:
		process.env.NODE_ENV === "production"
			? new URL("https://flashcall.vercel.app")
			: new URL("http://localhost:3000"),
};

const HomeLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
	return (
		<main className="relative">
			<Navbar />
			<div className="flex">
				<Sidebar />
				<section className="flex min-h-screen flex-1 flex-col pt-24 md:px-10">
					<div className="w-full h-full relative">{children}</div>
				</section>
			</div>
		</main>
	);
};

export default HomeLayout;
