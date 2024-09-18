import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
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
		url: "https://flashcall.me",
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
			? new URL("https://flashcall.me")
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
