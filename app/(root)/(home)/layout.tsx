import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import Footer from "@/components/shared/Footer";

import { Metadata } from "next";
import React, { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Flashcall.me",
	description: "Book your first consultation",
	icons: {
		icon: "/icons/logoDarkCircle.png",
	},

	openGraph: {
		type: "website",
		url: "https://app.flashcall.me",
		title: "FlashCall",
		description: "Book your first consultation",
		images: [
			{
				url: "/icons/metadataBg.png",
				width: 800,
				height: 600,
				alt: "FlashCall Logo",
			},
		],
		siteName: "Flashcall.me",
		locale: "en_US",
	},

	metadataBase:
		process.env.NODE_ENV === "production"
			? new URL("https://app.flashcall.me")
			: new URL("http://localhost:3000"),
};

const HomeLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
	return (
		<main className="relative">
			<Navbar />
			<div className="flex">
				<Sidebar />
				<section className="flex flex-1 flex-col gap-5">
					<div className="min-h-screen w-full h-full relative pt-24 md:px-10">
						{children}
					</div>
					<footer className="flex flex-col items-center justify-center w-full bg-green-1">
						<Footer />
					</footer>
				</section>
			</div>
		</main>
	);
};

export default HomeLayout;
