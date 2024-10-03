"use client";

import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";

const HomeLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
	const pathname = usePathname();

	const creatorURL = localStorage.getItem("creatorURL");

	const isCreatorOrExpertPath = pathname.includes(`${creatorURL}`);

	return (
		<main className="relative">
			<Navbar />
			<div className="flex">
				<Sidebar isCreatorOrExpertPath={isCreatorOrExpertPath} />
				<section
					className={`flex min-h-screen flex-1 flex-col ${
						isCreatorOrExpertPath ? "pt-[75px] xl:pt-24" : "pt-24"
					} md:px-10`}
				>
					<div className="w-full h-full relative">{children}</div>
				</section>
			</div>
		</main>
	);
};

export default HomeLayout;
